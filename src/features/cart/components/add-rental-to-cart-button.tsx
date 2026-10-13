"use client";

import { useState } from "react";

import { buttonClasses } from "@/components/ui";
import type { RentalPeriod, RentalQuote } from "@/features/rental";
import type { MediaImage } from "@/types";

import { useCart } from "../hooks/use-cart";

/**
 * Adding to the cart is a cart operation, so the affordance lives in the cart
 * feature and the rental page composes it. That keeps the dependency one-way
 * (cart → rental) instead of the two features importing each other.
 *
 * It takes the server-issued quote as a prop and never prices anything itself.
 */
export function AddRentalToCartButton({
  itemId,
  itemSlug,
  title,
  period,
  quote,
  image,
  labels,
}: {
  itemId: string;
  itemSlug: string;
  title: string;
  period: RentalPeriod;
  quote: RentalQuote;
  image?: MediaImage;
  /** Copy arrives translated from the Server Component that renders this. */
  labels: { add: string; unavailable: string; added: string };
}) {
  const { addRentalLine } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={!quote.isAvailable}
        onClick={() => {
          addRentalLine({ itemId, itemSlug, title, period, quote, image });
          setAdded(true);
        }}
        /* The kit's pill, the same as its shop twin; `buttonClasses` brings
           the disabled treatment with it. */
        className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
      >
        {quote.isAvailable ? labels.add : labels.unavailable}
      </button>

      {/* The region is always in the DOM so a screen reader is already
          watching it; announcing into a node that appears at the same moment
          is unreliable across readers. */}
      <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-[14px] text-primary-dark">
        {added ? labels.added.replace("{title}", title) : ""}
      </p>
    </div>
  );
}
