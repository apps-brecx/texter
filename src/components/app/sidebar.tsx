import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/mark";
import { Nav } from "@/components/app/nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { WorkspaceSwitcher, type Workspace } from "@/components/app/workspace-menu";
import { initials } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

/** Desktop only — below lg the shell uses a top bar and a bottom tab bar. */
export function Sidebar({
  user,
  workspaces,
  activeWorkspaceId,
  pendingLessons,
}: {
  user: { name: string; email: string };
  workspaces: Workspace[];
  activeWorkspaceId: string;
  pendingLessons: number;
}) {
  return (
    <aside className="sticky top-0 hidden h-svh flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" className="u-tap">
          <Logo size="md" />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <WorkspaceSwitcher workspaces={workspaces} activeId={activeWorkspaceId} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 scroll-slim">
        <Nav pendingLessons={pendingLessons} />
      </div>

      <div className="space-y-3 border-t border-line p-3">
        <ThemeToggle />
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
            <span className="block truncate text-[11.5px] text-faint">{user.email}</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="u-tap grid size-8 place-items-center rounded-sm text-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
