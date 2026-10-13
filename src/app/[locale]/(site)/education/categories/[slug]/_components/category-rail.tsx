import Link from "next/link";

import { COURSE_LEVELS, type CourseCategory, type CourseLevel, type CourseSortKey } from "@/features/education";
import { localePath, type Locale, type Translate } from "@/i18n";

import { SlidersIcon } from "../../../_components/icons";

/**
 * A CATEGORY'S RAIL — the catalogue's filter panel, narrowed to a subject.
 *
 * The same white panel rising over the hero's foot that `/education` uses, so
 * the two pages read as one catalogue. What it holds is different on purpose:
 * somebody who followed a category link came for a subject, not for a search
 * box, so the rail is a SUBJECT SWITCHER, a single LEVEL toggle and the sort.
 *
 * Every control is a link and the component holds no state: filters live in
 * the URL, survive a reload, and Back undoes one decision. No link carries
 * `page` — narrowing while standing on page two of a set that is about to
 * shrink would land on an empty screen.
 *
 * NO PRICE SORT. The catalogue's fees are placeholders and are not printed
 * anywhere; ordering by a figure the reader cannot see would be ordering by an
 * invented number. The sorts are the index's own three.
 */
const SORTS: readonly { key: CourseSortKey; labelKey: Parameters<Translate>[0] }[] = [
  { key: "newest", labelKey: "courseCategory.sortNewest" },
  { key: "rating-desc", labelKey: "courseCategory.sortRating" },
  { key: "duration-asc", labelKey: "courseCategory.sortDuration" },
];

/** The card's own level labels, so a chip and the tile it filtered to agree. */
const LEVEL_LABEL: Readonly<Record<CourseLevel, Parameters<Translate>[0]>> = {
  beginner: "education.levelBeginner",
  intermediate: "education.levelIntermediate",
  advanced: "education.levelAdvanced",
};

const pill = (active: boolean) =>
  `inline-flex rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-on-primary"
      : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
  }`;

export function CategoryRail({
  locale,
  t,
  category,
  categories,
  level,
  sort,
  categoryHref,
  levelHref,
  sortHref,
  shown,
  total,
}: {
  locale: Locale;
  t: Translate;
  category: CourseCategory;
  categories: readonly CourseCategory[];
  level?: CourseLevel;
  sort?: CourseSortKey;
  categoryHref: (entry: CourseCategory) => string;
  levelHref: (next: CourseLevel | undefined) => string;
  sortHref: (next: CourseSortKey | undefined) => string;
  /** Already formatted. */
  shown: string;
  total: string;
}) {
  return (
    <section aria-label={t("courseCategory.filters")} className="bg-canvas pb-2">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{t("courseCategory.filterSubject")}</p>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href={localePath(locale, "/education")} className={pill(false)}>
                    {t("courseCategory.allCourses")}
                  </Link>
                </li>
                {categories.map((entry) => {
                  const active = entry.id === category.id;
                  return (
                    <li key={entry.id}>
                      <Link href={categoryHref(entry)} aria-current={active ? "page" : undefined} className={pill(active)}>
                        {entry.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{t("courseCategory.filterLevel")}</p>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href={levelHref(undefined)} aria-pressed={!level} className={pill(!level)}>
                    {t("courseCategory.levelAny")}
                  </Link>
                </li>
                {COURSE_LEVELS.map((entry) => {
                  const active = level === entry;
                  return (
                    <li key={entry}>
                      {/* Clicking the live level clears it: the href passes
                          `undefined` deliberately rather than the current value. */}
                      <Link href={levelHref(active ? undefined : entry)} aria-pressed={active} className={pill(active)}>
                        {t(LEVEL_LABEL[entry])}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-[13px] text-body">{t("courseCategory.showingCount", { shown, total })}</p>

            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                <SlidersIcon size={14} />
                {t("courseCategory.sortLabel")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {SORTS.map((entry) => {
                  const active = sort === entry.key;
                  return (
                    <li key={entry.key}>
                      <Link
                        href={sortHref(active ? undefined : entry.key)}
                        aria-pressed={active}
                        className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                          active ? "bg-primary-10 text-primary-dark" : "text-body hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        {t(entry.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
