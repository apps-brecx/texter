import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";

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

  return (
    <div className="lg:grid lg:grid-cols-[264px_1fr]">
      <Sidebar
        user={{ name: user.name, email: user.email }}
        workspaces={memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role }))}
        activeWorkspaceId={workspace.id}
        pendingLessons={pendingLessons}
      />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
