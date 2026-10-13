"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonClasses } from "@/components/ui";

import { useCart } from "../hooks/use-cart";
import type { MediaImage, Money } from "@/types";

export interface AddProductToCartButtonProps {
  readonly productId: string;
  readonly productSlug: string;
  readonly title: string;
  readonly variantId: string;
  readonly variantTitle: string;
  readonly unitPrice: Money;
  readonly image?: MediaImage;
  readonly disabled?: boolean;
  /** The localized cart path. With `labels.viewCart`, a link to it appears once a line is added. */
  readonly cartHref?: string;
  /** Stretch the button to its container — inside a buy card. */
  readonly block?: boolean;
  /** Copy arrives translated from the Server Component that renders this. */
  readonly labels: {
    readonly add: string;
    readonly unavailable: string;
    /** Contains a literal `{title}` placeholder. */
    readonly added: string;
    readonly viewCart?: string;
  };
}

/**
 * The client boundary for the shop is this small: the product page stays a
 * Server Component and hands already-resolved values to a leaf that needs
 * interactivity. It lives in the cart feature because adding a line is the
 * cart's business, and it takes only primitives — the cart never imports shop.
 *
 * The button is the kit's pill (`buttonClasses`). Once a line is in, the
 * confirmation says so and — when the page passed a cart path — offers the
 * way there, so the next step after "added" is one tap rather than a hunt for
 * the header's cart count.
 */
export function AddProductToCartButton(props: AddProductToCartButtonProps) {
  const { addShopLine } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => {
          addShopLine({
            productId: props.productId,
            productSlug: props.productSlug,
            title: props.title,
            variantId: props.variantId,
            variantTitle: props.variantTitle,
            unitPrice: props.unitPrice,
            image: props.image,
            quantity: 1,
          });
          setAdded(true);
        }}
        className={buttonClasses({ size: "lg", className: props.block ? "w-full" : "w-full sm:w-auto" })}
      >
        <CartIcon />
        {props.disabled ? props.labels.unavailable : props.labels.add}
      </button>

      {/* The region is always in the DOM so a screen reader is already
          watching it; announcing into a node that appears at the same moment
          is unreliable across readers. */}
      <div role="status" aria-live="polite" className="mt-3 min-h-6 text-[14px]">
        {added ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-primary-dark">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-primary text-on-primary">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="m3.4 8.4 3 3 6.2-6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {props.labels.added.replace("{title}", props.title)}
            </span>
            {props.cartHref && props.labels.viewCart ? (
              <Link href={props.cartHref} className="font-semibold underline underline-offset-4 hover:text-primary">
                {props.labels.viewCart}
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19.5" r="1.3" fill="currentColor" />
    </svg>
  );
}
