"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, LogOut, Plus } from "lucide-react";
import { Sheet } from "@/components/app/sheet";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { switchWorkspace } from "@/lib/actions/workspace";

export type Workspace = { id: string; name: string; role: string };

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  compact = false,
}: {
  workspaces: Workspace[];
  activeId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const active = workspaces.find((workspace) => workspace.id === activeId) ?? workspaces[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "u-tap flex items-center gap-2 text-left",
          compact
            ? "rounded-full border border-line bg-surface px-2.5 py-1"
            : "w-full rounded-sm border border-line bg-surface-2 px-2.5 py-2 hover:border-line-strong",
        )}
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-[7px] bg-primary font-bold text-on-primary",
            compact ? "size-5 text-[9px]" : "size-7 text-[11px]",
          )}
        >
          {initials(active.name)}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate font-semibold text-ink",
              compact ? "text-[13px]" : "text-[13.5px]",
            )}
          >
            {active.name}
          </span>
          {compact ? null : (
            <span className="block text-[11px] text-faint capitalize">{active.role.toLowerCase()}</span>
          )}
        </span>
        <ChevronsUpDown className={cn("shrink-0 text-faint", compact ? "size-3" : "size-3.5")} aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Workspaces">
        <ul className="space-y-1">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <form action={switchWorkspace}>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <button
                  type="submit"
                  className="u-tap flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-surface-2 text-[11px] font-bold text-ink">
                    {initials(workspace.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{workspace.name}</span>
                    <span className="block text-[11.5px] text-faint capitalize">{workspace.role.toLowerCase()}</span>
                  </span>
                  {workspace.id === active.id ? <Check className="size-4 text-accent" aria-hidden /> : null}
                </button>
              </form>
            </li>
          ))}
        </ul>

        <Link
          href="/onboarding"
          onClick={() => setOpen(false)}
          className="u-tap mt-2 flex items-center gap-3 rounded-sm border-t border-line px-3 py-3 text-[14px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Plus className="size-4" aria-hidden />
          New workspace
        </Link>
      </Sheet>
    </>
  );
}

export function AccountMenu({ user }: { user: { name: string; email: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Account"
        className="u-tap grid size-8 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent"
      >
        {initials(user.name)}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={user.name}>
        <p className="px-3 pb-4 text-[13px] text-muted">{user.email}</p>

        <div className="px-3 pb-3">
          <p className="u-eyebrow mb-2">Appearance</p>
          <ThemeToggle />
        </div>

        <form action={logout} className="px-3 pt-1">
          <button
            type="submit"
            className="u-tap flex w-full items-center gap-3 rounded-sm border border-line px-3 py-3 text-[14px] font-semibold text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </Sheet>
    </>
  );
}
