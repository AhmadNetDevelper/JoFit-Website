"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses, inputClasses, labelClasses, selectClasses } from "@/components/ui";
import { buildQueryString } from "@/lib";

import type { RentalUnit } from "../types";

/**
 * The selected rental period is URL state, not client state.
 *
 * Submitting navigates with `from`/`to`/`unit`/`qty`, and the server re-renders
 * the page with a quote from `rentalService.quote`. This is what keeps pricing
 * and availability out of the browser: the client chooses a period, the data
 * layer prices it.
 *
 * The compact, general-purpose form (the item page uses its own richer
 * `BookingPanel`). Styled with the kit's field classes only, so it matches every
 * other form on the site wherever it is dropped in. Every word arrives finished:
 * pass `unitLabels` to name the units in the reader's language, or the raw id
 * is shown.
 */
export function RentalPeriodForm({
  basePath,
  units,
  defaultFrom,
  defaultTo,
  defaultUnit,
  defaultQuantity,
  labels,
  unitLabels,
}: {
  /** Already locale-prefixed by the caller. */
  basePath: string;
  units: readonly RentalUnit[];
  defaultFrom?: string;
  defaultTo?: string;
  defaultUnit: RentalUnit;
  defaultQuantity: number;
  labels: {
    from: string;
    to: string;
    unit: string;
    quantity: string;
    submit: string;
  };
  /** Translated unit names, keyed by unit id. */
  unitLabels?: Partial<Readonly<Record<RentalUnit, string>>>;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [unit, setUnit] = useState<RentalUnit>(defaultUnit);
  const [quantity, setQuantity] = useState(defaultQuantity);

  return (
    <form
      className="grid items-end gap-4 rounded-3xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1fr_1fr_7rem_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`${basePath}${buildQueryString({ from, to, unit, qty: quantity })}`);
      }}
    >
      <div className="min-w-0">
        <label htmlFor="rental-period-from" className={labelClasses}>
          {labels.from}
        </label>
        <input
          id="rental-period-from"
          type="date"
          required
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={inputClasses()}
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="rental-period-to" className={labelClasses}>
          {labels.to}
        </label>
        <input
          id="rental-period-to"
          type="date"
          required
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
          className={inputClasses()}
        />
      </div>
      <div className="min-w-0">
        <label htmlFor="rental-period-unit" className={labelClasses}>
          {labels.unit}
        </label>
        <select
          id="rental-period-unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value as RentalUnit)}
          className={selectClasses()}
        >
          {units.map((value) => (
            <option key={value} value={value}>
              {unitLabels?.[value] ?? value}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor="rental-period-qty" className={labelClasses}>
          {labels.quantity}
        </label>
        <input
          id="rental-period-qty"
          type="number"
          inputMode="numeric"
          min={1}
          dir="ltr"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className={inputClasses()}
        />
      </div>
      <button type="submit" className={buttonClasses({ size: "lg", className: "h-12 sm:col-span-2 lg:col-span-1" })}>
        {labels.submit}
      </button>
    </form>
  );
}
