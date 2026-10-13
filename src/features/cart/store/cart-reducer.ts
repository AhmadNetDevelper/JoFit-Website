import { lineKey, withQuantity } from "../line-handlers";
import type { AddRentalLineInput, AddShopLineInput, Cart, CartLine } from "../types";

export type CartAction =
  | { type: "hydrate"; cart: Cart }
  | { type: "add-shop-line"; input: AddShopLineInput; now: string }
  | { type: "add-rental-line"; input: AddRentalLineInput; now: string }
  | { type: "set-quantity"; lineId: string; quantity: number }
  | { type: "remove-line"; lineId: string }
  | { type: "clear" };

function upsert(cart: Cart, line: CartLine, now: string): Cart {
  const existing = cart.lines.find((entry) => entry.lineId === line.lineId);

  if (!existing) {
    return { ...cart, lines: [...cart.lines, line], updatedAt: now };
  }

  // A repeat add of an identical shop variant increases quantity; an identical
  // rental period replaces the line, because its quote may have changed.
  const merged: CartLine =
    existing.kind === "shop" && line.kind === "shop"
      ? { ...existing, quantity: existing.quantity + line.quantity }
      : line;

  return {
    ...cart,
    lines: cart.lines.map((entry) => (entry.lineId === merged.lineId ? merged : entry)),
    updatedAt: now,
  };
}

/**
 * Pure and framework-free: it takes a cart and returns a cart. That is what lets
 * the persistence layer, the provider and any future server-side cart share the
 * same rules.
 */
export function cartReducer(cart: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "hydrate":
      return action.cart;

    case "add-shop-line": {
      const { input, now } = action;
      const draft: CartLine = {
        kind: "shop",
        lineId: "",
        addedAt: now,
        title: input.title,
        image: input.image,
        productId: input.productId,
        productSlug: input.productSlug,
        variantId: input.variantId,
        variantTitle: input.variantTitle,
        unitPrice: input.unitPrice,
        quantity: Math.max(1, Math.trunc(input.quantity ?? 1)),
      };
      return upsert(cart, { ...draft, lineId: lineKey(draft) }, now);
    }

    case "add-rental-line": {
      const { input, now } = action;
      const draft: CartLine = {
        kind: "rental",
        lineId: "",
        addedAt: now,
        title: input.title,
        image: input.image,
        itemId: input.itemId,
        itemSlug: input.itemSlug,
        period: input.period,
        quote: input.quote,
      };
      return upsert(cart, { ...draft, lineId: lineKey(draft) }, now);
    }

    case "set-quantity":
      return {
        ...cart,
        lines: cart.lines.map((line) =>
          line.lineId === action.lineId ? withQuantity(line, action.quantity) : line,
        ),
        updatedAt: new Date().toISOString(),
      };

    case "remove-line":
      return {
        ...cart,
        lines: cart.lines.filter((line) => line.lineId !== action.lineId),
        updatedAt: new Date().toISOString(),
      };

    case "clear":
      return { ...cart, lines: [], updatedAt: new Date().toISOString() };
  }
}
