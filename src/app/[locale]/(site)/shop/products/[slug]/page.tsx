import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { reviewsService } from "@/features/reviews";
import { shopService } from "@/features/shop";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScriptProps, metadataFromSeo, productJsonLd } from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { BrandLogo } from "../../_components/brand-logo";
import { QuoteNote } from "../../_components/catalogue";
import { BallIcon, CalendarIcon, LayersIcon, StarIcon, TagIcon } from "../../_components/icons";
import { ProductCard } from "../../_components/product-card";
import { ProductMedia } from "../../_components/product-media";
import { BuyBox, type BuyBoxVariant } from "./_components/buy-box";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/products/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const product = await shopService.getProductBySlug(slug, locale);
  if (!product) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(product.seo, {
    locale,
    title: product.title,
    description: product.summary,
    path: `/shop/products/${product.slug}`,
    imageUrl: product.media.find((media) => media.kind === "image")?.url,
  });
}

/**
 * A PRODUCT — the formal redesign's detail recipe, applied to the shelf.
 *
 *   PageHero   what it is (category, name, summary, maker, rating) with the BUY
 *              CARD in the end column: the product's plate, the price, the
 *              variant picker, availability and the one action — the course
 *              page's facts card, with a price in it (shop prices are the
 *              catalogue's real figures; only course fees are withheld)
 *   body       the description and the sizes table, beside a sticky facts card
 *   reviews    the aggregate and what people wrote
 *   related    three things to look at next, and the club-quote note
 *   help       the closing band
 *
 * ---------------------------------------------------------------------------
 * ONE CLIENT COMPONENT, AND IT IS THE BUY BOX.
 *
 * Everything else renders on the server. `BuyBox` gets finished strings — the
 * formatter and the translator are functions and cannot cross the boundary —
 * so the prices below are formatted here, once, in the right locale.
 */
export default async function ProductPage({ params }: PageProps<"/[locale]/shop/products/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { money, number, date } = getFormatters(locale);

  const product = await shopService.getProductBySlug(slug, locale);
  if (!product) notFound();

  const [sports, related, reviews, brand, categories] = await Promise.all([
    sportsService.getManyByIds(product.sportIds, locale),
    shopService.listRelatedProducts(product.id, locale, 3),
    reviewsService.list({ locale, target: { type: "product", id: product.id }, pageSize: 3 }),
    shopService.listBrands(locale).then((all) => all.find((entry) => entry.id === product.brandId)),
    shopService.listCategories(locale),
  ]);

  const STOCK_LABEL = {
    "in-stock": t("shop.stockIn"),
    "low-stock": t("shop.stockLow"),
    "out-of-stock": t("shop.stockOut"),
    "pre-order": t("shop.stockPreOrder"),
  } as const;

  const variants: BuyBoxVariant[] = product.variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    selections: variant.selections,
    price: money(variant.price.current),
    compareAt: variant.price.compareAt ? money(variant.price.compareAt) : undefined,
    unitPrice: variant.price.current,
    stock: variant.stockStatus,
    stockLabel: STOCK_LABEL[variant.stockStatus],
  }));

  const productCategories = categories.filter((entry) => product.categoryIds.includes(entry.id));
  const primaryCategory = productCategories[0];

  /* Facts a shopper checks before they check anything else. Each is either a
     real field or left out — an empty row with a dash in it is worse than one
     fewer row. */
  type Fact = { icon: ReactNode; label: string; value: ReactNode };
  const factRows: (Fact | null)[] = [
    brand
      ? {
          icon: <TagIcon size={16} />,
          label: t("product.factBrand"),
          value: (
            <Link href={localePath(locale, `/shop/brands/${brand.slug}`)} className="text-primary-dark hover:underline">
              <span dir="ltr">{brand.name}</span>
            </Link>
          ),
        }
      : null,
    productCategories.length > 0
      ? {
          icon: <LayersIcon size={16} />,
          label: t("product.factCategory"),
          value: (
            <span className="flex flex-wrap gap-x-1.5">
              {productCategories.map((entry, index) => (
                <span key={entry.id}>
                  {index > 0 ? <span className="me-1.5 text-body/40">·</span> : null}
                  <Link
                    href={localePath(locale, `/shop/categories/${entry.slug}`)}
                    className="text-primary-dark hover:underline"
                  >
                    {entry.name}
                  </Link>
                </span>
              ))}
            </span>
          ),
        }
      : null,
    sports.length > 0
      ? {
          icon: <BallIcon size={16} />,
          label: t("product.factSports"),
          value: sports.map((sport) => sport.name).join(" · "),
        }
      : null,
    {
      icon: <CalendarIcon size={16} />,
      label: t("product.factAdded"),
      /*
       * NOT `dir="ltr"`, unlike the brand. `Intl.DateTimeFormat` already embeds
       * the bidi marks an Arabic date needs; an explicit LTR run made them
       * fight (pitfalls #11).
       */
      value: date(product.publishedAt),
    },
  ];
  const facts = factRows.filter((entry): entry is Fact => entry !== null);

  /*
   * The offer, and the trail to it.
   *
   * The price comes from the DEFAULT variant rather than the range's floor:
   * `priceRange.min` is a "from" figure, and quoting it as `price` in an Offer
   * advertises a number the shopper may not be charged. The stock flag is the
   * same reduction the card uses — a product is only out of stock when every
   * variant is.
   */
  const offerVariant = product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
  const canonical = absoluteUrl(localePath(locale, `/shop/products/${product.slug}`));
  const trail = [
    { name: t("site.name"), path: "/" },
    { name: t("shop.title"), path: "/shop" },
    { name: product.title, path: `/shop/products/${product.slug}` },
  ];

  const ratingLabel = `${t("shop.ratingValue", { rating: number(product.rating.average) })}, ${t("shop.reviewsCount", { count: number(product.rating.count) })}`;

  return (
    <>
      <script
        {...jsonLdScriptProps(
          productJsonLd({
            name: product.title,
            description: product.summary,
            url: canonical,
            sku: offerVariant?.sku,
            brand: brand?.name,
            image: product.media.find((entry) => entry.kind === "image")?.url,
            priceMinor: offerVariant?.price.current.amount ?? product.priceRange.min.amount,
            currency: offerVariant?.price.current.currency ?? product.priceRange.min.currency,
            inStock: product.variants.some((v) => v.stockStatus !== "out-of-stock"),
            rating: product.rating,
          }),
        )}
      />
      <script {...jsonLdScriptProps(breadcrumbJsonLd(locale, trail))} />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("shop.title"), href: localePath(locale, "/shop") },
          ...(primaryCategory
            ? [{ label: primaryCategory.name, href: localePath(locale, `/shop/categories/${primaryCategory.slug}`) }]
            : []),
          { label: product.title },
        ]}
        eyebrow={productCategories.map((entry) => entry.name).join(" · ") || undefined}
        title={product.title}
        lead={product.summary}
        actions={
          <>
            {/* The maker, as a way to the rest of its range. */}
            {brand ? (
              <Link
                href={localePath(locale, `/shop/brands/${brand.slug}`)}
                className="inline-flex h-11 items-center gap-2.5 rounded-full bg-white/[0.07] ps-1.5 pe-4 text-[14px] font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.12]"
              >
                {brand.logo ? (
                  <BrandLogo logo={brand.logo} sizes="48px" className="h-8 w-12 rounded-full" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-8 place-items-center rounded-full bg-accent font-heading text-[14px] font-bold text-deep"
                    dir="ltr"
                  >
                    {brand.name.charAt(0)}
                  </span>
                )}
                <span dir="ltr">{brand.name}</span>
              </Link>
            ) : null}
            {product.rating.count > 0 ? (
              <p className="inline-flex items-center gap-2 text-[14px] text-white/75" aria-label={ratingLabel}>
                <span className="text-accent">
                  <StarIcon size={16} />
                </span>
                <span className="font-heading text-lg font-bold text-white" dir="ltr">
                  {product.rating.average.toFixed(1)}
                </span>
                <span dir="ltr">{`(${number(product.rating.count)})`}</span>
              </p>
            ) : (
              <p className="text-[14px] text-white/60">{t("shop.noReviews")}</p>
            )}
          </>
        }
        aside={
          <div className="rounded-3xl bg-white p-4 text-ink shadow-lift">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
              <ProductMedia product={product} priority sizes="(min-width: 1024px) 440px, 100vw" glyphSize={64} />
            </div>
            <div className="px-2 pt-6 pb-2">
              <BuyBox
                productId={product.id}
                productSlug={product.slug}
                title={product.title}
                image={product.media.find((entry) => entry.kind === "image")}
                options={product.options}
                variants={variants}
                cartHref={localePath(locale, "/cart")}
                labels={{
                  add: t("shop.addToCart"),
                  unavailable: t("shop.unavailable"),
                  added: t("shop.addedToCart", { title: "{title}" }),
                  viewCart: t("shop.viewCart"),
                  noCombination: t("product.noCombination"),
                }}
              />
              {/* Said beside the button, so nobody reaches it wondering where
                  the card form is: nothing is paid online. */}
              <p className="mt-1 text-[12.5px] leading-relaxed text-body/75">{t("checkout.paymentNote")}</p>
            </div>
          </div>
        }
      />

      <Section labelledBy="product-about">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <SectionHead id="product-about" title={t("product.aboutTitle")} />
            <p className="mt-6 max-w-[66ch] text-[1.05rem] leading-[1.9] text-body">{product.description}</p>

            {product.tags.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-primary-05 px-3 py-1.5 text-[13px] font-medium text-primary-dark">
                    <span dir="auto">{tag}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Which sizes exist and which are gone — the one thing a paragraph
                cannot say. */}
            <h2 id="product-variants" className="mt-16 text-[1.75rem] leading-tight sm:text-[2rem]">
              {t("product.variantsTitle")}
            </h2>
            <ul
              aria-labelledby="product-variants"
              className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
            >
              {variants.map((variant) => (
                <li key={variant.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-6">
                  <span className="font-heading text-[15px] font-semibold text-ink" dir="auto">
                    {variant.title}
                  </span>
                  <span className="flex items-center gap-5">
                    <span className="stock-signal" data-stock={variant.stock}>
                      {variant.stockLabel}
                    </span>
                    <span className="min-w-24 text-end text-[15px] font-semibold text-ink tabular-nums" dir="ltr">
                      {variant.price}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside aria-labelledby="product-facts" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <h3 id="product-facts" className="mb-2 px-1 font-sans text-[13px] font-semibold text-ink">
                {t("product.factsTitle")}
              </h3>
              <dl className="divide-y divide-line">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3 px-1 py-3.5">
                    <dt className="flex w-28 shrink-0 items-center gap-2 text-[13px] text-body">
                      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
                        {fact.icon}
                      </span>
                      {fact.label}
                    </dt>
                    <dd className="min-w-0 pt-1 text-[14px] font-semibold text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="muted" labelledBy="product-reviews">
        <SectionHead id="product-reviews" title={t("reviews.title", { label: t("reviews.labelProduct") })} />
        {product.rating.count === 0 ? (
          <p className="mt-8 max-w-[48ch] text-[15px] text-body">{t("reviews.none")}</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            {/* The score and the writing are two different things: a product
                can carry many ratings and no written review. */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-deep p-7 text-white">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
              <p className="font-heading text-[3rem] leading-none font-bold text-white" dir="ltr">
                {product.rating.average.toFixed(1)}
              </p>
              <p className="mt-3 flex gap-0.5 text-accent" aria-label={ratingLabel}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} aria-hidden="true" className={index < Math.round(product.rating.average) ? "" : "text-white/20"}>
                    <StarIcon size={16} />
                  </span>
                ))}
              </p>
              <p className="mt-6">
                <span className="block font-heading text-[1.4rem] leading-none font-bold" dir="ltr">
                  {number(product.rating.count)}
                </span>
                <span className="mt-1.5 block text-[12.5px] text-white/60">{t("product.ratingsLabel")}</span>
              </p>
            </div>

            {reviews.items.length === 0 ? (
              <div className="flex items-center rounded-3xl border border-line bg-surface px-6 py-10">
                <p className="max-w-[46ch] text-[15px] leading-relaxed text-body">{t("product.reviewsNoneWritten")}</p>
              </div>
            ) : (
              <Reveal stagger as="ul" className="grid gap-4 sm:grid-cols-2">
                {reviews.items.map((review) => (
                  <li key={review.id} className="flex">
                    <article className="flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                      <p className="text-accent" aria-label={t("reviews.outOf", { rating: number(review.rating) })}>
                        <span className="flex gap-0.5" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map((index) => (
                            <span key={index} className={index < review.rating ? "" : "text-ink/15"}>
                              <StarIcon size={14} />
                            </span>
                          ))}
                        </span>
                      </p>
                      {/* Customer-written, so rendered exactly as submitted with
                          the direction detected rather than assumed. */}
                      {review.title ? (
                        <h3 className="mt-4 text-[16px]" dir="auto">
                          {review.title}
                        </h3>
                      ) : null}
                      <p className="mt-2 text-[14px] leading-relaxed text-body" dir="auto">
                        {review.body}
                      </p>
                      <p className="mt-auto pt-5 text-[13px] font-semibold text-ink" dir="auto">
                        {review.author.displayName}
                      </p>
                    </article>
                  </li>
                ))}
              </Reveal>
            )}
          </div>
        )}
      </Section>

      <Section labelledBy={related.length > 0 ? "product-related" : undefined} className="pb-6 sm:pb-8 lg:pb-10">
        {related.length > 0 ? (
          <>
            <SectionHead
              id="product-related"
              title={t("shop.related")}
              actions={
                <Link href={localePath(locale, "/shop")} className={buttonClasses({ variant: "outline" })}>
                  {t("nav.shopAll")}
                </Link>
              }
            />
            <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <li key={entry.id} className="flex">
                  <ProductCard product={entry} locale={locale} t={t} />
                </li>
              ))}
            </Reveal>
          </>
        ) : null}

        <QuoteNote
          title={t("shop.ctaTitle")}
          body={t("shop.ctaBody")}
          action={t("shop.ctaAction")}
          href={localePath(locale, "/contact")}
          headingLevel={related.length > 0 ? "h3" : "h2"}
        />
      </Section>

      <HelpBand locale={locale} topic="shop" />
    </>
  );
}
