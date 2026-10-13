import type { RentalAvailabilityDay } from "@/features/rental";

/**
 * Reading a calendar the service handed down.
 *
 * Nothing here decides availability — `rentalService.getAvailability` does, and
 * a real backend will. These are presentation reductions: a fortnight of counts
 * turned into the one signal `.stock-signal` can draw, and the search for a
 * window that would actually work, which is what turns "not available" from a
 * dead end into an offer.
 *
 * They live beside the route rather than in `features/rental` because they are
 * about how this page talks, not about what a rental is.
 */
export type StockSignal = "in-stock" | "low-stock" | "out-of-stock";

/** One day, against the size of the fleet. */
export function daySignal(unitsAvailable: number, totalUnits: number): StockSignal {
  if (unitsAvailable <= 0) return "out-of-stock";
  /* Half the fleet or less is "limited" rather than "in": on a depot with one
     unit, that one unit is simply available. */
  if (unitsAvailable * 2 <= totalUnits) return "low-stock";
  return "in-stock";
}

/** A whole window, for a card or a hero chip. */
export function windowSignal(
  days: readonly RentalAvailabilityDay[],
  totalUnits: number,
): StockSignal {
  if (days.length === 0) return "out-of-stock";
  const free = days.filter((day) => day.unitsAvailable > 0);
  if (free.length === 0) return "out-of-stock";
  if (free.length < days.length || free.some((day) => day.unitsAvailable < totalUnits)) {
    return "low-stock";
  }
  return "in-stock";
}

/** The first date in the scan that could take `quantity` units. */
export function firstFreeDate(
  days: readonly RentalAvailabilityDay[],
  quantity: number,
): string | undefined {
  return days.find((day) => day.unitsAvailable >= quantity)?.date;
}

/**
 * The earliest run of `length` consecutive days that can take `quantity` units.
 *
 * This is what the "those dates are taken" state offers instead of an apology:
 * the same hire, the same length, on the first dates that would work.
 */
export function firstFreeWindow(
  days: readonly RentalAvailabilityDay[],
  length: number,
  quantity: number,
): { from: string; to: string } | undefined {
  if (length < 1) return undefined;
  for (let start = 0; start + length <= days.length; start += 1) {
    const window = days.slice(start, start + length);
    if (window.every((day) => day.unitsAvailable >= quantity)) {
      return { from: window[0].date, to: window[window.length - 1].date };
    }
  }
  return undefined;
}
