import Link from "next/link";

import { ArrowIcon, buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { shopService } from "@/features/shop";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { HelpBand } from "../../_components/help-band";
import { BrandLogo } from "../_components/brand-logo";
import { EmptyShelf } from "../_components/catalogue";
import { ProductCard } from "../_components/product-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/brands">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/shop/brands",
    title: t("brands.title"),
    description: t("brands.description"),
  });
}

/**
 * THE BRAND INDEX — a SHORT INDEX, not a grid.
 *
 * There are three brands, and a three-up grid of cards for three things is a
 * grid that exists because the last page had one. So each brand gets a block:
 * the name set large with its logo when staff have uploaded one, what it is
 * for, how many products carry it, and a preview of the actual products — the
 * three best-rated, which is the honest answer to "what is this brand like on
 * your shelves".
 *
 *   PageHero   the list's promise, and four figures counted from the shelves
 *   brands     one block each, separated by hairlines, on the white band
 *   request    "looking for a brand we don't carry?" — the one deep band
 *   help       the site's closing band
 *
 * WHERE THE NUMBERS COME FROM. `Brand` carries no count and no product list.
 * Both come from the same `listProducts({ brandSlugs: [slug] })` call the brand
 * page itself runs, so the figure here is the number found after the click
 * rather than a second total maintained somewhere else and drifting from it.
 *
 * Everything renders on the server; this route ships no JavaScript of its own
 * beyond the scroll reveal.
 */
export default async function ShopBrandsPage({ params }: PageProps<"/[locale]/shop/brands">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const brands = await shopService.listBrands(locale);

  /*
   * `pageSize` past the catalogue rather than `pageSize: 3`: the preview only
   * needs three, but the hero's figures are counted across every product a
   * brand carries, and a page-one slice cannot be counted. `meta.totalItems`
   * is the unpaginated total either way, so this call answers the count, the
   * preview and the coverage at once.
   */
  const entries = await Promise.all(
    brands.map(async (brand) => {
      const result = await shopService.listProducts({
        locale,
        brandSlugs: [brand.slug],
        sort: "rating-desc",
        pageSize: 60,
      });
      return { brand, items: result.items, total: result.meta.totalItems };
    }),
  );

  const totalProducts = entries.reduce((sum, entry) => sum + entry.total, 0);
  const sportIds = new Set(entries.flatMap((entry) => entry.items.flatMap((item) => item.sportIds)));
  const categoryIds = new Set(entries.flatMap((entry) => entry.items.flatMap((item) => item.categoryIds)));

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("shop.title"), href: localePath(locale, "/shop") },
          { label: t("brands.title") },
        ]}
        eyebrow={t("brands.eyebrow")}
        title={t("brands.heroTitle")}
        lead={t("brands.heroLead")}
      >
        <HeroFacts
          items={[
            { label: t("brands.statBrands"), value: <span dir="ltr">{number(brands.length)}</span> },
            { label: t("brands.statProducts"), value: <span dir="ltr">{number(totalProducts)}</span> },
            { label: t("shop.statCategories"), value: <span dir="ltr">{number(categoryIds.size)}</span> },
            { label: t("brands.statSports"), value: <span dir="ltr">{number(sportIds.size)}</span> },
          ]}
        />
      </PageHero>

      <Section labelledBy="brands-list">
        <h2 id="brands-list" className="sr-only">
          {t("brands.listLabel")}
        </h2>
        {entries.length === 0 ? (
          <EmptyShelf title={t("brands.empty")} body={t("brands.emptyBody")}>
            <Link href={localePath(locale, "/shop")} className={buttonClasses()}>
              {t("brands.emptyAction")}
            </Link>
          </EmptyShelf>
        ) : (
          <ul className="space-y-16 lg:space-y-20">
            {entries.map(({ brand, items, total }, brandIndex) => (
              <li key={brand.id} className="border-t border-line pt-16 first:border-t-0 first:pt-0 lg:pt-20">
                <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
                  <div className="flex min-w-0 items-center gap-5 sm:gap-7">
                    {brand.logo ? (
                      <BrandLogo logo={brand.logo} sizes="144px" className="h-16 w-28 sm:h-20 sm:w-36" />
                    ) : (
                      /* Without a logo the brand's initial, set like a seal —
                         so the row keeps its rhythm rather than starting on a
                         gap where a mark will one day go. */
                      <span
                        aria-hidden="true"
                        className="grid size-16 shrink-0 place-items-center rounded-full bg-deep font-heading text-2xl font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-surface sm:size-20 sm:text-3xl"
                        dir="ltr"
                      >
                        {brand.name.charAt(0)}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="eyebrow">{t("brandDetail.eyebrow")}</p>
                      <h2 id={`brand-${brand.slug}`} className="mt-2 text-[2rem] leading-[1.05] sm:text-[2.6rem]">
                        {/* A proper noun: never translated, and isolated so the
                            bidi algorithm cannot fold a Latin name into the
                            Arabic line around it. */}
                        <span dir="ltr">{brand.name}</span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* A bare noun UNDER the figure, not "{n} products":
                        Arabic plural agreement changes with the number. */}
                    <p className="text-center">
                      <span className="block font-heading text-[1.9rem] leading-none font-bold text-primary" dir="ltr">
                        {number(total)}
                      </span>
                      <span className="mt-1.5 block text-[12px] text-body/75">{t("brands.productsLabel")}</span>
                    </p>

                    {/* Three links reading "See everything" are three identical
                        announcements out of context, so each one names its own
                        brand to a screen reader. */}
                    <Link
                      href={localePath(locale, `/shop/brands/${brand.slug}`)}
                      aria-label={t("brands.viewAllOf", { brand: brand.name })}
                      className={buttonClasses({ variant: "outline" })}
                    >
                      {t("brands.viewAll")}
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>

                {brand.description ? (
                  <p className="mt-5 max-w-[60ch] text-[1.05rem] leading-relaxed text-body">{brand.description}</p>
                ) : null}

                {items.length === 0 ? (
                  <p className="mt-10 rounded-3xl border border-line bg-canvas px-6 py-12 text-center text-[15px] text-body">
                    {t("brands.noProducts")}
                  </p>
                ) : (
                  /* Three at most. This is an index, not the brand page — the
                     button above goes there. No `brand` prop on the cards: the
                     name is set large directly above them. */
                  <Reveal className="mt-10">
                    <ul
                      aria-label={t("brands.previewLabel", { brand: brand.name })}
                      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {items.slice(0, 3).map((product, index) => (
                        <li key={product.id} className="flex">
                          <ProductCard product={product} locale={locale} t={t} priority={brandIndex === 0 && index < 3} />
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section tone="deep" labelledBy="brands-cta" className="py-14 sm:py-16 lg:py-20">
        <SectionHead
          id="brands-cta"
          tone="dark"
          title={t("brands.ctaTitle")}
          lead={t("brands.ctaBody")}
          actions={
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("brands.ctaAction")}
            </Link>
          }
        />
      </Section>

      <HelpBand locale={locale} topic="shop" />
    </>
  );
}
