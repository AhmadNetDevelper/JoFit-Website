import Link from "next/link";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CITIES,
  JOB_SORT_KEYS,
  WORK_MODES,
  type EmploymentType,
  type ExperienceLevel,
  type JobCity,
  type JobListResult,
  type JobSortKey,
  type WorkMode,
} from "@/features/careers";
import { buttonClasses, inputClasses } from "@/components/ui";
import { localePath, type Locale, type Translate } from "@/i18n";
import { buildQueryString, readParam, readParams, type RawSearchParams } from "@/lib";

import { CheckIcon, SearchIcon } from "./icons";

/**
 * THE BOARD'S FILTER STATE, AND THE RAIL THAT CHANGES IT.
 *
 * Every filter lives in the URL — links plus the one GET search form, no
 * `useState` — so a filtered board is shareable, survives a reload, and Back
 * undoes one filter instead of leaving the page. `page` is dropped from every
 * filter link: narrowing the set while standing on page 3 of the old one lands
 * on an empty page.
 *
 * Values arrive from the address bar, so each one is checked against the
 * taxonomy before it reaches the service; an unknown city is ignored rather
 * than answered with nothing.
 */
export interface JobFilterState {
  readonly search?: string;
  /** Absent means the default, newest. */
  readonly sort?: Exclude<JobSortKey, "newest">;
  readonly categories: readonly string[];
  readonly cities: readonly JobCity[];
  readonly types: readonly EmploymentType[];
  readonly modes: readonly WorkMode[];
  readonly levels: readonly ExperienceLevel[];
}

const pick = <T extends string>(values: readonly string[], allowed: readonly T[]): T[] =>
  [...new Set(values)].filter((value): value is T => (allowed as readonly string[]).includes(value));

export function readJobFilters(search: RawSearchParams): JobFilterState {
  const sort = readParam(search, "sort");
  return {
    search: readParam(search, "q")?.trim() || undefined,
    sort: sort && sort !== "newest" && (JOB_SORT_KEYS as readonly string[]).includes(sort) ? (sort as JobFilterState["sort"]) : undefined,
    categories: [...new Set(readParams(search, "category"))].filter((slug) => /^[a-z0-9-]{1,60}$/.test(slug)),
    cities: pick(readParams(search, "city"), JOB_CITIES),
    types: pick(readParams(search, "type"), EMPLOYMENT_TYPES),
    modes: pick(readParams(search, "mode"), WORK_MODES),
    levels: pick(readParams(search, "level"), EXPERIENCE_LEVELS),
  };
}

type GroupKey = "category" | "city" | "type" | "mode" | "level";

/** The query string for this state, with some of it changed. */
export function boardQuery(
  state: JobFilterState,
  changes: Partial<Record<GroupKey, readonly string[]>> & { sort?: string; page?: number; q?: string } = {},
): string {
  return buildQueryString({
    q: changes.q ?? state.search,
    category: [...(changes.category ?? state.categories)],
    city: [...(changes.city ?? state.cities)],
    type: [...(changes.type ?? state.types)],
    mode: [...(changes.mode ?? state.modes)],
    level: [...(changes.level ?? state.levels)],
    sort: changes.sort !== undefined ? changes.sort || undefined : state.sort,
    page: changes.page && changes.page > 1 ? changes.page : undefined,
  });
}

/** One pill, in the two states every pill in the rail has. */
function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function Count({ value, active }: { value: string; active: boolean }) {
  return (
    <span
      dir="ltr"
      className={`rounded-full px-1.5 text-[11px] leading-[1.15rem] font-semibold ${active ? "bg-white/20 text-on-primary" : "bg-canvas text-body/70"}`}
    >
      {value}
    </span>
  );
}

const SORTS = [
  { key: "", labelKey: "careers.board.sortNewest" },
  { key: "closing-soon", labelKey: "careers.board.sortClosing" },
  { key: "salary-desc", labelKey: "careers.board.sortSalary" },
] as const;

export function JobFilters({
  locale,
  t,
  state,
  facets,
  shown,
  total,
  number,
}: {
  locale: Locale;
  t: Translate;
  state: JobFilterState;
  facets: JobListResult["facets"];
  shown: string;
  total: string;
  number: (value: number) => string;
}) {
  const base = localePath(locale, "/careers");

  const toggled = (values: readonly string[], value: string) =>
    values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

  const groups: readonly {
    key: GroupKey;
    label: string;
    selected: readonly string[];
    options: readonly { value: string; label: string; count: number }[];
  }[] = [
    { key: "category", label: t("careers.board.filterCategory"), selected: state.categories, options: facets.categories },
    { key: "city", label: t("careers.board.filterCity"), selected: state.cities, options: facets.cities },
    {
      key: "type",
      label: t("careers.board.filterType"),
      selected: state.types,
      options: facets.employmentTypes.map((entry) => ({ ...entry, label: t(`careers.type.${entry.value}`) })),
    },
    {
      key: "mode",
      label: t("careers.board.filterMode"),
      selected: state.modes,
      options: facets.workModes.map((entry) => ({ ...entry, label: t(`careers.mode.${entry.value}`) })),
    },
    {
      key: "level",
      label: t("careers.board.filterLevel"),
      selected: state.levels,
      options: facets.experienceLevels.map((entry) => ({ ...entry, label: t(`careers.level.${entry.value}`) })),
    },
  ];

  const isFiltered =
    Boolean(state.search) || Boolean(state.sort) || groups.some((group) => group.selected.length > 0);

  return (
    <section className="bg-canvas pb-2">
      {/* The panel rises over the foot of the hero: the board's controls are
          the first thing under the title, not a band of their own. */}
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          {/* The search. A GET form that carries the other filters with it,
              since a GET form only submits its own fields. */}
          <form action={base} method="get" role="search" className="flex flex-wrap items-center gap-3">
            {state.categories.map((value) => (
              <input key={`c-${value}`} type="hidden" name="category" value={value} />
            ))}
            {state.cities.map((value) => (
              <input key={`l-${value}`} type="hidden" name="city" value={value} />
            ))}
            {state.types.map((value) => (
              <input key={`t-${value}`} type="hidden" name="type" value={value} />
            ))}
            {state.modes.map((value) => (
              <input key={`m-${value}`} type="hidden" name="mode" value={value} />
            ))}
            {state.levels.map((value) => (
              <input key={`e-${value}`} type="hidden" name="level" value={value} />
            ))}
            {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}

            <label htmlFor="job-search" className="sr-only">
              {t("careers.board.searchLabel")}
            </label>
            <div className="relative min-w-0 flex-1 basis-60">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
                <SearchIcon size={17} />
              </span>
              <input
                id="job-search"
                type="search"
                name="q"
                dir="auto"
                defaultValue={state.search ?? ""}
                placeholder={t("careers.board.searchPlaceholder")}
                className={inputClasses("rounded-full ps-12")}
              />
            </div>
            <button type="submit" className={buttonClasses({ size: "lg", className: "h-12 max-sm:w-full" })}>
              {t("careers.board.searchSubmit")}
            </button>
          </form>

          <nav aria-label={t("careers.board.filtersLabel")} className="mt-6 space-y-3">
            {groups.map((group) => {
              /* An option that would return nothing is a dead end with a label on
                 it, so only options with jobs are offered — plus any the reader
                 already chose, so a choice can always be taken back. */
              const options = group.options.filter((option) => option.count > 0 || group.selected.includes(option.value));
              /* A row with nothing but an active "All" (a search that matched
                 nothing) is a control with no choice in it. */
              if (options.length === 0) return null;
              return (
                <div key={group.key} className="grid gap-2 lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:items-start lg:gap-3">
                  <p className="text-[13px] font-semibold text-ink lg:pt-1.5">{group.label}</p>
                  {/* On a phone a group is one row that scrolls sideways, rather
                      than ten rows of pills pushing the jobs off the screen. The
                      negative margin runs it to the panel's edge. */}
                  <div className="-mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                    <Pill href={`${base}${boardQuery(state, { [group.key]: [] })}`} active={group.selected.length === 0}>
                      {t("careers.board.filterAll")}
                    </Pill>
                    {options.map((option) => {
                      const active = group.selected.includes(option.value);
                      return (
                        <Pill
                          key={option.value}
                          href={`${base}${boardQuery(state, { [group.key]: toggled(group.selected, option.value) })}`}
                          active={active}
                        >
                          {active ? <CheckIcon size={13} /> : null}
                          {option.label}
                          <Count value={number(option.count)} active={active} />
                        </Pill>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-line pt-5">
            <p className="text-[13px] text-body" aria-live="polite">
              {t("careers.board.showing", { shown, total })}
              {isFiltered ? (
                <>
                  {" · "}
                  <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                    {t("careers.board.filterClear")}
                  </Link>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-ink">{t("careers.board.sortLabel")}</p>
              <ul className="flex flex-wrap gap-1">
                {SORTS.map((option) => {
                  const active = (state.sort ?? "") === option.key;
                  return (
                    <li key={option.key || "newest"}>
                      <Link
                        href={`${base}${boardQuery(state, { sort: option.key })}`}
                        aria-current={active ? "true" : undefined}
                        className={`inline-block rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                          active ? "bg-primary-10 text-primary-dark" : "text-body hover:bg-canvas hover:text-ink"
                        }`}
                      >
                        {t(option.labelKey)}
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
