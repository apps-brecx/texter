import { cn } from "@/lib/utils";

/**
 * The Texter mark: a slab T with a leaf growing off its right arm.
 *
 * Drawn rather than imported so it inherits the theme (the T follows the text
 * colour, the leaf stays brand green) and so the loader can animate its parts.
 */
export function Mark({
  className,
  animate = "none",
}: {
  className?: string;
  /** grow: plays once on mount. breathe: loops, for loading states. */
  animate?: "none" | "grow" | "breathe";
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Texter"
      data-animate={animate}
    >
      <path
        className="mark-t"
        fill="currentColor"
        d="M3 13V12.4A8.4 8.4 0 0 1 11.4 4H27v9h-7v21.5A1.5 1.5 0 0 1 18.5 36h-6A1.5 1.5 0 0 1 11 34.5V13H3Z"
      />
      <path
        className="mark-leaf"
        fill="var(--leaf)"
        d="M24.4 14.1C24.4 6.9 30.5 1 38 1c0 7.2-6.1 13.1-13.6 13.1Z"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-[-0.03em] text-ink", className)}>Texter</span>
  );
}

export function Logo({
  className,
  size = "md",
  animate = "none",
  wordmark = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: "none" | "grow" | "breathe";
  wordmark?: boolean;
}) {
  const marks = { sm: "size-5", md: "size-6", lg: "size-8", xl: "size-12" };
  const words = { sm: "text-[15px]", md: "text-[18px]", lg: "text-[24px]", xl: "text-[34px]" };

  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <Mark className={marks[size]} animate={animate} />
      {wordmark ? <Wordmark className={words[size]} /> : null}
    </span>
  );
}

/**
 * Full-bleed loading screen. Used by route-level loading.tsx files, so it has
 * to be CSS-only — no client component, no JavaScript.
 */
export function Splash({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[60svh] place-items-center px-6 py-20">
      <div className="flex flex-col items-center">
        <Mark className="size-12" animate="breathe" />
        {label ? (
          <p className="mt-5 text-[14px] text-muted u-fade-loop">{label}</p>
        ) : null}
      </div>
    </div>
  );
}
