import { ammanToday, type SalaryRange } from "@/features/careers";
import { LOCALE_TAGS, type Formatters, type Locale, type Translate } from "@/i18n";

/*
 * The board's few formatting rules, written once so a card, a job page and an
 * application say "posted", "apply by" and a salary the same way. SERVER ONLY:
 * each takes the translator and the formatters, which never cross into a
 * client leaf.
 */

/**
 * A money value wrapped in a first-strong isolate. A salary sits inside a
 * sentence ("550.000 د.أ. – 800.000 د.أ. شهرياً"), and the isolate is what stops
 * the bidi algorithm pairing the digits of one amount with the words beside
 * it. First-strong, not LTR: the Arabic amount carries its own RLM and should
 * lay out right-to-left, the English one left-to-right.
 */
const isolate = (value: string) => `⁨${value}⁩`;

/**
 * "JOD 550.000 – JOD 800.000 a month", or "From …", "Up to …", or nothing when
 * the employer chose not to publish it.
 */
export function salaryLabel(salary: SalaryRange | undefined, t: Translate, f: Formatters): string | undefined {
  if (!salary || (!salary.min && !salary.max)) return undefined;
  const period = t(salary.period === "hour" ? "careers.salary.hour" : "careers.salary.month");
  const { min, max } = salary;
  if (min && max) {
    return min.amount === max.amount
      ? t("careers.salary.exact", { amount: isolate(f.money(min)), period })
      : t("careers.salary.range", { min: isolate(f.money(min)), max: isolate(f.money(max)), period });
  }
  if (min) return t("careers.salary.from", { min: isolate(f.money(min)), period });
  return t("careers.salary.upTo", { max: isolate(f.money(max!)), period });
}

/** The calendar day an instant fell on in Amman (UTC+3 all year). */
function ammanDay(instant: string): string {
  return new Date(Date.parse(instant) + 3 * 3_600_000).toISOString().slice(0, 10);
}

const DAY = 86_400_000;

/**
 * "Posted today", "Posted 3 days ago", "Posted 2 weeks ago" — and past a month,
 * the date itself, because "posted 9 weeks ago" makes the reader do the sum.
 * Counted in Amman calendar days, so a job posted at 23:00 is not "today" in
 * the morning.
 */
export function postedLabel(postedAt: string, locale: Locale, t: Translate, f: Formatters): string {
  const days = Math.round((Date.parse(ammanToday()) - Date.parse(ammanDay(postedAt))) / DAY);
  if (!Number.isFinite(days) || days < 0 || days > 30) return t("careers.card.postedOn", { date: f.date(postedAt) });
  const relative = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" });
  const ago = days < 14 ? relative.format(-days, "day") : relative.format(-Math.round(days / 7), "week");
  return t("careers.card.posted", { ago });
}

/** "Apply by 18 Oct 2026", or "Open until filled" when there is no closing date. */
export function closesLabel(closesOn: string | undefined, t: Translate, f: Formatters): string {
  return closesOn ? t("careers.card.closes", { date: f.date(closesOn) }) : t("careers.card.untilFilled");
}

/**
 * The first letter of a company's name, for the fallback mark. One letter, not
 * initials: two Arabic initials set side by side JOIN into a pseudo-word, and a
 * single isolated letter reads as a monogram in both scripts.
 */
export function initialOf(name: string): string {
  const letter = Array.from(name.trim()).find((char) => /\p{L}|\p{N}/u.test(char));
  return (letter ?? "·").toLocaleUpperCase();
}
