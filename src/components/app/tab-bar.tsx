"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Clock, House, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/history", label: "History", icon: Clock },
  { href: "/new", label: "New", icon: Plus, primary: true },
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

/** The mobile bottom bar. Fixed, frosted, and clear of the home indicator. */
export function TabBar({ pendingLessons }: { pendingLessons: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="u-blur fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {TABS.map(({ href, label, icon: Icon, ...tab }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const primary = "primary" in tab && tab.primary;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="u-tap flex h-[54px] flex-col items-center justify-center gap-1"
              >
                <span className="relative">
                  {primary ? (
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-[11px] bg-primary text-on-primary shadow-card",
                        "transition-transform duration-150",
                        active && "scale-105",
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={2.4} aria-hidden />
                    </span>
                  ) : (
                    <Icon
                      className={cn("size-[21px]", active ? "text-accent" : "text-faint")}
                      strokeWidth={active ? 2.3 : 1.9}
                      aria-hidden
                    />
                  )}

                  {href === "/brain" && pendingLessons > 0 ? (
                    <span className="absolute -top-0.5 -right-1.5 grid min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9.5px] leading-[15px] font-bold text-white dark:text-[color:var(--on-primary)]">
                      {pendingLessons > 9 ? "9+" : pendingLessons}
                    </span>
                  ) : null}
                </span>

                <span
                  className={cn(
                    "text-[10px] leading-none font-semibold tracking-[-0.01em]",
                    active ? "text-accent" : "text-faint",
                    primary && "text-ink",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
