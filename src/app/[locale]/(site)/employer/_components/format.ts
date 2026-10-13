import { LOCALE_TAGS, type Locale, type Translate } from "@/i18n";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "3 days ago" / "قبل ٣ أيام", "yesterday" / "أمس" — relative while it is
 * recent enough to be read that way, and a date once it is not. Rendered on
 * the server only, so the clock the words are measured against is one clock.
 */
export function ago(iso: string, locale: Locale, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const elapsed = now - then;
  const tag = LOCALE_TAGS[locale];
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  if (elapsed < HOUR) return relative.format(-Math.max(1, Math.round(elapsed / MINUTE)), "minute");
  if (elapsed < DAY) return relative.format(-Math.round(elapsed / HOUR), "hour");
  if (elapsed < 30 * DAY) return relative.format(-Math.round(elapsed / DAY), "day");
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeZone: "Asia/Amman" }).format(new Date(then));
}

/**
 * Years of experience as a whole phrase. Arabic agrees the noun with the
 * number (سنة / سنتين / سنوات / سنة), so the phrase is chosen by the
 * language's own plural rules rather than glued to a figure.
 */
export function experience(t: Translate, years: number, locale: Locale): string {
  if (years === 0) return t("employer.exp.zero");
  const category = new Intl.PluralRules(LOCALE_TAGS[locale]).select(years);
  const count = new Intl.NumberFormat(LOCALE_TAGS[locale]).format(years);
  switch (category) {
    case "one":
      return t("employer.exp.one", { count });
    case "two":
      return t("employer.exp.two", { count });
    case "few":
      return t("employer.exp.few", { count });
    case "many":
      return t("employer.exp.many", { count });
    default:
      return t("employer.exp.other", { count });
  }
}

/**
 * A user-written phrase dropped into a sentence of ours, isolated so that an
 * English job title inside an Arabic sentence (or the reverse) keeps its own
 * direction instead of reordering the words around it. FSI … PDI is `<bdi>`
 * for places that only take a string, like a page's lead.
 */
export const isolate = (text: string) => String.fromCharCode(0x2068) + text + String.fromCharCode(0x2069);

/**
 * Whether an application is NEW: submitted and not yet opened by the company.
 *
 * An `EmployerApplication` does not say whether it was opened, but its job
 * counts the unopened ones (`newApplicationCount`), so a submitted
 * application on a job with none unopened is not new. (When a job has some
 * opened and some not, every submitted one is marked — the safe side.)
 */
export function isNewApplication(jobs: readonly { readonly id: string; readonly newApplicationCount: number }[]) {
  const unseen = new Map(jobs.map((job) => [job.id, job.newApplicationCount]));
  /* The application says so itself (`isNew`); the job's count is only the
     fallback for an answer that does not carry the flag. */
  return (application: { readonly status: string; readonly isNew?: boolean; readonly job: { readonly id: string } }) =>
    application.isNew ?? (application.status === "submitted" && (unseen.get(application.job.id) ?? 1) > 0);
}
