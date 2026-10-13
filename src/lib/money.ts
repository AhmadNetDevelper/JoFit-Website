import type { CurrencyCode, Money } from "@/types";

/**
 * Arithmetic and formatting only. Pricing *rules* (discount eligibility, tax,
 * deposits, rental rates) are backend concerns and deliberately absent here.
 */
const MINOR_UNIT_DIGITS: Readonly<Record<CurrencyCode, number>> = {
  JOD: 3,
  USD: 2,
  EUR: 2,
  SAR: 2,
  AED: 2,
};

export function money(amount: number, currency: CurrencyCode): Money {
  return { amount: Math.round(amount), currency };
}

export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot combine ${a.currency} with ${b.currency}.`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function multiplyMoney(value: Money, factor: number): Money {
  return { amount: Math.round(value.amount * factor), currency: value.currency };
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode): Money {
  return values.reduce(addMoney, zeroMoney(currency));
}

export function toMajorUnits(value: Money): number {
  return value.amount / 10 ** MINOR_UNIT_DIGITS[value.currency];
}

export function formatMoney(value: Money, locale = "en"): string {
  const digits = MINOR_UNIT_DIGITS[value.currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toMajorUnits(value));
}
