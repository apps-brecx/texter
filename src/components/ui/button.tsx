"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The primary button is inverted — near-black navy on a light page, near-white
 * on a dark one. It never fails contrast, and it keeps the brand green free to
 * mean something.
 */
const VARIANTS = {
  primary:
    "bg-primary text-on-primary border-transparent hover:bg-primary-hover shadow-card disabled:hover:bg-primary",
  accent:
    "bg-accent text-white border-transparent hover:bg-accent-hover shadow-card dark:text-[color:var(--on-primary)]",
  secondary:
    "bg-surface text-ink border-line hover:border-line-strong hover:bg-surface-2 shadow-card",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-ink",
  danger: "bg-transparent text-danger border-line hover:bg-danger-soft hover:border-danger/40",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-[13px] rounded-xs gap-1.5",
  md: "h-10 px-4 text-[14px] rounded-sm gap-2",
  lg: "h-12 px-5 text-[15px] rounded-md gap-2",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "u-tap inline-flex items-center justify-center border font-semibold whitespace-nowrap",
        "transition-[background-color,border-color,color] duration-150",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Same button, wired to the enclosing form's pending state. */
export function SubmitButton({ children, ...props }: Omit<ButtonProps, "type" | "loading">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
