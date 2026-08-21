"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An iOS-style bottom sheet: rounded top corners, a grabber, and a backdrop
 * that dims the page. On desktop it centres instead of sliding up.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling behind the sheet.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[#0b1119]/40 backdrop-blur-[2px] u-fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md border border-line bg-surface shadow-float",
          "rounded-t-sheet sm:rounded-sheet sm:mb-0",
          "u-sheet-in max-h-[85svh] overflow-y-auto scroll-slim",
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <div className="sticky top-0 z-10 u-blur rounded-t-sheet px-5 pt-2.5 pb-3">
          <span className="mx-auto mb-3 block h-1 w-9 rounded-full bg-line-strong sm:hidden" />
          {title ? <p className="u-title text-[16px] text-ink">{title}</p> : null}
        </div>
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}
