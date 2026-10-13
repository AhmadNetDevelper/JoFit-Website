import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead, type Crumb } from "@/components/ui";
import {
  parseProductListQuery,
  PRODUCT_SORT_KEYS,
  shopService,
  type ProductCategory,
  type ProductSortKey,
} from "@/features/shop";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildQueryString, metadataFromSeo, readNumberParam, readParam, resolveSearchParams } from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { EmptyShelf, Pagination, pillClasses, QuoteNote, SortLinks } from "../../_components/catalogue";
import { CategoryTile } from "../../_components/category-tile";
import { ProductCard } from "../../_components/product-card";

/**
 * The 404 branch is answered twice on purpose — here and in the page — because
 * Next resolves metadata and the component independently. Returning a `noIndex`
 * document rather than letting this throw is what keeps a mistyped slug out of
 * the index instead of serving it a category's worth of canonical tags.
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/shop/categories/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const category = await shopService.getCategoryBySlug(slug, locale);
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
    description: category.description ?? t("shopCategory.leadFallback"),
    path: `/shop/categories/${category.slug}`,
  });
}

/**
 * A SHOP CATEGORY — the shop index narrowed to one shelf, and deliberately the
 * same recipe: the hero with figures about THIS shelf, a rail rising over its
 * foot, the grid, the other shelves, the help band. Two pages that show
 * products should not look like two different shops.
 *
 * The rail is a category SWITCHER and a sort, not the index's full filter set:
 * a visitor who arrived on a category link came for a shelf, not for a search
 * box, and a second copy of the index's filters here would just be the index
 * with extra steps.
 *
 * THE TREE IS NOT FLATTENED. `parentId` is real — footwear is a child of
 * apparel — so the rail carries two rows when it applies: the top level, with
 * the current branch marked, and below it the branch's own children. The
 * breadcrumb walks the same path, and a child category names its parent on the
 * cards at the foot. Rendering every category as a peer would throw away the
 * one piece of structure the catalogue has.
 *
 * Everything renders on the server. Every control is a link; this route ships
 * no JavaScript of its own beyond the scroll reveal.
 */
export default async function ShopCategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/shop/categories/[slug]">) {
  const [{ locale: raw, slug }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { money, number } = getFormatters(locale);

  const category = await shopService.getCategoryBySlug(slug, locale);
  if (!category) notFound();

  const query = parseProductListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;

  /* `query.sort` is typed `string` because `ListQuery` is shared across every
     domain. Narrowing it against the shop's own keys is what lets the rail's
     pressed states be exhaustive rather than string comparisons. */
  const sort = PRODUCT_SORT_KEYS.find((key) => key === query.sort);
  const searchTerm = readParam(search, "q");

  const [result, everything, catalogue, categories, brands] = await Promise.all([
    /* The category is part of the query, not a separate code path — the slug
       overrides whatever `category` params happen to be in the URL, because on
       this route the path is the filter. */
    shopService.listProducts({ ...query, categorySlugs: [category.slug], page, pageSize: 9 }),
    /*
     * The shelf as a whole, for the hero's figures. A figure that moved every
     * time somebody re-sorted would be reporting the query rather than the
     * category — the same reasoning the index uses for the catalogue.
     */
    shopService.listProducts({ locale, categorySlugs: [category.slug], pageSize: 200 }),
    /* The whole catalogue, for the other shelves' counts at the foot — counted
       the way the index's tiles are, so the two pages agree. */
    shopService.listProducts({ locale, pageSize: 200 }),
    shopService.listCategories(locale),
    shopService.listBrands(locale),
  ]);

  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));

  /*
   * THE BRANCH THIS PAGE SITS ON.
   *
   * `rootBranch` is the top-level category the visitor is inside — itself for a
   * root, its parent for a child. The rail's first row marks that one, so
   * standing on /footwear still shows Apparel lit: the reader can see where
   * they are in the tree rather than only what they are looking at.
   */
  const parent = category.parentId ? categoryById.get(category.parentId) : undefined;
  const rootBranch = parent ?? category;
  const roots = categories.filter((entry) => entry.parentId === null);
  const branchChildren = categories.filter((entry) => entry.parentId === rootBranch.id);

  /* ------------------------------------------------------------------ */
  /* The figures, all of them about THIS category.                       */

  const onShelf = (entry: ProductCategory) =>
    catalogue.items.filter((product) => product.categoryIds.includes(entry.id));
  const shelf = everything.items;
  const shelfBrands = new Set(shelf.map((product) => product.brandId));
  const rated = shelf.filter((product) => product.rating.count > 0);
  const averageRating = rated.reduce((sum, product) => sum + product.rating.average, 0) / (rated.length || 1);
  const cheapest = shelf.reduce<(typeof shelf)[number]["priceRange"]["min"] | undefined>(
    (lowest, product) => (!lowest || product.priceRange.min.amount < lowest.amount ? product.priceRange.min : lowest),
    undefined,
  );

  /* An em dash, not a zero: a shelf with nothing on it has no average rating
     and no cheapest price, and printing `0.0` would state a fact that is not
     true rather than admitting there is nothing to report. */
  const facts = [
    { label: t("shop.statProducts"), value: number(everything.meta.totalItems) },
    { label: t("shop.statBrands"), value: number(shelfBrands.size) },
    { label: t("shop.statRating"), value: rated.length > 0 ? averageRating.toFixed(1) : "—" },
    { label: t("shopCategory.statFrom"), value: cheapest ? money(cheapest) : "—" },
  ];

  /* ------------------------------------------------------------------ */
  /* Links. None of them carries `page`: narrowing or re-sorting while
     standing on page three of a set that is about to shrink lands the
     visitor on an empty screen with no clue why. */

  const base = localePath(locale, `/shop/categories/${category.slug}`);
  const categoryHref = (entry: ProductCategory) =>
    `${localePath(locale, `/shop/categories/${entry.slug}`)}${buildQueryString({ sort })}`;
  const sortHref = (next: ProductSortKey | undefined) => `${base}${buildQueryString({ q: searchTerm, sort: next })}`;
  const pageHref = (target: number) =>
    `${base}${buildQueryString({ q: searchTerm, sort, page: target > 1 ? target : undefined })}`;

  /* The crumb walks the real tree, so a child category shows its parent rather
     than pretending it hangs off the shop root. */
  const crumbs: Crumb[] = [
    { label: t("nav.home"), href: localePath(locale, "/") },
    { label: t("shop.title"), href: localePath(locale, "/shop") },
    ...(parent ? [{ label: parent.name, href: localePath(locale, `/shop/categories/${parent.slug}`) }] : []),
    { label: category.name },
  ];

  /* The foot of the page: every other shelf, each one still knowing where it
     hangs in the tree. */
  const elsewhere = categories.filter((entry) => entry.id !== category.id);
  /* The parent line is reserved on every card only when one of them has it. */
  const anyNested = elsewhere.some((entry) => entry.parentId !== null);

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={crumbs}
        eyebrow={parent ? t("shopCategory.inParent", { parent: parent.name }) : t("shopCategory.eyebrow")}
        title={category.name}
        lead={category.description ?? t("shopCategory.leadFallback")}
      >
        <HeroFacts items={facts.map((fact) => ({ label: fact.label, value: <span dir="ltr">{fact.value}</span> }))} />
      </PageHero>

      {/*
        THE RAIL, rising over the hero's foot like the index's. A switcher and a
        sort, both plain links, so the page stays static.
      */}
      <div data-band>
        <section aria-label={t("shop.filters")} className="bg-canvas pb-2">
          <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{t("shop.filterCategory")}</p>
                  <ul className="flex flex-wrap gap-2">
                    <li>
                      <Link href={localePath(locale, "/shop")} className={pillClasses(false)}>
                        {t("shopCategory.allProducts")}
                      </Link>
                    </li>
                    {roots.map((entry) => {
                      const active = entry.id === rootBranch.id;
                      return (
                        <li key={entry.id}>
                          <Link
                            href={categoryHref(entry)}
                            aria-current={active ? "page" : undefined}
                            className={pillClasses(active)}
                          >
                            {entry.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* The second level, shown only where there is one. This is the
                    row that keeps footwear findable from apparel instead of
                    stranding it beside its own parent as though they were
                    peers. */}
                {branchChildren.length > 0 ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">
                      {t("shopCategory.within", { category: rootBranch.name })}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {branchChildren.map((entry) => {
                        const active = entry.id === category.id;
                        return (
                          <li key={entry.id}>
                            <Link
                              href={categoryHref(entry)}
                              aria-current={active ? "page" : undefined}
                              className={pillClasses(active)}
                            >
                              {entry.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                <p className="text-[13px] text-body">
                  {t("shop.showingCount", {
                    shown: number(result.items.length),
                    total: number(result.meta.totalItems),
                  })}
                </p>
                <SortLinks t={t} current={sort} hrefFor={sortHref} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{category.name}</h2>
        {result.items.length === 0 ? (
          /* Which way out depends on why it is empty: a search that matched
             nothing is undone by clearing the search, an unstocked shelf is not. */
          <EmptyShelf title={t("shop.emptyCategory")} body={t("shopCategory.emptyBody")}>
            <Link href={searchTerm ? base : localePath(locale, "/shop")} className={buttonClasses()}>
              {searchTerm ? t("shop.filterClear") : t("shopCategory.allProducts")}
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
              label={category.name}
              current={result.meta.page}
              total={result.meta.totalPages}
              hrefFor={pageHref}
              format={number}
            />
          </>
        )}
      </Section>

      {/*
        THE REST OF THE SHOP — the reason this page is not a dead end: the foot
        of a shelf is where a reader either leaves or goes next door. The same
        card the index uses, so the shelf you are offered looks like the shelf
        you are standing on. The club-quote note closes the band.
      */}
      <Section labelledBy="category-more" className="pb-6 sm:pb-8 lg:pb-10">
        <SectionHead id="category-more" title={t("shopCategory.moreTitle")} lead={t("shopCategory.moreLead")} />

        {elsewhere.length > 0 ? (
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {elsewhere.map((entry) => {
              const entryParent = entry.parentId ? categoryById.get(entry.parentId) : undefined;
              return (
                <li key={entry.id} className="flex">
                  <CategoryTile
                    category={entry}
                    href={categoryHref(entry)}
                    count={number(onShelf(entry).length)}
                    countLabel={t("shop.statProducts")}
                    description={entry.description ?? t("shopCategory.leadFallback")}
                    note={anyNested ? (entryParent ? t("shopCategory.inParent", { parent: entryParent.name }) : null) : undefined}
                  />
                </li>
              );
            })}
          </Reveal>
        ) : null}

        <QuoteNote
          title={t("shop.ctaTitle")}
          body={t("shop.ctaBody")}
          action={t("shop.ctaAction")}
          href={localePath(locale, "/contact")}
          headingLevel="h2"
        />
      </Section>

      <HelpBand locale={locale} topic="shop" />
    </>
  );
}

