"use client";

import { createContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

import { siteConfig } from "@/config";

import type { AddRentalLineInput, AddShopLineInput, Cart, CartTotals } from "../types";
import { calculateTotals, emptyCart } from "../utils/totals";
import { cartReducer } from "./cart-reducer";
import { readPersistedCart, writePersistedCart } from "./cart-storage";

export interface CartContextValue {
  readonly cart: Cart;
  readonly totals: CartTotals;
  /** False until persisted state has been read, so the UI can avoid flicker. */
  readonly isHydrated: boolean;
  addShopLine(input: AddShopLineInput): void;
  addRentalLine(input: AddRentalLineInput): void;
  setQuantity(lineId: string, quantity: number): void;
  removeLine(lineId: string): void;
  clear(): void;
}

export const CartContext = createContext<CartContextValue | null>(null);

/**
 * Application state lives in Context + useReducer — no state library.
 *
 * The cart is the only truly global client state in the platform: catalogue data
 * is server state (fetched in Server Components), and filters live in the URL.
 * One small provider is the proportionate answer; `useCart()` is the seam that
 * lets it be replaced by a store or a server-backed cart later.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, siteConfig.defaultCurrency, emptyCart);
  const [isHydrated, markHydrated] = useReducer(() => true, false);

  // Hydration happens after mount so server and first client render match.
  useEffect(() => {
    const persisted = readPersistedCart();
    if (persisted) dispatch({ type: "hydrate", cart: persisted });
    markHydrated();
  }, []);

  useEffect(() => {
    if (isHydrated) writePersistedCart(cart);
  }, [cart, isHydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      totals: calculateTotals(cart),
      isHydrated,
      addShopLine: (input) =>
        dispatch({ type: "add-shop-line", input, now: new Date().toISOString() }),
      addRentalLine: (input) =>
        dispatch({ type: "add-rental-line", input, now: new Date().toISOString() }),
      setQuantity: (lineId, quantity) => dispatch({ type: "set-quantity", lineId, quantity }),
      removeLine: (lineId) => dispatch({ type: "remove-line", lineId }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [cart, isHydrated],
  );

  return <CartContext value={value}>{children}</CartContext>;
}
