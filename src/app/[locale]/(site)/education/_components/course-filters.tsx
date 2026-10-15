import Link from "next/link";

import {
  COURSE_FORMATS,
  COURSE_LEVELS,
  type CourseCategory,
  type CourseFormat,
  type CourseLevel,
  type CourseSortKey,
} from "@/features/education";
import { buttonClasses, inputClasses } from "@/components/ui";
import { localePath, type Locale, type Translate } from "@/i18n";
import { buildQueryString } from "@/lib";

import { SearchIcon, SlidersIcon } from "./icons";

/**
 * THE CATALOGUE RAIL.
 *
 * Every control is a LINK or a GET form and there is no state in this component
 * at all. That is deliberate and it is what makes the page work: filters live in
 * the URL, so they survive a reload, they are shareable, Back undoes one filter
 * instead of leaving the page, and the whole catalogue stays a Server Component
 * that ships no JavaScript.
 *
 * NO LINK CARRIES `page`. Narrowing a filter while standing on page two of a
 * result set that is about to shrink to one page lands the visitor on an empty
 * screen with no clue why. `buildQueryString` omits `undefined`, so dropping it
 * is a matter of not passing it.
 *
 * Toggling is set membership rather than a separate "remove" link — clicking an
 * active facet takes it out of the list, which is what its pressed state already
 * promises.
 */
export interface CourseFilterState {
  readonly search?: string;
  readonly sort?: CourseSortKey;
  readonly categorySlugs: readonly string[];
  readonly formats: readonly CourseFormat[];
  readonly levels: readonly CourseLevel[];
}

const SORTS: readonly {
  key: CourseSortKey;
  labelKey: Parameters<Translate>[0];
}[] = [
  { key: "newest", labelKey: "education.sortNewest" },
  { key: "rating-desc", labelKey: "education.sortRating" },
  { key: "duration-asc", labelKey: "education.sortDuration" },
];

const FORMAT_LABEL = {
  online: "education.formatOnline",
  "in-person": "education.formatInPerson",
  hybrid: "education.formatHybrid",
  "self-paced": "education.formatSelfPaced",
} as const;

const LEVEL_LABEL = {
  beginner: "education.levelBeginner",
  intermediate: "education.levelIntermediate",
  advanced: "education.levelAdvanced",
} as const;

function toggle<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
}

export function CourseFilters({
  locale,
  t,
  state,
  categories,
  shown,
  total,
}: {
  locale: Locale;
  t: Translate;
  state: CourseFilterState;
  categories: readonly CourseCategory[];
  /** Already formatted — a formatter is a function and cannot cross to a client. */
  shown: string;
  total: string;
}) {
  const base = localePath(locale, "/education");

  /*
   * `"sort" in next`, not `next.sort ?? state.sort`.
   *
   * Clicking the active sort should clear it, which means passing `undefined`
   * deliberately — and `??` cannot tell that apart from "the caller did not
   * mention sort", so it falls straight back to the current value and the
   * control can be turned on but never off.
   */
  const link = (next: Partial<CourseFilterState>) =>
    `${base}${buildQueryString({
      q: "search" in next ? next.search : state.search,
      sort: "sort" in next ? next.sort : state.sort,
      category: [...(next.categorySlugs ?? state.categorySlugs)],
      format: [...(next.formats ?? state.formats)],
      level: [...(next.levels ?? state.levels)],
    })}`;

  const filtered =
    Boolean(state.search) ||
    state.categorySlugs.length > 0 ||
    state.formats.length > 0 ||
    state.levels.length > 0;

  const rows: {
    id: string;
    label: string;
    options: { value: string; name: string }[];
    active: readonly string[];
    clear: Partial<CourseFilterState>;
    build: (value: string) => string;
  }[] = [
    {
      id: "category",
      label: t("education.filterProgramme"),
      options: categories.map((entry) => ({
        value: entry.slug,
        name: entry.name,
      })),
      active: state.categorySlugs,
      clear: { categorySlugs: [] },
      build: (value) =>
        link({ categorySlugs: toggle(state.categorySlugs, value) }),
    },
    {
      id: "format",
      label: t("education.filterFormat"),
      options: COURSE_FORMATS.map((entry) => ({
        value: entry,
        name: t(FORMAT_LABEL[entry]),
      })),
      active: state.formats,
      clear: { formats: [] },
      build: (value) =>
        link({ formats: toggle(state.formats, value as CourseFormat) }),
    },
    {
      id: "level",
      label: t("education.filterLevel"),
      options: COURSE_LEVELS.map((entry) => ({
        value: entry,
        name: t(LEVEL_LABEL[entry]),
      })),
      active: state.levels,
      clear: { levels: [] },
      build: (value) =>
        link({ levels: toggle(state.levels, value as CourseLevel) }),
    },
  ];

  return (
    <section aria-label={t("education.filters")} className="bg-canvas pb-2">
      {/* The panel rises over the foot of the hero: the catalogue's controls
          are the first thing under the title, not a band of their own. */}
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          {/*
          A GET form, so submitting writes the query into the URL rather than
          posting anywhere. The hidden inputs carry the facets that are already
          on, or searching would silently clear them.
        */}
          <form
            action={base}
            method="get"
            className="flex flex-wrap items-center gap-3"
          >
            <label htmlFor="education-search" className="sr-only">
              {t("education.searchLabel")}
            </label>
            <div className="relative min-w-0 flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50"
              >
                <SearchIcon size={17} />
              </span>
              <input
                id="education-search"
                type="search"
                name="q"
                defaultValue={state.search ?? ""}
                placeholder={t("education.searchPlaceholder")}
                className={inputClasses("rounded-full ps-12")}
              />
            </div>

            {state.sort ? (
              <input type="hidden" name="sort" value={state.sort} />
            ) : null}
            {state.categorySlugs.map((slug) => (
              <input key={slug} type="hidden" name="category" value={slug} />
            ))}
            {state.formats.map((value) => (
              <input key={value} type="hidden" name="format" value={value} />
            ))}
            {state.levels.map((value) => (
              <input key={value} type="hidden" name="level" value={value} />
            ))}

            <button
              type="submit"
              className={buttonClasses({ size: "lg", className: "h-12" })}
            >
              {t("education.searchAction")}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {rows.map((row) =>
              row.options.length === 0 ? null : (
                <div
                  key={row.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-2"
                >
                  <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">
                    {row.label}
                  </p>

                  <ul className="flex flex-wrap gap-2">
                    {/* "All" clears only this row — a reader who narrowed by level
                      and format expects the level reset to leave format alone. */}
                    <li>
                      <Link
                        href={link(row.clear)}
                        aria-pressed={row.active.length === 0}
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${row.active.length === 0 ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"}`}
                      >
                        {t("education.filterAll")}
                      </Link>
                    </li>

                    {row.options.map((option) => {
                      const active = row.active.includes(option.value);
                      return (
                        <li key={option.value}>
                          <Link
                            href={row.build(option.value)}
                            aria-pressed={active}
                            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${active ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"}`}
                          >
                            {option.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-[13px] text-body">
              {t("education.showingCount", { shown, total })}
              {filtered ? (
                <>
                  {" · "}
                  <Link
                    href={base}
                    className="font-semibold text-primary-dark underline-offset-4 hover:underline"
                  >
                    {t("education.filterClear")}
                  </Link>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                <SlidersIcon size={14} />
                {t("education.sortLabel")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {SORTS.map((entry) => {
                  const active = state.sort === entry.key;
                  return (
                    <li key={entry.key}>
                      <Link
                        href={link({ sort: active ? undefined : entry.key })}
                        aria-pressed={active}
                        className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-primary-10 text-primary-dark"
                            : "text-body hover:bg-canvas hover:text-ink"
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
