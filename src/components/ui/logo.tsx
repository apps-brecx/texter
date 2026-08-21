import { cn } from "@/lib/utils";

/**
 * A proof mark: the caret a copy editor draws to insert a correction.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid size-7 place-items-center rounded-[7px] bg-accent text-on-accent">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path d="M4 19h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M6.5 14.5 12 6l5.5 8.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="u-display text-[19px] text-ink">Texter</span>
    </span>
  );
}
