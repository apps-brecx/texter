import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import {
  AiCard,
  ProfileCard,
  TeamCard,
  VoicesCard,
  WorkspaceCard,
  type Invite,
  type Member,
} from "@/components/app/settings-ui";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { workspace, user, role } = await requireWorkspace();
  const canManage = role !== "MEMBER";

  const [styles, memberships, invites] = await Promise.all([
    db.styleProfile.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    db.membership.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    canManage
      ? db.invite.findMany({
          where: { workspaceId: workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const members: Member[] = memberships.map((membership) => ({
    membershipId: membership.id,
    userId: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    joinedAt: membership.createdAt.toISOString(),
    isYou: membership.user.id === user.id,
  }));

  const pendingInvites: Invite[] = invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    createdAt: invite.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="How this workspace works"
        description="Context, voices, people and the model behind it all."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8 sm:px-10">
        <ProfileCard name={user.name} email={user.email} />

        {canManage ? (
          <WorkspaceCard
            values={{
              name: workspace.name,
              industry: workspace.industry,
              audience: workspace.audience,
              brandNotes: workspace.brandNotes,
              region: workspace.region,
            }}
          />
        ) : null}

        <VoicesCard styles={styles} canManage={canManage} />

        <TeamCard members={members} invites={pendingInvites} actorRole={role} />

        {canManage ? (
          <AiCard
            provider={workspace.aiProvider}
            model={workspace.aiModel}
            anthropicReady={Boolean(process.env.ANTHROPIC_API_KEY)}
            openaiReady={Boolean(process.env.OPENAI_API_KEY)}
          />
        ) : null}
      </div>
    </>
  );
}
