import { httpClient } from "@/services";
import type { Money } from "@/types";

import type { CheckoutLineInput, PlaceOrderInput, PlacedOrder } from "../types";
import type { CheckoutService } from "./checkout.contract";

/**
 * Live `OrderLineRequest` (`POST /api/v1/me/orders`'s body) is FLAT — one
 * object per line, ids as `int64` — unlike the contract's `CheckoutLineInput`,
 * which nests a rental's period and keys a shop line's ids by name. The
 * contract's string ids are converted to JSON numbers here: a quoted id is not
 * guaranteed to bind to a `long` under System.Text.Json.
 */
interface LiveOrderLineRequest {
  readonly kind: "product" | "rental";
  readonly productId?: number;
  readonly variantId?: number;
  readonly rentalItemId?: number;
  readonly unit?: string;
  readonly from?: string;
  readonly to?: string;
  readonly quantity: number;
}

interface LivePlaceOrderRequest {
  readonly lines: readonly LiveOrderLineRequest[];
  readonly fulfilment: string;
  readonly addressId?: number;
  readonly notes?: string;
}

/**
 * `PlacedOrderDto` — `id`/`reference` are what the contract's `PlacedOrder`
 * requires; `status`/`totals`/`placedAt` are live-only extras kept as
 * optional passthrough (see `PlacedOrder` in `../types`).
 */
interface LivePlacedOrderDto {
  readonly id: number;
  readonly reference: string;
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

function toLiveOrderLine(line: CheckoutLineInput): LiveOrderLineRequest {
  if (line.kind === "shop") {
    return {
      kind: "product",
      productId: Number(line.productId),
      variantId: Number(line.variantId),
      quantity: line.quantity,
    };
  }
  return {
    kind: "rental",
    rentalItemId: Number(line.itemId),
    unit: line.period.unit,
    from: line.period.range.from,
    to: line.period.range.to,
    quantity: line.period.quantity,
  };
}

function toLiveRequest(input: PlaceOrderInput): LivePlaceOrderRequest {
  return {
    lines: input.lines.map(toLiveOrderLine),
    fulfilment: input.fulfilment,
    addressId: input.addressId ? Number(input.addressId) : undefined,
    notes: input.notes,
  };
}

function toPlacedOrder(dto: LivePlacedOrderDto): PlacedOrder {
  return {
    id: String(dto.id),
    reference: dto.reference,
    status: dto.status,
    totals: dto.totals,
    placedAt: dto.placedAt,
  };
}

/**
 * `POST /api/v1/me/orders` — the cart's lines as ids; the API re-prices, taxes
 * and files them, and answers the new order's id and reference. The customer
 * comes from the token. The endpoint takes no query parameters at all (no
 * `language`/`locale` of any kind) — `locale` is accepted here only to match
 * the shared `CheckoutService` contract signature and isn't sent.
 */
export const httpCheckoutService: CheckoutService = {
  placeOrder: async (_customerId, input, _locale) => {
    const dto = await httpClient.post<LivePlacedOrderDto>("/v1/me/orders", toLiveRequest(input), { auth: true });
    return toPlacedOrder(dto);
  },
};
