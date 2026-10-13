import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon, buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { PRODUCT_SORT_KEYS, shopService, type Brand, type ProductSortKey } from "@/features/shop";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, resolveSearchParams } from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { BrandLogo } from "../../_components/brand-logo";
import { EmptyShelf, Pagination, QuoteNote, SortLinks } from "../../_components/catalogue";
import { TruckIcon } from "../../_components/icons";
import { ProductCard } from "../../_components/product-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/brands/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const brand = await shopService.getBrandBySlug(slug, locale);
  if (!brand) return buildMetadata({ locale, title: "Not found", noIndex: true });

  return buildMetadata({
    locale,
    title: brand.name,
    description: brand.description ?? t("brandDetail.lead", { brand: brand.name }),
    path: `/shop/brands/${brand.slug}`,
  });
}

/**
 * ONE BRAND, AND EVERYTHING IT SELLS — the shop's listing recipe narrowed to a
 * single maker: the hero with the brand's own figures, the sort rail over its
 * foot, the grid, a way out to the other brands, the help band. Same product
 * card as `/shop`, because a brand page is the catalogue filtered — not a
 * second catalogue with its own furniture.
 *
 * WHAT IS DELIBERATELY ABSENT. There is no filter rail here. The page IS the
 * brand filter; offering a brand facet inside it would let a reader tick a
 * second brand and land somewhere this URL no longer describes. Sort is the
 * only control, because ordering a set is not the same as changing it.
 *
 * Everything renders on the server: sort is a link, pagination is a link, and
 * this route ships no JavaScript of its own beyond the scroll reveal.
 */
export default async function BrandPage({ params, searchParams }: PageProps<"/[locale]/shop/brands/[slug]">) {
  const [{ locale: raw, slug }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const brand = await shopService.getBrandBySlug(slug, locale);
  if (!brand) notFound();

  /* Narrowed against the shop's own sort vocabulary rather than trusted from
     the URL: `ListQuery.sort` is a shared `string` across every domain. */
  const sort = PRODUCT_SORT_KEYS.find((key) => key === readParam(search, "sort"));
  const page = readNumberParam(search, "page") ?? 1;

  const [result, range, brands] = await Promise.all([
    shopService.listProducts({ locale, brandSlugs: [brand.slug], sort, page, pageSize: 9 }),
    /*
     * The brand's whole range, unpaginated, for the hero's figures. Counting
     * the current page would make the figures report the pagination rather
     * than the brand.
     */
    shopService.listProducts({ locale, brandSlugs: [brand.slug], pageSize: 200 }),
    shopService.listBrands(locale),
  ]);

  const others = brands.filter((entry) => entry.id !== brand.id);
  const otherEntries = await Promise.all(
    others.map(async (entry) => ({
      brand: entry,
      /* The count comes from the same query that page runs, so the number here
         is the number of products found after the click. */
      count: (await shopService.listProducts({ locale, brandSlugs: [entry.slug], pageSize: 1 })).meta.totalItems,
    })),
  );

  const stocked = range.items.length > 0;

  const categoryIds = new Set(range.items.flatMap((product) => product.categoryIds));
  const sportIds = new Set(range.items.flatMap((product) => product.sportIds));
  const rated = range.items.filter((product) => product.rating.count > 0);
  const averageRating = rated.length
    ? rated.reduce((sum, product) => sum + product.rating.average, 0) / rated.length
    : 0;

  const base = localePath(locale, `/shop/brands/${brand.slug}`);

  /* No link carries `page`: re-sorting is a new reading order, and landing on
     page three of it is not where anybody asked to be. */
  const sortLink = (next?: ProductSortKey) => `${base}${buildQueryString({ sort: next })}`;
  const pageLink = (target: number) => `${base}${buildQueryString({ sort, page: target > 1 ? target : undefined })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("shop.title"), href: localePath(locale, "/shop") },
          { label: t("brands.title"), href: localePath(locale, "/shop/brands") },
          { label: brand.name },
        ]}
        eyebrow={t("brandDetail.eyebrow")}
        /* `dir="ltr"` on the SPAN, not the heading: a proper noun must not be
           reordered, but direction on the `h1` would also flip its own logical
           properties on a right-to-left page. */
        title={<span dir="ltr">{brand.name}</span>}
        lead={brand.description ?? t("brandDetail.lead", { brand: brand.name })}
        /* The mark on a white card when staff have uploaded one — a logo is
           drawn for a white page; contained, never cropped (`BrandLogo`). */
        aside={
          brand.logo ? (
            <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-lift">
              <BrandLogo logo={brand.logo} priority sizes="320px" className="aspect-[3/2] w-full" />
            </div>
          ) : undefined
        }
      >
        {/* Only when there is a range to describe: four zeros under a headline
            is exactly what makes an empty page read as a broken one. An
            unrated range reports a dash, not `0.0`. */}
        {stocked ? (
          <HeroFacts
            items={[
              { label: t("brandDetail.statProducts"), value: <span dir="ltr">{number(range.meta.totalItems)}</span> },
              { label: t("brandDetail.statCategories"), value: <span dir="ltr">{number(categoryIds.size)}</span> },
              { label: t("brandDetail.statSports"), value: <span dir="ltr">{number(sportIds.size)}</span> },
              {
                label: t("brandDetail.statRating"),
                value: <span dir="ltr">{rated.length ? averageRating.toFixed(1) : "—"}</span>,
              },
            ]}
          />
        ) : null}
      </PageHero>

      {/* THE RAIL — sort and the result count, nothing else, and only when
          there is something to order. */}
      {stocked ? (
        <div data-band>
          <section aria-label={t("shop.sortLabel")} className="bg-canvas pb-2">
            <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
              <div className="relative -mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface px-5 py-4 shadow-lift sm:px-7 sm:py-5 lg:-mt-10">
                <p className="text-[13px] text-body">
                  {t("shop.showingCount", {
                    shown: number(result.items.length),
                    total: number(range.meta.totalItems),
                  })}
                  {" · "}
                  <Link
                    href={localePath(locale, "/shop/brands")}
                    className="font-semibold text-primary-dark underline-offset-4 hover:underline"
                  >
                    {t("brandDetail.allBrands")}
                  </Link>
                </p>
                <SortLinks t={t} current={sort} hrefFor={sortLink} />
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <Section tone="muted" className={stocked ? "pt-10 sm:pt-12 lg:pt-14" : ""}>
        <h2 className="sr-only">
          <span dir="ltr">{brand.name}</span>
        </h2>
        {result.items.length === 0 ? (
          /* A brand can be listed and still have nothing on it; that has to read
             as a fact about the stock rather than a fault in the page. */
          <EmptyShelf title={t("brandDetail.emptyTitle")} body={t("brandDetail.emptyBody")} icon={<TruckIcon size={24} />}>
            <Link href={localePath(locale, "/shop")} className={buttonClasses()}>
              {t("brandDetail.emptyAction")}
            </Link>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline" })}>
              {t("brandDetail.emptyAsk")}
            </Link>
          </EmptyShelf>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product, index) => (
                <li key={product.id} className="flex">
                  {/* No brand chip: every product here is this brand. */}
                  <ProductCard product={product} locale={locale} t={t} priority={index < 3} />
                </li>
              ))}
            </Reveal>

            <Pagination
              label={brand.name}
              current={result.meta.page}
              total={result.meta.totalPages}
              hrefFor={pageLink}
              format={number}
            />
          </>
        )}
      </Section>

      {/*
        THE WAY OUT. A brand page is the easiest place on a catalogue to strand
        somebody, so it names the other brands by hand rather than leaving the
        reader to find the breadcrumb, and closes on the quote note.
      */}
      <Section labelledBy={otherEntries.length > 0 ? "brand-others" : undefined} className="pb-6 sm:pb-8 lg:pb-10">
        {otherEntries.length > 0 ? (
          <>
            <SectionHead id="brand-others" title={t("brandDetail.otherTitle")} lead={t("brandDetail.otherLead")} />
            <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherEntries.map((entry) => (
                <li key={entry.brand.id} className="flex">
                  <BrandTile
                    brand={entry.brand}
                    href={localePath(locale, `/shop/brands/${entry.brand.slug}`)}
                    count={number(entry.count)}
                    countLabel={t("brandDetail.statProducts")}
                    action={t("brandDetail.otherAction")}
                  />
                </li>
              ))}
            </Reveal>
          </>
        ) : null}

        <QuoteNote
          title={t("brandDetail.ctaTitle")}
          body={t("brandDetail.ctaBody")}
          action={t("brandDetail.ctaAction")}
          href={localePath(locale, "/contact")}
          headingLevel={otherEntries.length > 0 ? "h3" : "h2"}
        />
      </Section>

      <HelpBand locale={locale} topic="shop" />
    </>
  );
}

/**
 * Another brand, as a card: its mark (the logo, or its initial set like a
 * seal), the name, what it is for, how much of it is on the shelf. One link
 * covers the card.
 */
function BrandTile({
  brand,
  href,
  count,
  countLabel,
  action,
}: {
  brand: Brand;
  href: string;
  count: string;
  countLabel: string;
  action: string;
}) {
  return (
    <article className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:p-7">
      <div className="flex items-start justify-between gap-4">
        {brand.logo ? (
          <BrandLogo logo={brand.logo} sizes="96px" className="h-14 w-24" />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-deep font-heading text-xl font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-surface"
            dir="ltr"
          >
            {brand.name.charAt(0)}
          </span>
        )}
        <p className="text-end">
          <span className="block font-heading text-[1.5rem] leading-none font-bold text-ink" dir="ltr">
            {count}
          </span>
          <span className="mt-1 block text-[12px] text-body/75">{countLabel}</span>
        </p>
      </div>

      <h3 className="mt-6 text-[1.3rem] leading-snug">
        <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
          <span dir="ltr">{brand.name}</span>
        </Link>
      </h3>
      {/* Two lines reserved, so the footers line up whatever the descriptions do. */}
      <p className="mt-2 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{brand.description}</p>

      <div className="mt-auto pt-6">
        <p className="flex items-center gap-2 border-t border-line pt-4 text-[14px] font-semibold text-primary-dark transition-colors group-hover:text-primary">
          {action}
          <ArrowIcon />
        </p>
      </div>
    </article>
  );
}
