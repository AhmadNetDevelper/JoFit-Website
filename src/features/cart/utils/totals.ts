import { addMoney, sumMoney } from "@/lib";
import type { Money } from "@/types";

import { lineDeposit, lineQuantity, lineSubtotal } from "../line-handlers";
import type { Cart, CartFulfilmentGroup, CartLine, CartLineKind, CartTotals } from "../types";

export function calculateTotals(cart: Cart): CartTotals {
  const subtotals: Money[] = cart.lines.map(lineSubtotal);
  const deposits: Money[] = cart.lines.map((line) => lineDeposit(line, cart.currency));
  const itemsSubtotal = sumMoney(subtotals, cart.currency);
  const depositsTotal = sumMoney(deposits, cart.currency);

  return {
    currency: cart.currency,
    lineCount: cart.lines.length,
    itemCount: cart.lines.reduce((total, line) => total + lineQuantity(line), 0),
    itemsSubtotal,
    depositsTotal,
    payableTotal: addMoney(itemsSubtotal, depositsTotal),
  };
}

const GROUP_ORDER: readonly CartLineKind[] = ["shop", "rental"];

export function groupByFulfilment(cart: Cart): readonly CartFulfilmentGroup[] {
  return GROUP_ORDER.flatMap((kind) => {
    const lines: CartLine[] = cart.lines.filter((line) => line.kind === kind);
    if (lines.length === 0) return [];
    return [
      {
        kind,
        lines,
        subtotal: sumMoney(lines.map(lineSubtotal), cart.currency),
        depositsTotal: sumMoney(
          lines.map((line) => lineDeposit(line, cart.currency)),
          cart.currency,
        ),
      },
    ];
  });
}

export function emptyCart(currency: Cart["currency"]): Cart {
  return { lines: [], currency, updatedAt: new Date(0).toISOString() };
}
