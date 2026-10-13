import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import type { Brand, Product, StockStatus } from "@/features/shop";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { StarIcon } from "./icons";
import { ProductMedia } from "./product-media";

/**
 * THE PRODUCT CARD — the formal redesign.
 *
 * The course card's sibling, so a shelf and a catalogue on the same site look
 * drawn by the same hand: a white card with a hairline, 24px corners and a soft
 * shadow, the product plate framed inside it (`ProductMedia`), then what a
 * shopper scans for, in that order — the name, one line of summary, what other
 * people thought, and the footer with the PRICE and whether it can be had.
 *
 * Prices ARE shown here. Unlike course fees (placeholders, given on enquiry),
 * the shop's prices are the catalogue's real figures.
 *
 *   - A STOCK LINE. The catalogue models availability as a coarse signal, not
 *     a count. Sold out mutes the plate.
 *   - A SAVING, on a product that is actually discounted — the percentage off
 *     the default variant, not a bare "sale", which is a colour, not a fact.
 *   - A "FROM" PRICE when the variants differ. Quoting the cheapest variant as
 *     if it were the price is how a catalogue lies to itself.
 *
 * There is no add-to-cart button here. A product with four sizes cannot be
 * added from a grid without picking one, and a button that silently adds a
 * default is worse than a link to the page where the choice is made.
 *
 * One link covers the whole card (the title's `::after`), so the card is one
 * target without nesting interactive elements. Every variable row reserves its
 * height, so the footers of a row line up (pitfalls #3).
 */

/** Which stock signals should mute the plate. */
const MUTED: Readonly<Record<StockStatus, boolean>> = {
  "in-stock": false,
  "low-stock": false,
  "out-of-stock": true,
  "pre-order": false,
};

const STOCK_LABEL = {
  "in-stock": "shop.stockIn",
  "low-stock": "shop.stockLow",
  "out-of-stock": "shop.stockOut",
  "pre-order": "shop.stockPreOrder",
} as const;

/**
 * The product's single availability signal, reduced from its variants.
 *
 * A product is only sold out when EVERY variant is; one size gone is a variant
 * problem, not a product one. Beyond that the best signal wins, because that is
 * the one the shopper can act on today.
 */
function stockOf(product: Product): StockStatus {
  const statuses = product.variants.map((variant) => variant.stockStatus);
  if (statuses.includes("in-stock")) return "in-stock";
  if (statuses.includes("low-stock")) return "low-stock";
  if (statuses.includes("pre-order")) return "pre-order";
  return "out-of-stock";
}

export function ProductCard({
  product,
  brand,
  locale,
  t,
  priority = false,
}: {
  product: Product;
  /** Omit where every card is the same brand (the brand pages). */
  brand?: Brand;
  locale: Locale;
  t: Translate;
  /** Set on the first row, which is above the fold on every breakpoint. */
  priority?: boolean;
}) {
  const { money, number } = getFormatters(locale);
  const href = localePath(locale, `/shop/products/${product.slug}`);

  const stock = stockOf(product);
  const ranged = product.priceRange.min.amount !== product.priceRange.max.amount;

  /* The discount is read off the default variant rather than computed across
     the range: a saving quoted against a price nobody is charged is a number
     with no referent. */
  const headline =
    product.variants.find((variant) => variant.id === product.defaultVariantId) ?? product.variants[0];
  const compareAt = headline?.price.compareAt;
  const saving =
    compareAt && compareAt.amount > headline.price.current.amount
      ? Math.round(((compareAt.amount - headline.price.current.amount) / compareAt.amount) * 100)
      : 0;

  return (
    <article className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      {/* `shrink-0` — the card is a flex column with a definite height, and a
          flex item shrinks by default, so a two-line title would otherwise be
          paid for out of the plate's height. The chips are siblings of the
          clipped box, not inside it (pitfalls #4). */}
      <div className="relative shrink-0">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${MUTED[stock] ? "opacity-60 saturate-50" : ""}`}>
          <ProductMedia product={product} priority={priority} />
        </div>

        {saving > 0 ? (
          /* No `dir` on the whole chip: it is an Arabic phrase with a number in
             it, and an LTR run would put the percent sign before the word. */
          <p className="absolute top-3 start-3 rounded-full bg-accent px-2.5 py-1 text-[12px] leading-none font-bold text-deep shadow-soft">
            {t("shop.saving", { percent: number(saving) })}
          </p>
        ) : null}

        {brand ? (
          <p className="absolute top-3 end-3 rounded-full bg-surface/90 px-2.5 py-1 text-[12px] leading-none font-semibold text-ink shadow-soft backdrop-blur-sm">
            {/* A brand is a proper noun and is never translated. */}
            <span dir="ltr">{brand.name}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        {/* Two lines reserved, so the blocks below line up across a row. */}
        <h3 className="line-clamp-2 min-h-[3.1rem] text-[1.1rem] leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
            {product.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{product.summary}</p>

        <div className="mt-3 flex min-h-6 items-center gap-2 text-[13px]">
          {product.rating.count > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 text-body"
              aria-label={`${t("shop.ratingValue", { rating: number(product.rating.average) })}, ${t("shop.reviewsCount", { count: number(product.rating.count) })}`}
            >
              <span className="text-accent">
                <StarIcon size={14} />
              </span>
              <span className="font-semibold text-ink" dir="ltr">
                {product.rating.average.toFixed(1)}
              </span>
              <span className="text-body/60" dir="ltr">
                {`(${number(product.rating.count)})`}
              </span>
            </span>
          ) : (
            <span className="text-[12.5px] text-body/60">{t("shop.noReviews")}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            {/*
              ONE LINE, ALWAYS — the struck price sits BESIDE what is charged,
              not above it, so a discounted card is not a line taller than its
              neighbours and the footers of a row stay level.
            */}
            <p className="flex flex-wrap items-baseline gap-x-2 leading-none">
              {ranged ? <span className="text-[12px] font-medium text-body/70">{t("shop.priceFrom")}</span> : null}
              <span className="font-heading text-[1.15rem] font-bold text-ink" dir="ltr">
                {money(product.priceRange.min)}
              </span>
              {saving > 0 && compareAt ? (
                <span className="text-[12.5px] text-body/55 line-through" dir="ltr">
                  {money(compareAt)}
                </span>
              ) : null}
            </p>
            <p className="stock-signal" data-stock={stock}>
              {t(STOCK_LABEL[stock])}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
          >
            <ArrowIcon />
          </span>
        </div>
      </div>
    </article>
  );
}
