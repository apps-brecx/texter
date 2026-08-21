"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, LogOut, Menu, Plus, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Nav } from "@/components/app/nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { switchWorkspace } from "@/lib/actions/workspace";

export type SidebarProps = {
  user: { name: string; email: string };
  workspaces: { id: string; name: string; role: string }[];
  activeWorkspaceId: string;
  pendingLessons: number;
};

export function Sidebar({ user, workspaces, activeWorkspaceId, pendingLessons }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-lg border border-line text-muted"
          aria-label="Open menu"
        >
          <Menu className="size-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-surface",
          "transition-transform duration-300 lg:sticky lg:top-0 lg:h-svh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-3 pb-3">
          <WorkspacePicker workspaces={workspaces} active={active} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 scroll-slim">
          <Nav pendingLessons={pendingLessons} />
        </div>

        <div className="space-y-3 border-t border-line p-3">
          <ThemeToggle />
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{user.name}</span>
              <span className="block truncate text-[11.5px] text-faint">{user.email}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Sign out"
                className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function WorkspacePicker({
  workspaces,
  active,
}: {
  workspaces: SidebarProps["workspaces"];
  active: SidebarProps["workspaces"][number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-line-strong"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-semibold text-paper">
          {initials(active.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">{active.name}</span>
          <span className="block text-[11px] text-faint capitalize">{active.role.toLowerCase()}</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-faint" aria-hidden />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-float">
          {workspaces.map((workspace) => (
            <form key={workspace.id} action={switchWorkspace}>
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
              >
                <span className="flex-1 truncate">{workspace.name}</span>
                {workspace.id === active.id ? <Check className="size-3.5 text-accent" aria-hidden /> : null}
              </button>
            </form>
          ))}
          <Link
            href="/onboarding"
            className="mt-1 flex items-center gap-2 rounded-md border-t border-line px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Plus className="size-3.5" aria-hidden />
            New workspace
          </Link>
        </div>
      ) : null}
    </div>
  );
}
