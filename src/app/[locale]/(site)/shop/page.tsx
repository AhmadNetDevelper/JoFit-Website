import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { parseProductListQuery, PRODUCT_SORT_KEYS, shopService } from "@/features/shop";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, readParams, resolveSearchParams } from "@/lib";

import { HelpBand } from "../_components/help-band";
import { EmptyShelf, Pagination, QuoteNote } from "./_components/catalogue";
import { CategoryTile } from "./_components/category-tile";
import { ShieldIcon, TagIcon, TruckIcon } from "./_components/icons";
import { ProductCard } from "./_components/product-card";
import { ShopFilters } from "./_components/shop-filters";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/shop",
    title: t("shop.title"),
    description: t("shop.description"),
  });
}

/**
 * THE SHOP INDEX — the formal redesign's listing recipe, applied to the shelf.
 *
 *   PageHero     what the shop is, with four figures COUNTED from the
 *                unfiltered catalogue (never typed in)
 *   filters      the white rail rising over the hero's foot: search, category,
 *                brand, sport, sort — all links and one GET form
 *   grid         the product cards, with their real prices
 *   categories   every shelf, one step away
 *   why          the three reasons to buy here, on the one deep band, closed by
 *                the club-quote note
 *   help         the site's closing band
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO <Suspense>.
 *
 * Every band above the grid needs `listProducts` anyway — the hero counts the
 * catalogue, the rail counts the results — so the page cannot paint before the
 * call resolves and a boundary would only ever wrap work that had already
 * happened. The note about `loading.tsx` and soft 404s lives on the product
 * route, where a boundary is real.
 *
 * Everything renders on the server. The filters are links, the search is a GET
 * form, and this route ships no JavaScript of its own beyond the scroll reveal.
 */
export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/shop">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const query = parseProductListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;

  /* `query.sort` is typed `string` because `ListQuery` is shared across every
     domain and each one has its own sort vocabulary. Narrowing it here against
     the shop's own keys is what lets the rail's pressed states be exhaustive
     rather than string comparisons. */
  const sort = PRODUCT_SORT_KEYS.find((key) => key === query.sort);

  const state = {
    search: readParam(search, "q"),
    sort,
    categorySlugs: readParams(search, "category"),
    brandSlugs: readParams(search, "brand"),
    sportSlugs: readParams(search, "sport"),
  };

  const [result, everything, categories, brands, sports] = await Promise.all([
    shopService.listProducts({ ...query, page, pageSize: 9 }),
    /*
     * The unfiltered catalogue, for the hero's figures. A figure that moved
     * every time somebody ticked a filter would be reporting the filter rather
     * than the shop.
     */
    shopService.listProducts({ locale, pageSize: 200 }),
    shopService.listCategories(locale),
    shopService.listBrands(locale),
    sportsService.list({ locale }),
  ]);

  /* Only sports something is actually sold for: a filter chip that can only
     ever return nothing is a dead end with a label on it. */
  const stockedSportIds = new Set(everything.items.flatMap((product) => product.sportIds));
  const filterSports = sports.filter((sport) => stockedSportIds.has(sport.id));

  const brandById = new Map(brands.map((brand) => [brand.id, brand]));

  /* Counted off the same unfiltered catalogue as the hero, so a tile states
     what is on the shelf rather than what the current filter left of it. */
  const categoryTiles = categories.map((category) => {
    const parent = category.parentId ? categories.find((entry) => entry.id === category.parentId) : undefined;
    return {
      category,
      count: number(everything.items.filter((product) => product.categoryIds.includes(category.id)).length),
      /* A child names its parent, so footwear reads as part of apparel. */
      note: parent ? t("shopCategory.inParent", { parent: parent.name }) : null,
    };
  });

  /* A rating averaged over nothing is a dash, not `0.0`. */
  const rated = everything.items.filter((product) => product.rating.count > 0);
  const averageRating = rated.length
    ? (rated.reduce((sum, product) => sum + product.rating.average, 0) / rated.length).toFixed(1)
    : "—";

  const promises = [
    { icon: <ShieldIcon size={24} />, title: t("shop.why1"), body: t("shop.why1Body") },
    { icon: <TruckIcon size={24} />, title: t("shop.why2"), body: t("shop.why2Body") },
    { icon: <TagIcon size={24} />, title: t("shop.why3"), body: t("shop.why3Body") },
  ];

  const pageLink = (target: number) =>
    `${localePath(locale, "/shop")}${buildQueryString({
      q: state.search,
      sort: state.sort,
      category: [...state.categorySlugs],
      brand: [...state.brandSlugs],
      sport: [...state.sportSlugs],
      page: target > 1 ? target : undefined,
    })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("shop.title") }]}
        eyebrow={t("shop.eyebrow")}
        title={t("shop.heroTitle")}
        lead={t("shop.heroLead")}
        actions={
          <>
            <Link href="#shop-categories" className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("shopCategories.title")}
            </Link>
            <Link href={localePath(locale, "/shop/brands")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("nav.brands")}
            </Link>
          </>
        }
      >
        <HeroFacts
          items={[
            { label: t("shop.statProducts"), value: <span dir="ltr">{number(everything.meta.totalItems)}</span> },
            { label: t("shop.statBrands"), value: <span dir="ltr">{number(brands.length)}</span> },
            { label: t("shop.statCategories"), value: <span dir="ltr">{number(categories.length)}</span> },
            { label: t("shop.statRating"), value: <span dir="ltr">{averageRating}</span> },
          ]}
        />
      </PageHero>

      <div data-band>
        <ShopFilters
          locale={locale}
          t={t}
          state={state}
          categories={categories}
          brands={brands}
          sports={filterSports}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{t("shop.title")}</h2>
        {result.items.length === 0 ? (
          <EmptyShelf title={t("shop.empty")} body={t("shop.emptyBody")}>
            <Link href={localePath(locale, "/shop")} className={buttonClasses()}>
              {t("shop.filterClear")}
            </Link>
          </EmptyShelf>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product, index) => (
                <li key={product.id} className="flex">
                  <ProductCard
                    product={product}
                    brand={brandById.get(product.brandId)}
                    locale={locale}
                    t={t}
                    priority={index < 3}
                  />
                </li>
              ))}
            </Reveal>

            <Pagination
              label={t("shop.title")}
              current={result.meta.page}
              total={result.meta.totalPages}
              hrefFor={pageLink}
              format={number}
            />
          </>
        )}
      </Section>

      {/* SHOP BY CATEGORY — every shelf, counted off the whole catalogue. The
          hero's first action lands here. */}
      {categoryTiles.length > 0 ? (
        <Section id="shop-categories" labelledBy="shop-categories-heading" className="scroll-mt-6">
          <SectionHead
            id="shop-categories-heading"
            eyebrow={t("shop.categories")}
            title={t("shopCategories.title")}
            lead={t("shopCategories.lead")}
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map(({ category, count, note }) => (
              <li key={category.id} className="flex">
                <CategoryTile
                  category={category}
                  href={localePath(locale, `/shop/categories/${category.slug}`)}
                  count={count}
                  countLabel={t("shop.statProducts")}
                  description={category.description}
                  note={note}
                />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      {/*
        WHY BUY HERE — the page's one deep band. Three reasons, unnumbered:
        they are not a sequence, and numbering things that are not ordered is
        the commonest way that device gets misused. The club-quote note closes
        the band, frosted on the deep ground.
      */}
      <Section tone="deep" labelledBy="shop-why">
        <SectionHead id="shop-why" tone="dark" eyebrow={t("landing.whyEyebrow")} title={t("shop.whyTitle")} lead={t("shop.whyLead")} />

        <Reveal stagger as="ul" className="mt-12 grid gap-5 md:grid-cols-3">
          {promises.map((promise) => (
            <li key={promise.title} className="rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-full bg-deep-2 text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-deep"
              >
                {promise.icon}
              </span>
              <h3 className="mt-6 text-[1.1rem] leading-snug text-white">{promise.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-white/70">{promise.body}</p>
            </li>
          ))}
        </Reveal>

        <QuoteNote
          tone="dark"
          title={t("shop.ctaTitle")}
          body={t("shop.ctaBody")}
          action={t("shop.ctaAction")}
          href={localePath(locale, "/contact")}
        />
      </Section>

      <HelpBand locale={locale} topic="shop" />
    </>
  );
}
