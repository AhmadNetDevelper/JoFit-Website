import type { RentalPeriod, RentalQuote } from "@/features/rental";
import type { CurrencyCode, MediaImage, Money } from "@/types";

/**
 * CART ARCHITECTURE DECISION
 *
 * Shop and rental do NOT get separate carts, and they are NOT forced into one
 * shape either. There is one cart container holding a discriminated union of
 * line kinds.
 *
 * Why one container:
 *   - a customer buying grip tape and hiring a bike expects one basket and one
 *     payment, not two parallel checkouts;
 *   - totals, persistence, line identity and the checkout entry point are
 *     genuinely the same problem for both.
 *
 * Why a union rather than a shared "product-ish" line:
 *   - a shop line is (variant × quantity); a rental line is (item × period ×
 *     units) and carries a server-issued quote and a refundable deposit;
 *   - quantity means different things, and only rental lines can become
 *     unavailable because *time* passed.
 *
 * Adding a third kind later (a course seat, a coach session) means adding a
 * member to `CartLine` and a branch to `line-handlers.ts`; the compiler then
 * points at every place that must handle it.
 */
interface CartLineCommon {
  /** Deterministic, derived from the line's identity — see `lineKey`. */
  readonly lineId: string;
  readonly addedAt: string;
  readonly title: string;
  readonly image?: MediaImage;
}

export interface ShopCartLine extends CartLineCommon {
  readonly kind: "shop";
  readonly productId: string;
  readonly productSlug: string;
  readonly variantId: string;
  readonly variantTitle: string;
  readonly unitPrice: Money;
  readonly quantity: number;
}

export interface RentalCartLine extends CartLineCommon {
  readonly kind: "rental";
  readonly itemId: string;
  readonly itemSlug: string;
  /** The booking intent; `period.quantity` is the number of physical units. */
  readonly period: RentalPeriod;
  /** Issued by the rental service. The cart never recomputes rental pricing. */
  readonly quote: RentalQuote;
}

export type CartLine = ShopCartLine | RentalCartLine;
export type CartLineKind = CartLine["kind"];

export interface Cart {
  readonly lines: readonly CartLine[];
  readonly currency: CurrencyCode;
  readonly updatedAt: string;
}

export interface CartTotals {
  readonly currency: CurrencyCode;
  readonly lineCount: number;
  readonly itemCount: number;
  readonly itemsSubtotal: Money;
  /** Refundable, tracked separately because it is not revenue. */
  readonly depositsTotal: Money;
  /**
   * Subtotal plus deposits. Tax, shipping and fees are NOT included: they are an
   * OPEN BUSINESS DECISION and will be calculated server-side at checkout.
   */
  readonly payableTotal: Money;
}

/**
 * Lines grouped by how they are fulfilled. Whether the two groups may be paid in
 * one transaction is an OPEN BUSINESS DECISION; the grouping exists so either
 * answer is implementable without reshaping the cart.
 */
export interface CartFulfilmentGroup {
  readonly kind: CartLineKind;
  readonly lines: readonly CartLine[];
  readonly subtotal: Money;
  readonly depositsTotal: Money;
}

export interface AddShopLineInput {
  readonly productId: string;
  readonly productSlug: string;
  readonly title: string;
  readonly variantId: string;
  readonly variantTitle: string;
  readonly unitPrice: Money;
  readonly quantity?: number;
  readonly image?: MediaImage;
}

export interface AddRentalLineInput {
  readonly itemId: string;
  readonly itemSlug: string;
  readonly title: string;
  readonly period: RentalPeriod;
  readonly quote: RentalQuote;
  readonly image?: MediaImage;
}
