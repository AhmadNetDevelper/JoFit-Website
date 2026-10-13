import Link from "next/link";

import { buttonClasses, Container, inputClasses, labelClasses } from "@/components/ui";
import type { RentalCategory, RentalSortKey } from "@/features/rental";
import type { Sport } from "@/features/sports";
import { getFormatters, localePath, type Locale, type Translate, type TranslationKey } from "@/i18n";
import { buildQueryString } from "@/lib";
import type { DateRange } from "@/types";

import { CalendarIcon, SearchIcon, SlidersIcon } from "./icons";

/**
 * THE HIRE RAIL — a white panel rising over the foot of the hero, the same
 * panel the course catalogue opens with.
 *
 * The catalogue's rail asks what you are looking for. This one asks WHEN
 * FIRST, because a rental catalogue without a date window is a list of things
 * that might be free, and every card under it would be guessing. The two date
 * fields are the first controls for that reason, and the line under them says
 * in words which window the availability signals below are answering for.
 *
 * Everything here is a LINK or a GET form and there is no state in this
 * component at all — filters live in the URL, so they survive a reload, they
 * are shareable, Back undoes one filter instead of leaving the page, and the
 * whole catalogue stays a Server Component that ships no JavaScript.
 *
 * NO LINK CARRIES `page`. Narrowing a filter while standing on page two of a
 * result set that is about to shrink lands the visitor on an empty screen with
 * no clue why (pitfalls #10).
 */
export interface RentalFilterState {
  readonly search?: string;
  readonly sort?: RentalSortKey;
  readonly categorySlugs: readonly string[];
  readonly sportSlugs: readonly string[];
  readonly locationIds: readonly string[];
  /** True once the visitor has actually chosen a window, rather than inherited one. */
  readonly datesChosen: boolean;
}

/* `TranslationKey`, not `string`: a widened literal is a key the compiler no
   longer checks exists. */
const SORTS: readonly { key: RentalSortKey; labelKey: TranslationKey }[] = [
  { key: "newest", labelKey: "rental.sortNewest" },
  { key: "price-asc", labelKey: "rental.sortPriceAsc" },
  { key: "price-desc", labelKey: "rental.sortPriceDesc" },
  { key: "rating-desc", labelKey: "rental.sortRating" },
];

const PILL = "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors";
const PILL_ON = "border-primary bg-primary text-on-primary";
const PILL_OFF = "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark";

function toggle(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function RentalFilters({
  locale,
  t,
  state,
  window,
  today,
  categories,
  sports,
  depots,
  shown,
  total,
}: {
  locale: Locale;
  t: Translate;
  state: RentalFilterState;
  /** The window every availability signal on the page is answering for. */
  window: DateRange;
  /** ISO date; the earliest a hire can start, so the pickers cannot go backwards. */
  today: string;
  categories: readonly RentalCategory[];
  sports: readonly Sport[];
  /** Collection points, already resolved to this locale by the adapter. */
  depots: readonly { id: string; name: string; city: string }[];
  /** Already formatted — a formatter is a function and cannot cross to a client. */
  shown: string;
  total: string;
}) {
  const { date } = getFormatters(locale);
  const base = localePath(locale, "/rental");

  /*
   * `"sort" in next`, not `next.sort ?? state.sort`: clicking the active sort
   * passes `undefined` deliberately to clear it, and `??` cannot tell that
   * apart from "the caller did not mention sort".
   */
  const link = (next: Partial<RentalFilterState>) =>
    `${base}${buildQueryString({
      q: "search" in next ? next.search : state.search,
      sort: "sort" in next ? next.sort : state.sort,
      category: [...(next.categorySlugs ?? state.categorySlugs)],
      sport: [...(next.sportSlugs ?? state.sportSlugs)],
      location: [...(next.locationIds ?? state.locationIds)],
      /* The window is carried by every facet link. Dropping it would silently
         re-answer "is it free" for a different fortnight each time somebody
         ticked a category. */
      from: state.datesChosen ? window.from : undefined,
      to: state.datesChosen ? window.to : undefined,
    })}`;

  const filtered =
    Boolean(state.search) ||
    state.datesChosen ||
    state.categorySlugs.length > 0 ||
    state.sportSlugs.length > 0 ||
    state.locationIds.length > 0;

  const rows: {
    id: string;
    label: string;
    options: { slug: string; name: string }[];
    active: readonly string[];
    clear: Partial<RentalFilterState>;
    build: (slug: string) => string;
  }[] = [
    {
      id: "category",
      label: t("rental.filterCategory"),
      options: categories.map((entry) => ({ slug: entry.slug, name: entry.name })),
      active: state.categorySlugs,
      clear: { categorySlugs: [] },
      build: (slug) => link({ categorySlugs: toggle(state.categorySlugs, slug) }),
    },
    {
      id: "sport",
      label: t("rental.filterSport"),
      options: sports.map((entry) => ({ slug: entry.slug, name: entry.name })),
      active: state.sportSlugs,
      clear: { sportSlugs: [] },
      build: (slug) => link({ sportSlugs: toggle(state.sportSlugs, slug) }),
    },
    {
      id: "depot",
      /* Filtered by ID, not by the name printed on the chip: the label is
         translated and a visitor who switches language mid-browse should keep
         the depot they picked. */
      label: t("rental.filterDepot"),
      options: depots.map((entry) => ({ slug: entry.id, name: entry.name })),
      active: state.locationIds,
      clear: { locationIds: [] },
      build: (id) => link({ locationIds: toggle(state.locationIds, id) }),
    },
  ];

  return (
    <section aria-label={t("rental.filters")} className="bg-canvas pb-2">
      <Container>
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          <p className="inline-flex items-center gap-2.5 font-heading text-[15px] font-semibold text-ink">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15">
              <CalendarIcon size={15} />
            </span>
            {t("rental.windowTitle")}
          </p>

          {/*
            A GET form, so submitting writes the window into the URL rather than
            posting anywhere. The hidden inputs carry the facets that are already
            on, or choosing dates would silently clear them.
          */}
          <form
            action={base}
            method="get"
            className="mt-5 grid grid-cols-2 items-end gap-3 lg:grid-cols-[11rem_11rem_minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <label htmlFor="rental-from" className={labelClasses}>
                {t("rental.startDate")}
              </label>
              {/* `dir="ltr"`: a date field's contents are a numeral run, and the
                  bidi algorithm is entitled to reorder one against Arabic text. */}
              <input
                id="rental-from"
                type="date"
                name="from"
                dir="ltr"
                min={today}
                defaultValue={window.from}
                className={inputClasses()}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="rental-to" className={labelClasses}>
                {t("rental.endDate")}
              </label>
              <input
                id="rental-to"
                type="date"
                name="to"
                dir="ltr"
                min={today}
                defaultValue={window.to}
                className={inputClasses()}
              />
            </div>

            <div className="col-span-2 min-w-0 lg:col-span-1">
              <label htmlFor="rental-search" className={labelClasses}>
                {t("rental.searchLabel")}
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50"
                >
                  <SearchIcon size={17} />
                </span>
                <input
                  id="rental-search"
                  type="search"
                  name="q"
                  defaultValue={state.search ?? ""}
                  placeholder={t("rental.searchPlaceholder")}
                  className={inputClasses("ps-12")}
                />
              </div>
            </div>

            {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
            {state.categorySlugs.map((slug) => (
              <input key={slug} type="hidden" name="category" value={slug} />
            ))}
            {state.sportSlugs.map((slug) => (
              <input key={slug} type="hidden" name="sport" value={slug} />
            ))}
            {state.locationIds.map((id) => (
              <input key={id} type="hidden" name="location" value={id} />
            ))}

            <button type="submit" className={buttonClasses({ size: "lg", className: "col-span-2 h-12 lg:col-span-1" })}>
              {t("rental.checkAvailability")}
            </button>
          </form>

          {/* Each date is its own run inside the sentence rather than a range
              glued together with a dash, so Arabic keeps them the right way
              round (and no `dir` on a formatted date — pitfalls #11). */}
          <p className="mt-3 text-[13px] text-body/80">
            {t("rental.windowNote", { from: date(window.from), to: date(window.to) })}
          </p>

          <div className="mt-6 space-y-3 border-t border-line pt-6">
            {rows.map((row) =>
              row.options.length === 0 ? null : (
                <div key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{row.label}</p>

                  <ul className="flex flex-wrap gap-2">
                    {/* "All" clears only this row: somebody who narrowed by depot
                        and by sport expects the sport reset to leave the depot
                        alone. */}
                    <li>
                      <Link
                        href={link(row.clear)}
                        aria-pressed={row.active.length === 0}
                        className={`${PILL} ${row.active.length === 0 ? PILL_ON : PILL_OFF}`}
                      >
                        {t("rental.filterAll")}
                      </Link>
                    </li>

                    {row.options.map((option) => {
                      const active = row.active.includes(option.slug);
                      return (
                        <li key={option.slug}>
                          <Link href={row.build(option.slug)} aria-pressed={active} className={`${PILL} ${active ? PILL_ON : PILL_OFF}`}>
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
              {t("rental.showingCount", { shown, total })}
              {filtered ? (
                <>
                  {" · "}
                  <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                    {t("rental.filterClear")}
                  </Link>
                </>
              ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                <SlidersIcon size={14} />
                {t("rental.sortLabel")}
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
      </Container>
    </section>
  );
}
