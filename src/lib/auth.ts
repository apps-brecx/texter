import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "texter_session";
const WORKSPACE_COOKIE = "texter_workspace";
const SESSION_DAYS = 30;

// ------------------------------------------------------------------ tokens

/** Random, URL-safe, and only ever stored as a hash. */
export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------------------------------- session

export async function startSession(userId: string, userAgent?: string | null) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.authSession.create({
    data: { userId, tokenHash: hashToken(token), userAgent: userAgent?.slice(0, 255) ?? null, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
  jar.delete(WORKSPACE_COOKIE);
}

/** Signs every session of a user out — used after a password change. */
export async function revokeAllSessions(userId: string) {
  await db.authSession.deleteMany({ where: { userId } });
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// --------------------------------------------------------------- workspace

export type ActiveWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: Role;
};

/**
 * The workspace the user is looking at: whatever the cookie points to, as long
 * as they're still a member of it, otherwise their first one.
 */
export const getActiveMembership = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const jar = await cookies();
  const preferred = jar.get(WORKSPACE_COOKIE)?.value;
  return memberships.find((m) => m.workspaceId === preferred) ?? memberships[0];
});

export async function requireWorkspace() {
  const user = await requireUser();
  const membership = await getActiveMembership();
  if (!membership) redirect("/onboarding");
  return { user, membership, workspace: membership.workspace, role: membership.role };
}

export async function requireAdmin() {
  const ctx = await requireWorkspace();
  if (ctx.role === "MEMBER") redirect("/dashboard");
  return ctx;
}

export async function setActiveWorkspace(workspaceId: string) {
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const RANK: Record<Role, number> = { MEMBER: 1, ADMIN: 2, OWNER: 3 };
