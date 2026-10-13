import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses, inputClasses } from "@/components/ui";
import type { CoachSpecialisation } from "@/features/coaches";
import type { Sport } from "@/features/sports";
import { localePath, type Locale, type Translate } from "@/i18n";
import { buildQueryString } from "@/lib";

import { CheckIcon, GlobeIcon, SearchIcon } from "./icons";

/**
 * THE FILTER RAIL — the catalogue's panel, for coaches.
 *
 * No client JavaScript and no `useState`. Every control here is a LINK to the
 * same page with a different query string, and the one control that cannot be
 * — the search box — is a plain GET form. The filter state therefore lives in
 * the URL, which means it is shareable, it survives a reload, Back undoes one
 * filter rather than leaving the page, and the whole rail keeps working before
 * any JavaScript has loaded.
 *
 * `page` is dropped from every link on purpose: narrowing a result set while
 * standing on page 3 of the old one lands you on an empty page.
 *
 * Drawn as the course catalogue's panel is: a white card rising over the foot
 * of the hero, pills for every facet, the count and the sort along its foot.
 */
export interface CoachFilterState {
  readonly search?: string;
  readonly sort?: string;
  readonly sportSlugs: readonly string[];
  readonly specialisationIds: readonly string[];
  readonly remoteOnly: boolean;
}

const SORT_KEYS = [
  { key: "relevance", labelKey: "coaches.sortRelevance" },
  { key: "rating-desc", labelKey: "coaches.sortRating" },
  { key: "experience-desc", labelKey: "coaches.sortExperience" },
  { key: "price-asc", labelKey: "coaches.sortPrice" },
] as const;

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200";
const PILL_ON = "border-primary bg-primary text-on-primary";
const PILL_OFF = "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark";

/** One pill, in the two states every pill in this rail has. */
function Pill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={`${PILL} ${active ? PILL_ON : PILL_OFF}`}>
      {children}
    </Link>
  );
}

export function CoachFilters({
  locale,
  t,
  state,
  sports,
  specialisations,
  total,
  shown,
}: {
  locale: Locale;
  t: Translate;
  state: CoachFilterState;
  /** Only sports that at least one listed coach teaches. */
  sports: readonly Sport[];
  specialisations: readonly CoachSpecialisation[];
  total: string;
  shown: string;
}) {
  const base = localePath(locale, "/coaches");

  /** A link to this page with one thing changed and the page reset. */
  const linkTo = (changes: {
    sport?: readonly string[];
    specialization?: readonly string[];
    remote?: boolean;
    sort?: string;
  }) =>
    `${base}${buildQueryString({
      q: state.search,
      sort: changes.sort ?? state.sort,
      sport: [...(changes.sport ?? state.sportSlugs)],
      specialization: [...(changes.specialization ?? state.specialisationIds)],
      remote: (changes.remote ?? state.remoteOnly) ? "1" : undefined,
    })}`;

  /** Adding a value that is already on removes it, so a pill toggles. */
  const toggled = (values: readonly string[], value: string) =>
    values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

  const isFiltered =
    Boolean(state.search) ||
    state.sportSlugs.length > 0 ||
    state.specialisationIds.length > 0 ||
    state.remoteOnly ||
    Boolean(state.sort);

  const rows = [
    {
      id: "sport",
      label: t("coaches.filterSport"),
      allHref: linkTo({ sport: [] }),
      allActive: state.sportSlugs.length === 0,
      options: sports.map((sport) => ({
        key: sport.id,
        name: sport.name,
        active: state.sportSlugs.includes(sport.slug),
        href: linkTo({ sport: toggled(state.sportSlugs, sport.slug) }),
      })),
    },
    {
      id: "specialisation",
      label: t("coaches.filterSpecialisation"),
      allHref: linkTo({ specialization: [] }),
      allActive: state.specialisationIds.length === 0,
      options: specialisations.map((specialisation) => ({
        key: specialisation.id,
        name: specialisation.name,
        active: state.specialisationIds.includes(specialisation.id),
        href: linkTo({ specialization: toggled(state.specialisationIds, specialisation.id) }),
      })),
    },
  ];

  return (
    <section aria-label={t("coaches.filters")} className="bg-canvas pb-2">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        {/* The panel rises over the foot of the hero: the controls are the
            first thing under the title, not a band of their own. */}
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          {/* Search. A GET form, so it works with JavaScript off and so the
              query lands in the URL beside every other filter. */}
          <form action={base} method="get" className="flex flex-wrap items-center gap-3">
            {/* The other filters have to survive a search, and a GET form only
                submits its own fields. */}
            {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
            {state.sportSlugs.map((slug) => (
              <input key={slug} type="hidden" name="sport" value={slug} />
            ))}
            {state.specialisationIds.map((id) => (
              <input key={id} type="hidden" name="specialization" value={id} />
            ))}
            {state.remoteOnly ? <input type="hidden" name="remote" value="1" /> : null}

            <label htmlFor="coach-search" className="sr-only">
              {t("coaches.searchLabel")}
            </label>
            <div className="relative min-w-0 flex-1 basis-60">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
                <SearchIcon size={17} />
              </span>
              <input
                id="coach-search"
                type="search"
                name="q"
                defaultValue={state.search ?? ""}
                placeholder={t("coaches.searchPlaceholder")}
                className={inputClasses("rounded-full ps-12")}
              />
            </div>

            <button type="submit" className={buttonClasses({ size: "lg", className: "h-12 max-sm:w-full" })}>
              {t("coaches.searchSubmit")}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {rows.map((row) =>
              row.options.length === 0 ? null : (
                <div key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{row.label}</p>
                  <ul className="flex flex-wrap gap-2">
                    <li>
                      <Pill href={row.allHref} active={row.allActive}>
                        {t("coaches.filterAll")}
                      </Pill>
                    </li>
                    {row.options.map((option) => (
                      <li key={option.key}>
                        <Pill href={option.href} active={option.active}>
                          {option.active ? <CheckIcon size={12} /> : null}
                          {option.name}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>

          {/* The result line and the two controls that act on the whole set. */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-[13px] text-body">
              {t("coaches.showing", { shown, total })}
              {isFiltered ? (
                <>
                  {" · "}
                  <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                    {t("coaches.filterClear")}
                  </Link>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Pill href={linkTo({ remote: !state.remoteOnly })} active={state.remoteOnly}>
                <GlobeIcon size={13} />
                {t("coaches.filterRemote")}
              </Pill>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold text-ink">{t("coaches.sortLabel")}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {SORT_KEYS.map((option) => {
                    const active = (state.sort ?? "relevance") === option.key;
                    return (
                      <li key={option.key}>
                        <Link
                          href={linkTo({ sort: option.key === "relevance" ? "" : option.key })}
                          aria-current={active ? "true" : undefined}
                          className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
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
      </div>
    </section>
  );
}
