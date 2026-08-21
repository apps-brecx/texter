"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

const KEY = "texter-theme";
const EVENT = "texter-theme-change";

// localStorage is the source of truth (an inline script in the root layout
// applies it before first paint), so read it as an external store rather than
// syncing it into state after mount.
function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  // The server can't know the preference, so it always renders "system" and the
  // first client read corrects it.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else {
        root.classList.add(next);
        localStorage.setItem(KEY, next);
      }
    } catch {
      // Storage blocked — the class still applies for this page view.
      if (next !== "system") root.classList.add(next);
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return (
    <div className="flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => apply(value)}
          aria-label={label}
          aria-pressed={theme === value}
          className={cn(
            "grid h-7 flex-1 place-items-center rounded-[6px] transition-colors",
            theme === value ? "bg-surface-3 text-ink" : "text-faint hover:text-muted",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
