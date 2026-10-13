import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon, buttonClasses, Container, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import {
  lowestRate,
  parseRentalListQuery,
  readAvailabilitySignal,
  RENTAL_SORT_KEYS,
  rentalService,
  type RentalCategory,
  type RentalSortKey,
  type RentalUnit,
} from "@/features/rental";
import { getFormatters, getTranslator, localePath, resolveLocale, type TranslationKey } from "@/i18n";
import {
  addDays,
  buildQueryString,
  metadataFromSeo,
  readNumberParam,
  readParam,
  resolveSearchParams,
  toIsoDate,
} from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { ItemGlyph, SlidersIcon } from "../../_components/icons";
import { RentalCard } from "../../_components/rental-card";
import { RentalDesk } from "../../_components/rental-desk";

/* `TranslationKey`, not `string`: a widened literal is a key the compiler no
   longer checks exists. */
const SORTS: readonly { key: RentalSortKey; labelKey: TranslationKey }[] = [
  { key: "newest", labelKey: "rentalCategory.sortNewest" },
  { key: "price-asc", labelKey: "rentalCategory.sortPriceAsc" },
  { key: "price-desc", labelKey: "rentalCategory.sortPriceDesc" },
  { key: "rating-desc", labelKey: "rentalCategory.sortRating" },
];

const UNIT_NOUN = {
  hour: "rentalCategory.unitHour",
  day: "rentalCategory.unitDay",
  week: "rentalCategory.unitWeek",
} as const satisfies Record<RentalUnit, string>;

/**
 * How far ahead a card's availability signal looks.
 *
 * Seven days is a week of the visitor's own diary — long enough that "free"
 * means something, short enough that it is still a claim about now. The
 * calendar is fetched four weeks deep so that when the week IS gone the signal
 * can name the date it opens instead of shrugging; see `readAvailabilitySignal`.
 */
const SIGNAL_WINDOW_DAYS = 6;
const SIGNAL_HORIZON_DAYS = 34;

/**
 * The 404 branch is answered twice on purpose — here and in the page — because
 * Next resolves metadata and the component independently. Returning a `noIndex`
 * document rather than letting this throw is what keeps a mistyped slug out of
 * the index instead of serving it a category's worth of canonical tags.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/rental/categories/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const category = await rentalService.getCategoryBySlug(slug, locale);
  if (!category) {
    return metadataFromSeo(undefined, {
      locale,
      title: t("notFound.title"),
      description: t("notFound.description"),
      noIndex: true,
    });
  }

  return metadataFromSeo(category.seo, {
    locale,
    title: category.name,
    description: category.description ?? t("rental.description"),
    path: `/rental/categories/${category.slug}`,
  });
}

/**
 * A RENTAL CATEGORY — the rental index narrowed to one part of the fleet, on
 * the same formal listing recipe:
 *
 *   PageHero   the category, with four figures about THIS category (never the
 *              whole fleet): items, depots, free this week, the lowest rate
 *   rail       the panel over the hero's foot — a category switcher and a sort,
 *              not the index's full filter set: somebody who followed a
 *              category link came for a shelf, not for a date picker
 *   grid       the rental cards, each with its week's availability signal
 *   junction   the other shelves, as doors, then the group-hire desk
 *   help       the closing band
 *
 * THE TREE IS NOT FLATTENED. `parentId` is real — road and trail are branches of
 * cycling — so the rail carries two rows when it applies: the top level with the
 * current branch marked, and below it that branch's own children. The
 * breadcrumb walks the same path and a child names its parent on the junction.
 *
 * Everything renders on the server. Every control is a link; this route ships no
 * JavaScript of its own beyond the scroll reveal.
 */
export default async function RentalCategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/rental/categories/[slug]">) {
  const [{ locale: raw, slug }, search] = await Promise.all([
    params,
    resolveSearchParams(searchParams),
  ]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { money, number } = getFormatters(locale);

  const category = await rentalService.getCategoryBySlug(slug, locale);
  if (!category) notFound();

  const query = parseRentalListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;

  /* `query.sort` is typed `string` because `ListQuery` is shared across every
     domain and each one has its own sort vocabulary. Narrowing it here against
     the fleet's own keys is what lets the rail's pressed states be exhaustive
     rather than string comparisons. */
  const sort = RENTAL_SORT_KEYS.find((key) => key === query.sort);
  const searchTerm = readParam(search, "q");
  const from = readParam(search, "from");
  const to = readParam(search, "to");

  const [result, shelfResult, fleet, categories] = await Promise.all([
    /* The category is part of the query, not a separate code path — the slug
       overrides whatever `category` params happen to be in the URL, because on
       this route the path is the filter. */
    rentalService.listItems({
      ...query,
      categorySlugs: [category.slug],
      page,
      pageSize: 9,
    }),
    /*
     * This category as a whole, for the hero's figures. A figure that moved
     * every time somebody re-sorted would be reporting the query rather than
     * the category.
     */
    rentalService.listItems({ locale, categorySlugs: [category.slug], pageSize: 200 }),
    /* The whole fleet, only to know which other categories have anything in
       them. A junction card that can only ever lead to an empty page is a dead
       end with a label on it. */
    rentalService.listItems({ locale, pageSize: 200 }),
    rentalService.listCategories(locale),
  ]);

  /* ------------------------------------------------------------------ */
  /* AVAILABILITY.
   *
   * Fetched for the whole shelf in one pass and keyed by id, so the figures on
   * the hero and the signal on each card are reading the same calendar. The
   * window is the coming week; the horizon runs four weeks further so a booked
   * item can name the date it frees up. */

  const today = toIsoDate(new Date());
  const window = { from: today, to: addDays(today, SIGNAL_WINDOW_DAYS) };
  const horizon = { from: today, to: addDays(today, SIGNAL_HORIZON_DAYS) };

  const shelf = shelfResult.items;
  const calendars = await Promise.all(
    shelf.map((item) => rentalService.getAvailability(item.id, horizon)),
  );
  const signalById = new Map(
    shelf.map((item, index) => [
      item.id,
      readAvailabilitySignal(calendars[index], window, item.totalUnits),
    ]),
  );

  /* ------------------------------------------------------------------ */
  /* THE BRANCH THIS PAGE SITS ON.
   *
   * `rootBranch` is the top-level category the visitor is inside — itself for a
   * root, its parent for a child. The rail's first row marks that one, so
   * standing on Mountain & Trail still shows Cycling lit: the reader can see
   * where they are in the tree, not only what they are looking at. */

  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));
  const parent = category.parentId ? categoryById.get(category.parentId) : undefined;
  const rootBranch = parent ?? category;
  const roots = categories.filter((entry) => entry.parentId === null);
  const branchChildren = categories.filter((entry) => entry.parentId === rootBranch.id);

  const stockedCategoryIds = new Set(fleet.items.flatMap((item) => item.categoryIds));
  const elsewhere = categories.filter(
    (entry) => entry.id !== category.id && stockedCategoryIds.has(entry.id),
  );

  /* ------------------------------------------------------------------ */
  /* The figures, all of them about THIS category.                       */

  const depots = new Set(shelf.map((item) => item.location.id));
  const freeThisWeek = shelf.filter((item) => {
    const status = signalById.get(item.id)?.status;
    return status === "in-stock" || status === "low-stock";
  });
  const cheapest = shelf.reduce<ReturnType<typeof lowestRate> | undefined>(
    (lowest, item) => {
      const rate = lowestRate(item);
      return !lowest || rate.price.amount < lowest.price.amount ? rate : lowest;
    },
    undefined,
  );

  /* An em dash, not a zero: a category with nothing in it has no cheapest rate,
     and printing `0.000 JOD` would state a fact that is not true rather than
     admitting there is nothing to report. */
  const stats = [
    { value: number(shelfResult.meta.totalItems), label: t("rentalCategory.statItems") },
    { value: number(depots.size), label: t("rentalCategory.statDepots") },
    { value: number(freeThisWeek.length), label: t("rentalCategory.statFree") },
    {
      value: cheapest ? money(cheapest.price) : "—",
      label: cheapest
        ? t("rentalCategory.statFrom", { unit: t(UNIT_NOUN[cheapest.unit]) })
        : t("rentalCategory.statFromEmpty"),
    },
  ];

  /* ------------------------------------------------------------------ */
  /* Links. None of them carries `page`: narrowing or re-sorting while standing
     on page three of a set that is about to shrink lands the visitor on an
     empty screen with no clue why. The date window survives a category switch,
     because somebody who said "the first week of May" still means it. */

  const base = localePath(locale, `/rental/categories/${category.slug}`);
  const categoryHref = (entry: RentalCategory) =>
    `${localePath(locale, `/rental/categories/${entry.slug}`)}${buildQueryString({ sort, from, to })}`;
  const sortHref = (next: RentalSortKey | undefined) =>
    `${base}${buildQueryString({ q: searchTerm, sort: next, from, to })}`;
  const pageHref = (target: number) =>
    `${base}${buildQueryString({
      q: searchTerm,
      sort,
      from,
      to,
      page: target > 1 ? target : undefined,
    })}`;

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-on-primary"
        : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
    }`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        /* The crumb walks the real tree, so a child category shows its parent
           rather than pretending it hangs off the rental root. */
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("rental.title"), href: localePath(locale, "/rental") },
          ...(parent ? [{ label: parent.name, href: localePath(locale, `/rental/categories/${parent.slug}`) }] : []),
          { label: category.name },
        ]}
        eyebrow={t("rentalCategory.eyebrow")}
        title={category.name}
        lead={category.description ?? t("rentalCategory.leadFallback")}
      >
        {/* `dir="ltr"` on the figure alone: a Latin-digit run inside Arabic is
            exactly what the bidi algorithm is entitled to reorder. */}
        <HeroFacts items={stats.map((stat) => ({ label: stat.label, value: <span dir="ltr">{stat.value}</span> }))} />
      </PageHero>

      {/*
        THE RAIL — a switcher and a sort, both plain links, on the panel that
        rises over the hero's foot like every listing on the site.
      */}
      <section data-band aria-label={t("rental.categories")} className="bg-canvas pb-2">
        <Container>
          <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <p className="w-32 shrink-0 text-[13px] font-semibold text-ink">{t("rentalCategory.filterCategory")}</p>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href={localePath(locale, "/rental")} className={pill(false)}>
                    {t("rentalCategory.allItems")}
                  </Link>
                </li>
                {roots.map((entry) => {
                  const active = entry.id === rootBranch.id;
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

            {/* The second level, shown only where there is one. This is the row
                that keeps Mountain & Trail findable from Cycling instead of
                stranding it beside its own parent as though they were peers. */}
            {branchChildren.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <p className="w-32 shrink-0 text-[13px] font-semibold text-ink">
                  {t("rentalCategory.within", { category: rootBranch.name })}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {branchChildren.map((entry) => {
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
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <p className="text-[13px] text-body">
                {t("rentalCategory.showingCount", {
                  shown: number(result.items.length),
                  total: number(result.meta.totalItems),
                })}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <SlidersIcon size={14} />
                  {t("rentalCategory.sortLabel")}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {SORTS.map((entry) => {
                    const active = sort === entry.key;
                    return (
                      <li key={entry.key}>
                        {/* Clicking the live sort clears it, which is why the href
                            passes `undefined` deliberately rather than falling
                            back to the current value. */}
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
        </Container>
      </section>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{category.name}</h2>
        {result.items.length === 0 ? (
          /* An empty state is an invitation, not a shrug. Which invitation
             depends on why it is empty: a search that matched nothing is undone
             by clearing the search, an empty branch of the fleet is not. */
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <span
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
            >
              <ItemGlyph categoryIds={[category.id]} size={26} />
            </span>
            <p className="mt-6 font-heading text-[1.4rem] font-bold text-ink">{t("rentalCategory.empty")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("rentalCategory.emptyBody")}</p>
            <Link href={searchTerm ? base : localePath(locale, "/rental")} className={buttonClasses({ className: "mt-8" })}>
              {searchTerm ? t("rentalCategory.clearSearch") : t("rentalCategory.allItems")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((item, index) => {
                const signal = signalById.get(item.id);
                if (!signal) return null;
                return (
                  <li key={item.id} className="flex">
                    <RentalCard item={item} signal={signal} locale={locale} t={t} priority={index < 3} />
                  </li>
                );
              })}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={category.name} className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: result.meta.totalPages }, (_, index) => index + 1).map((target) => {
                  const current = target === result.meta.page;
                  return (
                    <Link
                      key={target}
                      href={pageHref(target)}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex size-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${
                        current
                          ? "border-primary bg-primary text-on-primary"
                          : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
                      }`}
                    >
                      <span dir="ltr">{number(target)}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </>
        )}
      </Section>

      {/*
        THE JUNCTION — the reason this page is not a dead end: the bottom of a
        category is where a reader either leaves or goes next door. Each shelf is
        a door with its glyph in an icon well; a child names its parent on a
        RESERVED line, so the two cards that have one do not sit lower than the
        rest of the row.
      */}
      {/* No bottom padding: the help band below is white too and brings its own. */}
      <Section
        labelledBy={elsewhere.length > 0 ? "rental-category-more" : "rental-category-cta"}
        className="pb-0 sm:pb-0 lg:pb-0"
      >
        {elsewhere.length > 0 ? (
          <>
            <SectionHead
              id="rental-category-more"
              title={t("rentalCategory.moreTitle")}
              lead={t("rentalCategory.moreLead")}
              actions={
                <Link href={localePath(locale, "/rental")} className={buttonClasses({ variant: "outline" })}>
                  {t("rentalCategory.allItems")}
                </Link>
              }
            />
            <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {elsewhere.map((entry) => {
                const entryParent = entry.parentId ? categoryById.get(entry.parentId) : undefined;
                return (
                  <li key={entry.id} className="flex">
                    <Link
                      href={categoryHref(entry)}
                      className="group flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:p-7"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
                      >
                        <ItemGlyph categoryIds={[entry.id]} size={28} />
                      </span>

                      <span className="mt-6 block min-h-5 text-[12.5px] leading-5 text-accent-strong">
                        {entryParent ? t("rentalCategory.inParent", { parent: entryParent.name }) : null}
                      </span>
                      <span className="mt-1 block font-heading text-[1.15rem] leading-snug font-semibold text-ink">
                        {entry.name}
                      </span>
                      <span className="mt-2 line-clamp-3 block text-[14px] leading-relaxed text-body">
                        {entry.description ?? t("rentalCategory.leadFallback")}
                      </span>

                      <span className="mt-auto flex justify-end pt-6">
                        <span className="grid size-10 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
                          <ArrowIcon />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </Reveal>
          </>
        ) : null}

        <RentalDesk
          id="rental-category-cta"
          title={t("rentalCategory.ctaTitle")}
          body={t("rentalCategory.ctaBody")}
          action={t("rentalCategory.ctaAction")}
          href={localePath(locale, "/contact")}
          flush={elsewhere.length === 0}
        />
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
