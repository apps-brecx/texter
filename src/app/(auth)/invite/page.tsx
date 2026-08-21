import Link from "next/link";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { AcceptInviteForm } from "@/components/auth/forms";
import { Alert } from "@/components/ui/surface";

export const metadata = { title: "Join a workspace" };

export default async function InvitePage({ searchParams }: PageProps<"/invite">) {
  const { token } = await searchParams;

  const invite =
    typeof token === "string" && token.length > 0
      ? await db.invite.findUnique({
          where: { tokenHash: hashToken(token) },
          include: { workspace: true },
        })
      : null;

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <div className="space-y-4">
        <h1 className="u-display text-[30px] text-ink">This invite is no longer valid</h1>
        <Alert>
          It may have been used already or expired. Ask an admin on the team to send you a fresh one.
        </Alert>
        <Link href="/login" className="text-[13px] font-semibold text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const existing = await db.user.findUnique({ where: { email: invite.email } });

  return (
    <AcceptInviteForm
      token={token as string}
      workspaceName={invite.workspace.name}
      email={invite.email}
      isExistingUser={Boolean(existing)}
    />
  );
}
