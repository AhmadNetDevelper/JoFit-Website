"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { buttonClasses, hintClasses, inputClasses, labelClasses } from "@/components/ui";
import { buildQueryString } from "@/lib";

/**
 * CHOOSING THE DATES. The only Client Component on this route.
 *
 * ---------------------------------------------------------------------------
 * THE PERIOD IS URL STATE, NOT COMPONENT STATE.
 *
 * Submitting navigates with `from`/`to`/`unit`/`qty` and the server re-renders
 * the page with a quote from `rentalService.quote`. Nothing here prices
 * anything or decides whether a day is free: a browser that could work out the
 * price would be a browser that could be argued with. It also means a chosen
 * period survives a reload, can be sent to somebody, and Back undoes one choice
 * instead of leaving the page.
 *
 * ---------------------------------------------------------------------------
 * EVERY WORD ARRIVES FINISHED, AND SO DOES THE QUOTE.
 *
 * `t` is a function and a function cannot cross this boundary at all — nor can
 * the money and date formatters. So the labels are strings, and the priced
 * result is `children`: a SERVER-rendered block passed straight through. The
 * client decides whether it is showing, never what it says.
 *
 * ---------------------------------------------------------------------------
 * WHY IT HIDES THE QUOTE THE MOMENT YOU TOUCH A FIELD.
 *
 * The quote below belongs to the dates in the URL. Edit a field and it is no
 * longer a quote for what is on screen, and the add-to-cart button under it
 * would add the OLD period at the OLD price. So any divergence swaps the
 * priced block for a line telling you to check the new dates — the one state
 * that is genuinely impossible to get wrong.
 */
export interface BookingUnitOption {
  readonly value: string;
  readonly label: string;
}

export interface BookingPanelLabels {
  readonly legend: string;
  readonly from: string;
  readonly to: string;
  readonly unit: string;
  readonly quantity: string;
  readonly quantityHint: string;
  readonly submit: string;
  readonly submitting: string;
  readonly reset: string;
  readonly staleTitle: string;
  readonly staleBody: string;
}

export function BookingPanel({
  basePath,
  today,
  lastBookableDate,
  units,
  defaults,
  maxQuantity,
  labels,
  children,
}: {
  /** Already locale-prefixed by the caller. */
  basePath: string;
  today: string;
  lastBookableDate: string;
  units: readonly BookingUnitOption[];
  defaults: {
    readonly from?: string;
    readonly to?: string;
    readonly unit: string;
    readonly quantity: number;
  };
  maxQuantity: number;
  labels: BookingPanelLabels;
  /** The server-rendered quote, or the prompt that stands in for it. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [from, setFrom] = useState(defaults.from ?? "");
  const [to, setTo] = useState(defaults.to ?? "");
  const [unit, setUnit] = useState(defaults.unit);
  const [quantity, setQuantity] = useState(defaults.quantity);

  const stale =
    from !== (defaults.from ?? "") ||
    to !== (defaults.to ?? "") ||
    unit !== defaults.unit ||
    quantity !== defaults.quantity;

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => {
            router.push(
              `${basePath}${buildQueryString({ from, to, unit, qty: quantity })}`,
              /* The visitor is standing on this panel; jumping to the top of
                 the document to show them a price they asked for in place is
                 the browser being unhelpful on our behalf. */
              { scroll: false },
            );
          });
        }}
      >
        <fieldset>
          <legend className="mb-5 font-heading text-[1.1rem] font-semibold text-ink">
            {labels.legend}
          </legend>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label htmlFor="rental-from" className={labelClasses}>
                {labels.from}
              </label>
              <input
                id="rental-from"
                type="date"
                required
                value={from}
                min={today}
                max={lastBookableDate}
                onChange={(event) => setFrom(event.target.value)}
                className={inputClasses()}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="rental-to" className={labelClasses}>
                {labels.to}
              </label>
              {/* `min={from}` is the whole of the "end before start" guard: the
                  browser enforces it, in every language, without a message
                  this component would have to invent. */}
              <input
                id="rental-to"
                type="date"
                required
                value={to}
                min={from || today}
                max={lastBookableDate}
                onChange={(event) => setTo(event.target.value)}
                className={inputClasses()}
              />
            </div>
          </div>
        </fieldset>

        {units.length > 1 ? (
          <fieldset className="mt-6">
            <legend className={labelClasses}>
              {labels.unit}
            </legend>
            <div className="flex flex-wrap gap-2">
              {units.map((option) => {
                const active = option.value === unit;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setUnit(option.value)}
                    className={[
                      "min-w-[4.5rem] cursor-pointer rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-line bg-surface text-ink hover:border-primary/40 hover:text-primary-dark",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6">
          <label htmlFor="rental-qty" className={labelClasses}>
            {labels.quantity}
          </label>
          {/* The width is the wrapper's: the kit's field is `w-full` and a
              second width utility on it loses to that one. */}
          <div className="w-28">
            <input
              id="rental-qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
              aria-describedby="rental-qty-hint"
              className={inputClasses()}
              dir="ltr"
            />
          </div>
          <p id="rental-qty-hint" className={hintClasses}>
            {labels.quantityHint}
          </p>
        </div>

        {/* The panel's one action, on its own line and the full width of it:
            beside the quantity field it read as a third form control, and a
            primary action that looks like a field is one nobody presses. */}
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses({ size: "lg", className: "mt-7 w-full" })}
        >
          {pending ? labels.submitting : labels.submit}
        </button>
      </form>

      <div className="mt-7 border-t border-line pt-7">
        {stale ? (
          <div role="status" className="rounded-2xl bg-accent-10 p-5 ring-1 ring-accent/30">
            <p className="font-heading text-[15px] font-semibold text-ink">{labels.staleTitle}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-body">{labels.staleBody}</p>
          </div>
        ) : (
          children
        )}

        {defaults.from && defaults.to ? (
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setQuantity(1);
              startTransition(() => router.push(basePath, { scroll: false }));
            }}
            className="mt-5 cursor-pointer text-[13px] font-semibold text-primary-dark underline-offset-4 hover:underline"
          >
            {labels.reset}
          </button>
        ) : null}
      </div>
    </div>
  );
}
