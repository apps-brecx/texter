import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/top-bar";
import { TabBar } from "@/components/app/tab-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user, workspace } = await requireWorkspace();

  const [memberships, pendingLessons] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      include: { workspace: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.brainEntry.count({ where: { workspaceId: workspace.id, status: "PENDING" } }),
  ]);

  const account = { name: user.name, email: user.email };
  const workspaces = memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    role: membership.role,
  }));

  return (
    <div className="lg:grid lg:grid-cols-[268px_1fr]">
      <Sidebar
        user={account}
        workspaces={workspaces}
        activeWorkspaceId={workspace.id}
        pendingLessons={pendingLessons}
      />

      <div className="min-w-0">
        <TopBar user={account} workspaces={workspaces} activeWorkspaceId={workspace.id} />
        {/* Bottom padding clears the tab bar on mobile. */}
        <main className="min-w-0 pb-[calc(54px+env(safe-area-inset-bottom)+8px)] lg:pb-0">
          {children}
        </main>
      </div>

      <TabBar pendingLessons={pendingLessons} />
    </div>
  );
}
