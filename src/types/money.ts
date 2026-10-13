/**
 * Money is stored in MINOR units (fils, cents) as an integer, never as a float.
 * Floating-point currency math is the single most common source of rounding bugs
 * in commerce frontends, so the domain never sees a `number` price.
 */
export type CurrencyCode = "JOD" | "USD" | "EUR" | "SAR" | "AED";

export interface Money {
  /** Integer amount in the currency's minor unit (e.g. 12_500 = 12.500 JOD). */
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface MoneyRange {
  readonly min: Money;
  readonly max: Money;
}

/**
 * A price that may be discounted. `compareAt` is the struck-through reference
 * price. The *rules* that produce a discount (campaigns, tiers, coupons) are an
 * OPEN BUSINESS DECISION and belong to the backend — the frontend only renders
 * what it is given.
 */
export interface Price {
  readonly current: Money;
  readonly compareAt?: Money;
}
