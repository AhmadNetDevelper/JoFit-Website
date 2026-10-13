import type { CartFulfilmentGroup } from "@/features/cart";
import type { RentalPeriod } from "@/features/rental";
import type { Address, Money } from "@/types";

/**
 * FEATURE BOUNDARY ONLY — no checkout flow is implemented.
 *
 * It cannot be: checkout needs an authenticated customer, a payment provider and
 * server-side price validation, none of which exist. What is defined here is the
 * vocabulary those pieces will speak, so the flow can be built without
 * reshaping the cart or the order history the account area reads.
 *
 * OPEN BUSINESS DECISIONS: whether purchases and hires settle in one payment or
 * two; when a rental deposit is captured and released; tax and shipping
 * calculation; cancellation and refunds; guest checkout.
 */
/**
 * What the checkout form posts: the cart's lines as IDS, and how the order
 * reaches the customer. No price travels from the browser — see
 * `CheckoutService`.
 */
export type CheckoutLineInput =
  | {
      readonly kind: "shop";
      readonly productId: string;
      readonly variantId: string;
      readonly quantity: number;
    }
  | { readonly kind: "rental"; readonly itemId: string; readonly period: RentalPeriod };

export interface PlaceOrderInput {
  readonly lines: readonly CheckoutLineInput[];
  readonly fulfilment: FulfilmentMethod;
  /** One of the customer's saved addresses; required for delivery. */
  readonly addressId?: string;
  readonly notes?: string;
}

export interface PlacedOrder {
  readonly id: string;
  readonly reference: string;
  /**
   * Live-only extras (`PlacedOrderDto` carries `status`/`totals`/`placedAt`
   * alongside `id`/`reference`; the mock data source doesn't bother filling
   * them in since nothing currently reads them past this screen). Optional
   * here so both data sources satisfy the same type; a confirmation screen
   * can use them if it wants to show totals without a follow-up fetch.
   * `status` is left as a plain string — the live API doesn't publish a fixed
   * enum for it, unlike the richer `OrderStatus` the account/order-history
   * area tracks.
   */
  readonly status?: string;
  readonly totals?: {
    readonly itemsSubtotal: Money;
    readonly shipping: Money;
    readonly tax: Money;
    readonly depositsTotal: Money;
    readonly grandTotal: Money;
  };
  readonly placedAt?: string;
}

export type CheckoutStep = "contact" | "fulfilment" | "payment" | "review";

export const CHECKOUT_STEPS: readonly CheckoutStep[] = ["contact", "fulfilment", "payment", "review"];

export interface CheckoutContact {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}

/** How one fulfilment group reaches the customer. */
export type FulfilmentMethod = "delivery" | "pickup";

export interface CheckoutFulfilmentChoice {
  readonly groupKind: CartFulfilmentGroup["kind"];
  readonly method: FulfilmentMethod;
  readonly address?: Address;
}

/** Client-side draft only. The server issues the authoritative totals. */
export interface CheckoutDraft {
  readonly contact?: CheckoutContact;
  readonly fulfilment: readonly CheckoutFulfilmentChoice[];
  readonly billingAddress?: Address;
  readonly notes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderLine {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
  /** Present only on lines that came from a rental cart line. */
  readonly rentalPeriod?: RentalPeriod;
}

export interface Order {
  readonly id: string;
  readonly reference: string;
  readonly status: OrderStatus;
  readonly placedAt: string;
  readonly lines: readonly OrderLine[];
  readonly itemsSubtotal: Money;
  readonly depositsTotal: Money;
  readonly shippingTotal: Money;
  readonly taxTotal: Money;
  readonly grandTotal: Money;
  readonly shippingAddress?: Address;
}
