import type { DateRange } from "@/types";

/** Calendar helpers only — no cancellation, cut-off or lead-time rules. */
const MS_PER_DAY = 86_400_000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isValidDateRange(range: DateRange): boolean {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  return from !== null && to !== null && from.getTime() <= to.getTime();
}

/**
 * Number of calendar days covered by the range, inclusive of both ends.
 * Whether a rental day is billed inclusively is an OPEN BUSINESS DECISION;
 * this helper reports calendar facts, not billable units.
 */
export function countDaysInclusive(range: DateRange): number {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  if (!from || !to) return 0;
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
}

export function eachDateInRange(range: DateRange): string[] {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  if (!from || !to || from > to) return [];
  const dates: string[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += MS_PER_DAY) {
    dates.push(toIsoDate(new Date(t)));
  }
  return dates;
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return toIsoDate(new Date(date.getTime() + days * MS_PER_DAY));
}

/**
 * A calendar date (`2026-09-22`) is formatted as that day; a full timestamp
 * (`2026-09-22T09:12:00+03:00`) is formatted as the day it fell on in Amman.
 * Order and booking records carry timestamps, and printing one raw is what a
 * `YYYY-MM-DD`-only parser did before.
 */
export function formatDate(value: string, locale = "en"): string {
  if (value.includes("T")) {
    const moment = new Date(value);
    if (Number.isNaN(moment.getTime())) return value;
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: VENUE_TIME_ZONE }).format(moment);
  }
  const date = parseIsoDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

/**
 * Jordan does not observe daylight saving (dropped in 2022), so one fixed zone
 * covers the year.
 *
 * It is named explicitly rather than left to the runtime because a session
 * happens where the coach is. A server rendering in UTC would print 08:00 as
 * 05:00, a browser in Berlin would print 07:00, and a booking page that shows
 * two different times before and after hydration is worse than one that is
 * simply wrong.
 */
export const VENUE_TIME_ZONE = "Asia/Amman";

/** The clock face of an ISO-8601 instant, at the venue. */
export function formatTime(value: string, locale = "en", timeZone = VENUE_TIME_ZONE): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

/**
 * The short weekday of a `YYYY-MM-DD` date.
 *
 * Parsed as UTC, like every other helper here, which is correct precisely
 * because the string is already a local calendar date: shifting it into a zone
 * would be shifting it twice.
 */
export function formatWeekday(value: string, locale = "en"): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date);
}

/** A date and its clock face together, for a confirmation line. */
export function formatDateTime(value: string, locale = "en", timeZone = VENUE_TIME_ZONE): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}
