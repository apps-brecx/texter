"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Clock, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: Clock },
  { href: "/brain", label: "The brain", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Nav({ pendingLessons }: { pendingLessons: number }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/new"
        className={cn(
          "mb-3 flex h-10 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent",
          "shadow-card transition-colors hover:bg-accent-hover",
        )}
      >
        <Sparkles className="size-4" aria-hidden />
        New review
      </Link>

      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13.5px] transition-colors",
              active
                ? "bg-surface-3 font-medium text-ink"
                : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {href === "/brain" && pendingLessons > 0 ? (
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-accent">
                {pendingLessons}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
