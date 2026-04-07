/**
 * dates.ts — Date formatting utilities.
 *
 * Provides consistent date formatting across the site. Uses Intl.DateTimeFormat
 * for locale-aware formatting without external dependencies.
 */

/** Format a date as "Month DD, YYYY" (e.g., "January 15, 2025") */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Format a date as "Mon DD, YYYY" (e.g., "Jan 15, 2025") */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Extract just the year from a date */
export function getYear(date: Date): string {
  return date.getFullYear().toString();
}

/** Format a date as ISO string for <time> datetime attribute */
export function toISODate(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date as ISO date only (YYYY-MM-DD) for <time datetime>.
 * Unlike toISODate(), this returns only the date portion without time.
 */
export function formatISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format a date as a relative time string (e.g., "2 months ago", "yesterday").
 * Uses Intl.RelativeTimeFormat for locale-aware output.
 * Falls back to absolute date if more than 1 year ago.
 */
export function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffDays === 0) return rtf.format(0, "day"); // "today"
  if (diffDays === 1) return rtf.format(-1, "day"); // "yesterday"
  if (diffDays < 7) return rtf.format(-diffDays, "day");
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), "week");
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), "month");

  /* More than a year ago — use absolute date */
  return formatDate(date);
}
