import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const RELATIVE: [limit: number, divisor: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60_000, 1_000, "second"],
  [3_600_000, 60_000, "minute"],
  [86_400_000, 3_600_000, "hour"],
  [604_800_000, 86_400_000, "day"],
  [2_629_800_000, 604_800_000, "week"],
  [31_557_600_000, 2_629_800_000, "month"],
];

export function timeAgo(date: Date | string) {
  const then = typeof date === "string" ? new Date(date) : date;
  const diff = then.getTime() - Date.now();
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  for (const [limit, divisor, unit] of RELATIVE) {
    if (abs < limit) return fmt.format(Math.round(diff / divisor), unit);
  }
  return fmt.format(Math.round(diff / 31_557_600_000), "year");
}

/** A Date n days back. Lives here so components stay pure. */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
