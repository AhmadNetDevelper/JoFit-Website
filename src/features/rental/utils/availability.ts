import { eachDateInRange } from "@/lib";
import type { DateRange } from "@/types";

import type { RentalAvailability } from "../types";

/**
 * WHAT A RENTER ACTUALLY ASKS.
 *
 * A shopper asks "is it in stock"; a renter asks "can I have it on the days I
 * want it, and if not, when". Those are different questions, and the second one
 * is not answerable from a stock level at all — it needs the calendar the
 * service already returns.
 *
 * So the listing reduces a whole `RentalAvailability` to one signal, over the
 * window the visitor is looking at. Everything here is derivation, not data:
 * the days come from `rentalService.getAvailability`, and the only thing this
 * file decides is which of four words describes them.
 *
 * The four words are the shared `.stock-signal` vocabulary from `globals.css`
 * — deliberately, rather than a fifth colour invented for this page. The
 * mapping is the honest one:
 *
 *   in-stock     two or more units free across the whole window
 *   low-stock    exactly one left — book it or lose it
 *   pre-order    nothing now, but a window of the same length opens on a date
 *                we can name
 *   out-of-stock nothing inside the horizon we looked at
 *
 * A rental is a claim on a unit over a period, so "free" means free on EVERY
 * day of the period. The minimum across the window is the only correct answer;
 * an average would sell a board that is already out on the Friday.
 */
export type RentalAvailabilityStatus = "in-stock" | "low-stock" | "out-of-stock" | "pre-order";

export interface RentalAvailabilitySignal {
  readonly status: RentalAvailabilityStatus;
  /** Units free across the whole window — the minimum, never the average. */
  readonly unitsFree: number;
  readonly totalUnits: number;
  /** Set only for `pre-order`: the first date the same-length window opens. */
  readonly nextFreeFrom?: string;
}

export function readAvailabilitySignal(
  availability: RentalAvailability,
  window: DateRange,
  totalUnits: number,
): RentalAvailabilitySignal {
  const byDate = new Map(availability.days.map((day) => [day.date, day.unitsAvailable]));
  const windowDates = eachDateInRange(window);

  /* A calendar endpoint reports exceptions, not every day of the year, so a
     date it never mentions is a date with nothing booked on it. */
  const unitsOn = (date: string) => byDate.get(date) ?? totalUnits;

  if (windowDates.length === 0) {
    return { status: "out-of-stock", unitsFree: 0, totalUnits };
  }

  const unitsFree = windowDates.reduce((lowest, date) => Math.min(lowest, unitsOn(date)), totalUnits);

  if (unitsFree >= 2) return { status: "in-stock", unitsFree, totalUnits };
  if (unitsFree === 1) return { status: "low-stock", unitsFree, totalUnits };

  /*
   * Nothing in the window, so look for the next one that fits.
   *
   * A HIRE OF THE SAME LENGTH, not merely the next day with a unit free: for a
   * three-day hire, "free from Thursday" has to mean Thursday, Friday and
   * Saturday, or the date is a promise the booking step will break.
   */
  const horizon = availability.days.map((day) => day.date).filter((date) => date > window.to);
  const length = windowDates.length;

  /* `availability.days` is built from `eachDateInRange`, so the horizon is
     already consecutive calendar days and a slice of it is a real window. */
  for (let start = 0; start + length <= horizon.length; start += 1) {
    const fits = horizon.slice(start, start + length).every((date) => unitsOn(date) >= 1);
    if (fits) {
      return { status: "pre-order", unitsFree: 0, totalUnits, nextFreeFrom: horizon[start] };
    }
  }

  return { status: "out-of-stock", unitsFree: 0, totalUnits };
}
