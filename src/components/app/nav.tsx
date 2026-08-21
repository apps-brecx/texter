"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Clock, House, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/history", label: "History", icon: Clock },
  { href: "/brain", label: "The brain", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function Nav({ pendingLessons }: { pendingLessons: number }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      <Link
        href="/new"
        className="u-tap mb-3 flex h-10 items-center gap-2 rounded-sm bg-primary px-3 text-[14px] font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-hover"
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
              "relative flex h-9 items-center gap-2.5 rounded-sm px-3 text-[13.5px] transition-colors",
              active
                ? "bg-surface-2 font-semibold text-ink"
                : "font-medium text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {active ? (
              <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" aria-hidden />
            ) : null}
            <Icon className={cn("size-[17px] shrink-0", active && "text-accent")} aria-hidden />
            <span className="flex-1">{label}</span>
            {href === "/brain" && pendingLessons > 0 ? (
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-bold text-accent">
                {pendingLessons}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
