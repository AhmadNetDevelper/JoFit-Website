import { multiplyMoney, zeroMoney } from "@/lib";
import type { CurrencyCode, Money } from "@/types";

import type { CartLine } from "./types";

/**
 * Per-kind behaviour, expressed as exhaustive switches rather than a lookup
 * table. The switch is the point: adding a line kind without handling it here is
 * a compile error, which is exactly the guarantee a registry of `unknown`
 * handlers would lose.
 */

/**
 * Identity used both as the line id and as the merge key.
 *
 * Shop lines with the same variant merge by adding quantity. Rental lines merge
 * only when the item *and* the exact period match — two different hire windows
 * for the same bike are two separate commitments, not one line of quantity two.
 */
export function lineKey(line: CartLine): string {
  switch (line.kind) {
    case "shop":
      return `shop:${line.variantId}`;
    case "rental":
      return `rental:${line.itemId}:${line.period.unit}:${line.period.range.from}:${line.period.range.to}`;
  }
}

export function lineQuantity(line: CartLine): number {
  switch (line.kind) {
    case "shop":
      return line.quantity;
    case "rental":
      return line.period.quantity;
  }
}

export function lineSubtotal(line: CartLine): Money {
  switch (line.kind) {
    case "shop":
      return multiplyMoney(line.unitPrice, line.quantity);
    case "rental":
      // Already priced by the rental service, including the unit count.
      return line.quote.subtotal;
  }
}

export function lineDeposit(line: CartLine, currency: CurrencyCode): Money {
  switch (line.kind) {
    case "shop":
      return zeroMoney(currency);
    case "rental":
      return line.quote.deposit ?? zeroMoney(currency);
  }
}

/** Returns the line unchanged when its kind has no adjustable quantity. */
export function withQuantity(line: CartLine, quantity: number): CartLine {
  const next = Math.max(1, Math.trunc(quantity));
  switch (line.kind) {
    case "shop":
      return { ...line, quantity: next };
    case "rental":
      // Changing units changes the price, which only the rental service may
      // decide. The UI must request a fresh quote and replace the line instead.
      return line;
  }
}

export function isLineStillValid(line: CartLine, today: string): boolean {
  switch (line.kind) {
    case "shop":
      return true;
    case "rental":
      return line.quote.isAvailable && line.period.range.to >= today;
  }
}
