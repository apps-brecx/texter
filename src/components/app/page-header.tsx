import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * iOS large-title header: the title is the biggest thing on the screen and
 * everything else defers to it.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface px-5 pt-7 pb-6 sm:px-8 sm:pt-10 sm:pb-8 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? <p className="u-eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="u-display text-[30px] text-ink sm:text-[38px]">{title}</h1>
          {description ? (
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/**
 * Standard page body. The gutter/max-width nesting has to match PageHeader
 * exactly or the title and the content below it don't line up.
 */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <div className={cn("mx-auto max-w-5xl", className)}>{children}</div>
    </div>
  );
}
