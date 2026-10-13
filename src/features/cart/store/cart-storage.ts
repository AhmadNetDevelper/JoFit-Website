import type { Cart } from "../types";

/**
 * Browser persistence for the cart.
 *
 * Versioned so a shape change discards old data instead of crashing on it, and
 * fully guarded: storage can be unavailable (private mode, blocked cookies) and
 * the cart must still work for the session.
 *
 * When accounts exist, a server-backed cart replaces this module; nothing
 * outside `store/` imports it.
 */
const STORAGE_KEY = "jofit.cart.v1";

interface PersistedCart {
  readonly version: 1;
  readonly cart: Cart;
}

export function readPersistedCart(): Cart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCart;
    if (parsed?.version !== 1 || !Array.isArray(parsed.cart?.lines)) return null;
    return parsed.cart;
  } catch {
    return null;
  }
}

export function writePersistedCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedCart = { version: 1, cart };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage is a convenience, never a requirement.
  }
}
