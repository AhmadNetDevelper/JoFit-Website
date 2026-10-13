"use client";

import { useContext } from "react";

import { CartContext, type CartContextValue } from "../store/cart-provider";

/**
 * The cart's public API. Components depend on this hook, never on the context
 * object or the reducer, so the storage strategy can change underneath them.
 */
export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return value;
}
