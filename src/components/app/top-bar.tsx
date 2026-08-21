import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AccountMenu, WorkspaceSwitcher, type Workspace } from "@/components/app/workspace-menu";

/** Mobile only. Sits above the notch, frosted, and stays put while you scroll. */
export function TopBar({
  user,
  workspaces,
  activeWorkspaceId,
}: {
  user: { name: string; email: string };
  workspaces: Workspace[];
  activeWorkspaceId: string;
}) {
  return (
    <header
      className="u-blur sticky top-0 z-40 border-b border-line lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-13 items-center gap-3 px-4">
        <Link href="/dashboard" aria-label="Texter home" className="u-tap">
          <Mark className="size-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <WorkspaceSwitcher workspaces={workspaces} activeId={activeWorkspaceId} compact />
        </div>
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
