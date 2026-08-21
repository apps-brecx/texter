"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { seedWorkspace } from "@/lib/seed";
import { slugify } from "@/lib/utils";
import { hashToken, newToken, requireAdmin, requireUser, requireWorkspace, setActiveWorkspace, RANK } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { appUrl, createResetLink } from "@/lib/links";

export async function switchWorkspace(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (!membership) return;

  await setActiveWorkspace(workspaceId);
  redirect("/dashboard");
}

export async function createWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({ name: z.string().trim().min(2, "Give the workspace a name.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const base = slugify(parsed.data.name) || "workspace";
  let slug = base;
  for (let n = 2; await db.workspace.findUnique({ where: { slug } }); n += 1) slug = `${base}-${n}`;

  const workspace = await db.workspace.create({
    data: {
      name: parsed.data.name,
      slug,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await seedWorkspace(workspace.id, user.id);
  await setActiveWorkspace(workspace.id);
  redirect("/dashboard");
}

// ---------------------------------------------------------------- settings

const SettingsSchema = z.object({
  name: z.string().trim().min(2, "Give the workspace a name."),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  audience: z.string().trim().max(400).optional().or(z.literal("")),
  brandNotes: z.string().trim().max(4000).optional().or(z.literal("")),
  region: z.string().trim().min(2).max(40),
});

export async function updateWorkspace(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace } = await requireAdmin();
  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry || null,
      audience: parsed.data.audience || null,
      brandNotes: parsed.data.brandNotes || null,
      region: parsed.data.region,
    },
  });

  revalidatePath("/settings");
  return { notice: "Workspace saved." };
}

const AiSchema = z.object({
  aiProvider: z.enum(["anthropic", "openai"]),
  aiModel: z.string().trim().min(2, "Enter a model name."),
});

export async function updateAiSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace } = await requireAdmin();
  const parsed = AiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.workspace.update({ where: { id: workspace.id }, data: parsed.data });
  revalidatePath("/settings");
  return { notice: `Now writing with ${parsed.data.aiModel}.` };
}

// -------------------------------------------------------------------- team

export async function inviteMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace, user } = await requireAdmin();
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("That doesn't look like an email address."),
      role: z.enum(["ADMIN", "MEMBER"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const alreadyIn = await db.membership.findFirst({
    where: { workspaceId: workspace.id, user: { email: parsed.data.email } },
  });
  if (alreadyIn) return { error: `${parsed.data.email} is already in this workspace.` };

  const token = newToken();
  await db.invite.deleteMany({ where: { workspaceId: workspace.id, email: parsed.data.email, acceptedAt: null } });
  await db.invite.create({
    data: {
      workspaceId: workspace.id,
      email: parsed.data.email,
      role: parsed.data.role,
      tokenHash: hashToken(token),
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  const url = `${appUrl()}/invite?token=${token}`;
  const sent = await sendMail({
    to: parsed.data.email,
    subject: `Join ${workspace.name} on Texter`,
    heading: `${user.name} added you to ${workspace.name}`,
    body: "Texter is where the team checks marketing copy before it ships. This link is good for seven days.",
    cta: { label: "Set up your account", url },
  });

  revalidatePath("/settings");
  return {
    notice: sent.delivered
      ? `Invite emailed to ${parsed.data.email}.`
      : `Invite created. Email isn't configured, so send them this link yourself: ${url}`,
  };
}

export async function revokeInvite(formData: FormData) {
  const { workspace } = await requireAdmin();
  await db.invite.deleteMany({
    where: { id: String(formData.get("inviteId") ?? ""), workspaceId: workspace.id },
  });
  revalidatePath("/settings");
}

export async function changeRole(formData: FormData) {
  const { workspace, role: actorRole } = await requireAdmin();
  const membershipId = String(formData.get("membershipId") ?? "");
  const nextRole = String(formData.get("role") ?? "") as "OWNER" | "ADMIN" | "MEMBER";
  if (!["OWNER", "ADMIN", "MEMBER"].includes(nextRole)) return;

  const target = await db.membership.findFirst({ where: { id: membershipId, workspaceId: workspace.id } });
  if (!target) return;
  // You can't promote someone above yourself, or demote someone above you.
  if (RANK[actorRole] < RANK[target.role] || RANK[actorRole] < RANK[nextRole]) return;
  if (target.role === "OWNER" && (await countOwners(workspace.id)) === 1) return;

  await db.membership.update({ where: { id: membershipId }, data: { role: nextRole } });
  revalidatePath("/settings");
}

export async function removeMember(formData: FormData) {
  const { workspace, user, role: actorRole } = await requireAdmin();
  const membershipId = String(formData.get("membershipId") ?? "");

  const target = await db.membership.findFirst({ where: { id: membershipId, workspaceId: workspace.id } });
  if (!target || target.userId === user.id) return;
  if (RANK[actorRole] < RANK[target.role]) return;
  if (target.role === "OWNER" && (await countOwners(workspace.id)) === 1) return;

  await db.membership.delete({ where: { id: membershipId } });
  revalidatePath("/settings");
}

/**
 * Admins can hand out a reset link directly. This is the escape hatch for
 * teams with no email provider wired up.
 */
export async function adminResetLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const { workspace } = await requireAdmin();
  const membershipId = String(formData.get("membershipId") ?? "");

  const target = await db.membership.findFirst({
    where: { id: membershipId, workspaceId: workspace.id },
    include: { user: true },
  });
  if (!target) return { error: "That person isn't in this workspace." };

  const url = await createResetLink(target.userId);
  const sent = await sendMail({
    to: target.user.email,
    subject: "Reset your Texter password",
    heading: "Set a new password",
    body: "An admin on your team started this. The link works once and expires in an hour.",
    cta: { label: "Choose a new password", url },
  });

  return {
    notice: sent.delivered
      ? `Reset link emailed to ${target.user.email}.`
      : `Send ${target.user.name} this link — it expires in an hour: ${url}`,
  };
}

async function countOwners(workspaceId: string) {
  return db.membership.count({ where: { workspaceId, role: "OWNER" } });
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireWorkspace();
  const parsed = z
    .object({ name: z.string().trim().min(2, "Tell us your name.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/settings");
  return { notice: "Profile saved." };
}
