"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { seedWorkspace } from "@/lib/seed";
import { slugify } from "@/lib/utils";
import { createResetLink } from "@/lib/links";
import type { FormState } from "@/lib/form-state";
import {
  endSession,
  hashPassword,
  hashToken,
  revokeAllSessions,
  setActiveWorkspace,
  startSession,
  verifyPassword,
} from "@/lib/auth";

const email = z.string().trim().toLowerCase().email("That doesn't look like an email address.");
const password = z.string().min(10, "Use at least 10 characters — this protects your whole team.");
const name = z.string().trim().min(2, "Tell us your name.");

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

// ------------------------------------------------------------------ signup

const RegisterSchema = z.object({
  name,
  email,
  password,
  workspaceName: z.string().trim().min(2, "Give your workspace a name."),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const input = parsed.data;

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return { error: "That email already has an account. Sign in instead." };

  // Hashing is deliberately slow, so do it before opening the transaction —
  // otherwise a connection is held for the whole bcrypt cost.
  const passwordHash = await hashPassword(input.password);

  // Resolved up front: querying the outer client from inside the transaction
  // below would wait on a connection the transaction itself is holding.
  const slug = await uniqueSlug(input.workspaceName);

  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash, isSuperAdmin: true },
    });

    const workspace = await tx.workspace.create({
      data: { name: input.workspaceName, slug },
    });

    await tx.membership.create({
      data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
    });
    await tx.activityLog.create({
      data: { workspaceId: workspace.id, userId: user.id, action: "workspace.created", detail: workspace.name },
    });

    return { workspaceId: workspace.id, userId: user.id };
  });

  await seedWorkspace(created.workspaceId, created.userId);
  await startSession(created.userId, (await headers()).get("user-agent"));
  await setActiveWorkspace(created.workspaceId);
  redirect("/dashboard");
}

async function uniqueSlug(source: string) {
  const base = slugify(source) || "workspace";
  for (let attempt = 0; ; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db.workspace.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
}

// ------------------------------------------------------------------- login

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Same message either way so this can't be used to enumerate accounts.
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) return { error: "Wrong email or password." };

  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  await startSession(user.id, (await headers()).get("user-agent"));

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (membership) await setActiveWorkspace(membership.workspaceId);

  redirect(membership ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ---------------------------------------------------------- password reset

export async function requestReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const url = await createResetLink(user.id);
    const sent = await sendMail({
      to: user.email,
      subject: "Reset your Texter password",
      heading: "Set a new password",
      body: "This link works once and expires in an hour. If you didn't ask for it, you can ignore this email.",
      cta: { label: "Choose a new password", url },
    });
    // Without an email provider the link has to reach a human somehow. The
    // server log is the one channel that isn't exposed to whoever submitted
    // the form, so an attacker can't harvest a link for someone else's inbox.
    if (!sent.delivered) console.info(`[texter] password reset for ${user.email}: ${url}`);
  }

  return {
    notice:
      "If that email has an account, a reset link is on its way. Check spam if it's slow — or ask an admin to send you one from Settings.",
  };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ token: z.string().min(1), password, confirm: z.string() })
    .refine((value) => value.password === value.confirm, {
      message: "The two passwords don't match.",
      path: ["confirm"],
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "That link has expired. Ask for a new one." };
  }

  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  await revokeAllSessions(record.userId);

  redirect("/login?reset=1");
}

// ------------------------------------------------------------------ invite

const AcceptSchema = z.object({ token: z.string().min(1), name, password });

export async function acceptInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = AcceptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const invite = await db.invite.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: "This invite has expired. Ask your admin to send a new one." };
  }

  const existing = await db.user.findUnique({ where: { email: invite.email } });

  // Holding the link proves you got the email, not that you own the account.
  // If there's already an account on that address, the password still gates it.
  if (existing && !(await verifyPassword(parsed.data.password, existing.passwordHash))) {
    return {
      error: `${invite.email} already has a Texter account. Enter that account's password to join, or reset it first.`,
    };
  }

  const passwordHash = existing ? null : await hashPassword(parsed.data.password);

  const userId = await db.$transaction(async (tx) => {
    const user =
      existing ??
      (await tx.user.create({
        data: { name: parsed.data.name, email: invite.email, passwordHash: passwordHash! },
      }));

    await tx.membership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId: invite.workspaceId } },
      create: { userId: user.id, workspaceId: invite.workspaceId, role: invite.role },
      update: { role: invite.role },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.activityLog.create({
      data: { workspaceId: invite.workspaceId, userId: user.id, action: "member.joined", detail: user.email },
    });

    return user.id;
  });

  await startSession(userId, (await headers()).get("user-agent"));
  await setActiveWorkspace(invite.workspaceId);
  redirect("/dashboard");
}
