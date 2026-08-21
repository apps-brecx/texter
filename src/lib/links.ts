import "server-only";
import { db } from "@/lib/db";
import { hashToken, newToken } from "@/lib/auth";

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Deliberately NOT a server action — anything exported from a "use server"
 * module is a public POST endpoint, and a mintable reset link is an account
 * takeover. Callers must have already checked who is asking.
 */
export async function createResetLink(userId: string) {
  const token = newToken();
  await db.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  await db.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3_600_000) },
  });
  return `${appUrl()}/reset-password?token=${token}`;
}
