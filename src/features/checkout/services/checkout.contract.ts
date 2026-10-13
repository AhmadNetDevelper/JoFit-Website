import type { Locale } from "@/i18n";

import type { PlaceOrderInput, PlacedOrder } from "../types";

/**
 * Turning a cart into an order.
 *
 * THE BROWSER SENDS IDS, NEVER PRICES. The cart lives in the visitor's browser
 * and anything in it can be edited, so every line is re-priced here from the
 * catalogue — a shop line at the variant's current price, a hire from the
 * rental service's own quote — and a line that can no longer be sold rejects
 * the whole order rather than being silently dropped from it.
 *
 * OPEN BUSINESS DECISIONS: payment (the order lands `pending` and nothing is
 * charged), whether purchases and hires settle in one payment, the real tax and
 * delivery rules (16% and a flat 3 JOD here, the same rule the admin fixtures
 * use), and guest checkout.
 */
export interface CheckoutService {
  placeOrder(customerId: string, input: PlaceOrderInput, locale: Locale): Promise<PlacedOrder>;
}
