import {
  formatDate as formatDateRaw,
  formatDateTime as formatDateTimeRaw,
  formatMoney as formatMoneyRaw,
  formatTime as formatTimeRaw,
  formatWeekday as formatWeekdayRaw,
} from "@/lib";
import type { Money } from "@/types";

import { LOCALE_TAGS, type Locale } from "./locales";

export interface Formatters {
  money: (value: Money) => string;
  date: (value: string) => string;
  number: (value: number) => string;
  /** Clock face of an ISO-8601 instant, at the venue's timezone. */
  time: (value: string) => string;
  /** Short weekday of a `YYYY-MM-DD` date. */
  weekday: (value: string) => string;
  /** Weekday, date and clock face together — a confirmation line. */
  dateTime: (value: string) => string;
}

/**
 * Locale-bound formatters. Without this, pages would look up the BCP-47 tag
 * themselves and drift — one page showing Latin digits, another Arabic-Indic.
 * Formatting is decided once, in `LOCALE_TAGS`.
 */
export function getFormatters(locale: Locale): Formatters {
  const tag = LOCALE_TAGS[locale];
  return {
    money: (value) => formatMoneyRaw(value, tag),
    date: (value) => formatDateRaw(value, tag),
    number: (value) => new Intl.NumberFormat(tag).format(value),
    time: (value) => formatTimeRaw(value, tag),
    weekday: (value) => formatWeekdayRaw(value, tag),
    dateTime: (value) => formatDateTimeRaw(value, tag),
  };
}
