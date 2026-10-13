import Link from "next/link";

import { buttonClasses, inputClasses } from "@/components/ui";
import type { Brand, ProductCategory, ProductSortKey } from "@/features/shop";
import type { Sport } from "@/features/sports";
import { localePath, type Locale, type Translate } from "@/i18n";
import { buildQueryString } from "@/lib";

import { pillClasses, SortLinks } from "./catalogue";
import { SearchIcon } from "./icons";

/**
 * THE CATALOGUE RAIL — a white panel rising over the foot of the hero, the
 * course catalogue's rail applied to the shop.
 *
 * Every control here is a LINK or a GET form, and there is no state in this
 * component at all. That is deliberate and it is what makes the page work:
 * filters live in the URL, so they survive a reload, they are shareable, Back
 * undoes one filter instead of leaving the page, and the whole catalogue stays
 * a Server Component that ships no JavaScript.
 *
 * NO LINK CARRIES `page`. Narrowing a filter while standing on page three of a
 * result set that is about to shrink to one page lands the visitor on an empty
 * screen with no clue why. `buildQueryString` omits `undefined`, so dropping it
 * is a matter of not passing it.
 *
 * Toggling is done by set membership rather than by a separate "remove" link —
 * clicking an active facet takes it out of the list, which is what its pressed
 * state already promises.
 */
export interface ShopFilterState {
  readonly search?: string;
  readonly sort?: ProductSortKey;
  readonly categorySlugs: readonly string[];
  readonly brandSlugs: readonly string[];
  readonly sportSlugs: readonly string[];
}

function toggle(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function ShopFilters({
  locale,
  t,
  state,
  categories,
  brands,
  sports,
  shown,
  total,
}: {
  locale: Locale;
  t: Translate;
  state: ShopFilterState;
  categories: readonly ProductCategory[];
  brands: readonly Brand[];
  sports: readonly Sport[];
  /** Already formatted. */
  shown: string;
  total: string;
}) {
  const base = localePath(locale, "/shop");

  /*
   * `"sort" in next`, not `next.sort ?? state.sort`.
   *
   * Clicking the active sort should clear it, which means passing `undefined`
   * deliberately — and `??` cannot tell that apart from "the caller did not
   * mention sort", so it fell straight back to the current value and the
   * control could be turned on but never off.
   */
  const link = (next: Partial<ShopFilterState>) =>
    `${base}${buildQueryString({
      q: "search" in next ? next.search : state.search,
      sort: "sort" in next ? next.sort : state.sort,
      category: [...(next.categorySlugs ?? state.categorySlugs)],
      brand: [...(next.brandSlugs ?? state.brandSlugs)],
      sport: [...(next.sportSlugs ?? state.sportSlugs)],
    })}`;

  const filtered =
    Boolean(state.search) ||
    state.categorySlugs.length > 0 ||
    state.brandSlugs.length > 0 ||
    state.sportSlugs.length > 0;

  const rows: {
    id: string;
    label: string;
    options: { slug: string; name: string; ltr?: boolean }[];
    active: readonly string[];
    clear: Partial<ShopFilterState>;
    build: (slug: string) => string;
  }[] = [
    {
      id: "category",
      label: t("shop.filterCategory"),
      options: categories.map((entry) => ({ slug: entry.slug, name: entry.name })),
      active: state.categorySlugs,
      clear: { categorySlugs: [] },
      build: (slug) => link({ categorySlugs: toggle(state.categorySlugs, slug) }),
    },
    {
      id: "brand",
      /* Brand names are proper nouns; the row's LABEL is translated, the
         options are not, and that asymmetry is correct. */
      label: t("shop.filterBrand"),
      options: brands.map((entry) => ({ slug: entry.slug, name: entry.name, ltr: true })),
      active: state.brandSlugs,
      clear: { brandSlugs: [] },
      build: (slug) => link({ brandSlugs: toggle(state.brandSlugs, slug) }),
    },
    {
      id: "sport",
      label: t("shop.filterSport"),
      options: sports.map((entry) => ({ slug: entry.slug, name: entry.name })),
      active: state.sportSlugs,
      clear: { sportSlugs: [] },
      build: (slug) => link({ sportSlugs: toggle(state.sportSlugs, slug) }),
    },
  ];

  return (
    <section aria-label={t("shop.filters")} className="bg-canvas pb-2">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          {/*
            A GET form, so submitting it writes the query into the URL rather
            than posting anywhere. The hidden inputs carry the facets that are
            already on, or searching would silently clear them.
          */}
          <form action={base} method="get" className="flex flex-wrap items-center gap-3">
            <label htmlFor="shop-search" className="sr-only">
              {t("shop.searchLabel")}
            </label>
            <div className="relative min-w-0 flex-1 basis-60">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50"
              >
                <SearchIcon size={17} />
              </span>
              <input
                id="shop-search"
                type="search"
                name="q"
                defaultValue={state.search ?? ""}
                placeholder={t("shop.searchPlaceholder")}
                className={inputClasses("rounded-full ps-12")}
              />
            </div>

            {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
            {state.categorySlugs.map((slug) => (
              <input key={slug} type="hidden" name="category" value={slug} />
            ))}
            {state.brandSlugs.map((slug) => (
              <input key={slug} type="hidden" name="brand" value={slug} />
            ))}
            {state.sportSlugs.map((slug) => (
              <input key={slug} type="hidden" name="sport" value={slug} />
            ))}

            <button type="submit" className={buttonClasses({ size: "lg", className: "h-12 max-sm:w-full" })}>
              {t("shop.searchAction")}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {rows.map((row) =>
              row.options.length === 0 ? null : (
                <div key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{row.label}</p>

                  <ul className="flex flex-wrap gap-2">
                    {/* "All" clears only this facet, not the whole rail — a
                        reader who narrowed by brand and sport expects the brand
                        row's reset to leave the sport alone. */}
                    <li>
                      <Link
                        href={link(row.clear)}
                        aria-pressed={row.active.length === 0}
                        className={pillClasses(row.active.length === 0)}
                      >
                        {t("shop.filterAll")}
                      </Link>
                    </li>

                    {row.options.map((option) => {
                      const active = row.active.includes(option.slug);
                      return (
                        <li key={option.slug}>
                          <Link href={row.build(option.slug)} aria-pressed={active} className={pillClasses(active)}>
                            {option.ltr ? <span dir="ltr">{option.name}</span> : option.name}
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
              {t("shop.showingCount", { shown, total })}
              {filtered ? (
                <>
                  {" · "}
                  <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                    {t("shop.filterClear")}
                  </Link>
                </>
              ) : null}
            </p>

            <SortLinks t={t} current={state.sort} hrefFor={(sort) => link({ sort })} />
          </div>
        </div>
      </div>
    </section>
  );
}
