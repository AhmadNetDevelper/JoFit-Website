"use client";

import { useState } from "react";

import { AddProductToCartButton } from "@/features/cart";
import type { MediaImage, Money } from "@/types";

/**
 * PICKING A VARIANT, THEN BUYING IT.
 *
 * The page could not do this once: it read `defaultVariantId`, showed that one
 * price, and put a single add-to-cart button under it. On a shoe with four
 * sizes that meant the size was chosen for you, and the one size that was out
 * of stock was unreachable and invisible.
 *
 * ---------------------------------------------------------------------------
 * EVERYTHING IT NEEDS IS ALREADY A STRING.
 *
 * This is the only Client Component on the route, so the boundary is drawn as
 * tightly as it can be: no translator, no formatter, no `Money` formatting — a
 * function cannot cross to a client at all, and `Intl` on the client would ship
 * a second copy of the locale data the server already used. Prices arrive
 * pre-formatted; `unitPrice` stays a plain `Money` object because the cart
 * stores it rather than displaying it.
 *
 * ---------------------------------------------------------------------------
 * SELECTION IS A MAP, NOT AN INDEX.
 *
 * A variant is identified by its full set of choices, so a product that varies
 * on two axes works without a special case. Matching is done against
 * `option.key` — the untranslated identifier — because `option.name` is
 * translated and `selections` is not; keying off the display name resolved to
 * nothing on the Arabic site.
 *
 * A combination with no variant behind it is possible in principle, so the
 * no-match branch is a real state rather than a crash: the button goes and a
 * sentence says why.
 *
 * It sits inside the white buy card in the hero's end column, so its controls
 * are the formal kit's: pill choices (the current one filled green), the price
 * in the heading face, the availability signal, one full-width pill to add.
 */
export interface BuyBoxOption {
  readonly key: string;
  readonly name: string;
  readonly values: readonly string[];
  readonly valueLabels?: Readonly<Record<string, string>>;
}

export interface BuyBoxVariant {
  readonly id: string;
  readonly title: string;
  readonly selections: Readonly<Record<string, string>>;
  /** Pre-formatted on the server. */
  readonly price: string;
  readonly compareAt?: string;
  readonly unitPrice: Money;
  readonly stock: "in-stock" | "low-stock" | "out-of-stock" | "pre-order";
  readonly stockLabel: string;
}

export function BuyBox({
  productId,
  productSlug,
  title,
  image,
  options,
  variants,
  cartHref,
  labels,
}: {
  productId: string;
  productSlug: string;
  title: string;
  /**
   * The product's first photograph, carried into the cart line — `AddShopLineInput`
   * has an `image` field, and without this every shop line had no picture.
   */
  image?: MediaImage;
  options: readonly BuyBoxOption[];
  variants: readonly BuyBoxVariant[];
  /** The localized cart path, for the "view cart" link after adding. */
  cartHref: string;
  labels: {
    add: string;
    unavailable: string;
    added: string;
    viewCart: string;
    /** Announced when a chosen combination has no variant behind it. */
    noCombination: string;
  };
}) {
  const initial = variants.find((variant) => variant.stock !== "out-of-stock") ?? variants[0];
  const [selections, setSelections] = useState<Record<string, string>>(() => ({ ...initial.selections }));

  const selected =
    variants.find((variant) => options.every((option) => variant.selections[option.key] === selections[option.key])) ??
    (options.length === 0 ? variants[0] : undefined);

  return (
    <div>
      {selected ? (
        /* The price first: it is what a shopper reads before anything else,
           and it changes as the choices below it do. */
        <div className="mb-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-heading text-[2rem] leading-none font-bold text-ink" dir="ltr">
              {selected.price}
            </p>
            {selected.compareAt ? (
              <p className="text-[15px] text-body/55 line-through" dir="ltr">
                {selected.compareAt}
              </p>
            ) : null}
          </div>
          <p className="stock-signal mt-3" data-stock={selected.stock}>
            {selected.stockLabel}
          </p>
        </div>
      ) : null}

      {options.map((option) => {
        const current = selections[option.key];
        return (
          <fieldset key={option.key} className="mb-6">
            <legend className="mb-3 flex items-baseline gap-2 text-[13px] font-semibold text-ink">
              {option.name}
              {current ? (
                <span className="font-medium text-body/70" dir="auto">
                  {option.valueLabels?.[current] ?? current}
                </span>
              ) : null}
            </legend>

            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const active = current === value;

                /* Whether this value can be had AT ALL. A value that is sold out
                   in every combination is shown struck through rather than
                   hidden: a shopper looking for a 43 should learn that it exists
                   and is gone, not be left wondering whether the shop stocks it. */
                const reachable = variants.some(
                  (variant) => variant.selections[option.key] === value && variant.stock !== "out-of-stock",
                );

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelections((state) => ({ ...state, [option.key]: value }))}
                    className={[
                      "inline-flex h-11 min-w-[3.25rem] cursor-pointer items-center justify-center rounded-full border px-4 text-[14px] font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-line bg-surface text-ink hover:border-primary/50 hover:text-primary-dark",
                      reachable ? "" : "line-through opacity-45",
                    ].join(" ")}
                  >
                    <span dir="auto">{option.valueLabels?.[value] ?? value}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {selected ? (
        <AddProductToCartButton
          productId={productId}
          productSlug={productSlug}
          title={title}
          variantId={selected.id}
          variantTitle={selected.title}
          unitPrice={selected.unitPrice}
          image={image}
          disabled={selected.stock === "out-of-stock"}
          cartHref={cartHref}
          block
          labels={labels}
        />
      ) : (
        <p className="rounded-2xl border border-line bg-canvas px-5 py-4 text-[14px] leading-relaxed text-body">
          {labels.noCombination}
        </p>
      )}
    </div>
  );
}
