import type { RentalItem, RentalRate, RentalUnit } from "../types";

/** Anything that carries rates — the domain item, or a raw fixture. */
type HasRates = Pick<RentalItem, "rates">;

/** Presentation helper: the "from" price shown on listings. */
export function lowestRate(item: HasRates): RentalRate {
  return item.rates.reduce((lowest, rate) => (rate.price.amount < lowest.price.amount ? rate : lowest));
}

export function supportedUnits(item: HasRates): readonly RentalUnit[] {
  return item.rates.map((rate) => rate.unit);
}

/**
 * The rate a listing quotes, in the unit the thing is actually hired in.
 *
 * `lowestRate` answers "what is the smallest number on this item", which is the
 * right answer for a filter and the wrong one for a card: a renter compares
 * DAILY RATES, and an item quoted by the week against one quoted by the day is
 * two numbers that cannot be read side by side. So a day rate wins, then an
 * hour rate for the things that are only ever booked by the hour, and a week
 * rate last — and the card prints the unit next to the figure either way, so
 * the row stays honest when they differ.
 */
const UNIT_ORDER: readonly RentalUnit[] = ["day", "hour", "week"];

export function headlineRate(item: HasRates): RentalRate {
  for (const unit of UNIT_ORDER) {
    const match = item.rates.find((rate) => rate.unit === unit);
    if (match) return match;
  }
  return lowestRate(item);
}

/** The longer-hire rate, when the item has one the headline did not already use. */
export function longerRate(item: HasRates): RentalRate | undefined {
  const headline = headlineRate(item);
  return item.rates.find((rate) => rate.unit !== headline.unit && rate.price.amount > headline.price.amount);
}
