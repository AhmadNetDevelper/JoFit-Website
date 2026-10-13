import { rentalService } from "@/features/rental";
import { resolveText } from "@/i18n";
import { AppError } from "@/lib";
import {
  accountStore,
  nextReference,
  notifyOrderPlaced,
  type RawOrderLine,
  type RawRentalBooking,
} from "@/mocks/accounts";
import { mockRentalItems } from "@/mocks/rental";
import { simulateLatency } from "@/mocks/runtime";
import { localizeLabel, mockProducts } from "@/mocks/shop";
import type { Money } from "@/types";

import type { CheckoutService } from "./checkout.contract";

const TAX_RATE = 0.16;
const DELIVERY: Money = { amount: 3_000, currency: "JOD" };
const jod = (amount: number): Money => ({ amount, currency: "JOD" });

function reject(message: string): never {
  throw new AppError("conflict", message, { status: 409 });
}

export const mockCheckoutService: CheckoutService = {
  async placeOrder(customerId, input, locale) {
    await simulateLatency();
    const store = accountStore();
    const customer = store.customers.find((entry) => entry.id === customerId);
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    if (input.lines.length === 0) reject("Your basket is empty.");

    const hasShop = input.lines.some((line) => line.kind === "shop");
    const address =
      input.fulfilment === "delivery"
        ? (store.addresses.get(customerId) ?? []).find((entry) => entry.id === input.addressId)
        : undefined;
    if (hasShop && input.fulfilment === "delivery" && !address) {
      const message = "Choose where to deliver it.";
      throw new AppError("validation", message, { status: 422, details: { fieldErrors: { addressId: message } } });
    }

    const reference = nextReference("JF-2");
    const orderId = `order-${reference.toLowerCase()}`;
    const lines: RawOrderLine[] = [];
    const hires: RawRentalBooking[] = [];
    let deposits = 0;

    for (const [index, line] of input.lines.entries()) {
      if (line.kind === "shop") {
        const product = mockProducts.find((entry) => entry.id === line.productId);
        const variant = product?.variants.find((entry) => entry.id === line.variantId);
        if (!product || !variant) reject("Something in your basket is no longer sold.");
        if (variant.stockStatus === "out-of-stock") {
          reject(`${resolveText(product.title, locale)} (${localizeLabel(variant.title, locale)}) has just sold out.`);
        }
        const quantity = Math.max(1, Math.min(10, Math.floor(line.quantity)));
        lines.push({
          id: `${orderId}-l${index + 1}`,
          kind: "shop",
          title: resolveText(product.title, customer.locale),
          description: product.variants.length > 1 ? localizeLabel(variant.title, customer.locale) : undefined,
          quantity,
          unitPrice: variant.price.current,
          total: jod(variant.price.current.amount * quantity),
          productId: product.id,
          variantId: variant.id,
        });
        continue;
      }

      const item = mockRentalItems.find((entry) => entry.id === line.itemId);
      if (!item) reject("A hire in your basket is no longer offered.");
      // Priced by the rental service, exactly as the item page quoted it.
      const quote = await rentalService.quote(item.id, line.period);
      if (!quote.isAvailable) reject(`${resolveText(item.title, locale)} is no longer free for those dates.`);

      const units = line.period.quantity;
      const bookingId = `rb-${orderId}-${index + 1}`;
      const deposit = item.deposit ? jod(item.deposit.amount * units) : undefined;
      deposits += deposit?.amount ?? 0;
      lines.push({
        id: `${orderId}-r${index + 1}`,
        kind: "rental",
        title: resolveText(item.title, customer.locale),
        quantity: units,
        unitPrice: jod(Math.round(quote.subtotal.amount / units)),
        total: quote.subtotal,
        rentalPeriod: line.period.range,
        rentalItemId: item.id,
      });
      hires.push({
        id: bookingId,
        reference: `RB-${reference.slice(3)}${index > 0 ? `-${index + 1}` : ""}`,
        itemId: item.id,
        itemTitle: item.title,
        customerId,
        period: line.period.range,
        unit: line.period.unit,
        quantity: units,
        status: "pending",
        total: quote.subtotal,
        deposit,
        orderId,
        createdAt: new Date().toISOString(),
      });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.total.amount, 0);
    const shipping = hasShop && input.fulfilment === "delivery" ? DELIVERY.amount : 0;
    const tax = Math.round(subtotal * TAX_RATE);

    store.orders.push({
      id: orderId,
      reference,
      // Nothing has been paid: payment is an open decision, so the order waits.
      status: "pending",
      placedAt: new Date().toISOString(),
      customerId,
      lines,
      itemsSubtotal: jod(subtotal),
      depositsTotal: jod(deposits),
      shippingTotal: jod(shipping),
      taxTotal: jod(tax),
      grandTotal: jod(subtotal + deposits + shipping + tax),
      shippingAddress: address,
    });
    store.rentalBookings.push(...hires);
    notifyOrderPlaced({ id: orderId, reference, customerId }, customer.name);

    return { id: orderId, reference };
  },
};
