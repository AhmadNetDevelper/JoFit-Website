import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import {
  headlineRate,
  type RentalAvailabilitySignal,
  type RentalCondition,
  type RentalItem,
  type RentalUnit,
} from "@/features/rental";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { DepositIcon, PinIcon, StarIcon } from "./icons";
import { RentalMedia } from "./rental-media";

/**
 * THE RENTAL CARD — the formal redesign.
 *
 * The course card's sibling in shape (a framed plate, the facts, a footer with
 * the one way in) so the three catalogues on this site read as one site. It is
 * its own component because a renter asks two things a course buyer does not:
 *
 *   1. THE RATE, in the unit the thing is hired in. It is the largest figure on
 *      the card and it always carries its unit, because "25.000 JOD" means
 *      nothing until you know whether that is a day or a week. `headlineRate`
 *      prefers the day rate so a column of cards can be read down. (Rental
 *      rates are real fixture data; course fees are not, and never appear.)
 *   2. WHETHER IT IS FREE — not how many are in the warehouse. Free means free
 *      on every day of the window the visitor is looking at, and when it is
 *      not, the card names the date it opens instead of shrugging.
 *
 * Then the two facts that decide whether a hire is practical at all: the
 * DEPOSIT and the DEPOT you collect from.
 *
 * There is no "add to cart" here. A booking needs dates and a quantity; a
 * button that silently books today is worse than a link to the page where the
 * period is chosen. One link covers the whole card (the title's `::after`).
 *
 * Every variable row is reserved (`min-h-*` with a named leading), so the
 * footers line up across a row in both languages (pitfalls #2, #3).
 */

/** Only a booked-out item mutes its plate. */
const MUTED: Readonly<Record<RentalAvailabilitySignal["status"], boolean>> = {
  "in-stock": false,
  "low-stock": false,
  "pre-order": false,
  "out-of-stock": true,
};

const UNIT_LABEL = {
  hour: "rental.perHour",
  day: "rental.perDay",
  week: "rental.perWeek",
} as const satisfies Record<RentalUnit, string>;

const CONDITION_LABEL = {
  new: "rental.conditionNew",
  excellent: "rental.conditionExcellent",
  good: "rental.conditionGood",
  fair: "rental.conditionFair",
} as const satisfies Record<RentalCondition, string>;

export function RentalCard({
  item,
  signal,
  locale,
  t,
  priority = false,
}: {
  item: RentalItem;
  /** Derived from the service's calendar by the page — never in here. */
  signal: RentalAvailabilitySignal;
  locale: Locale;
  t: Translate;
  /** Set on the first row, which is above the fold at every breakpoint. */
  priority?: boolean;
}) {
  const { money, number, date } = getFormatters(locale);
  const href = localePath(locale, `/rental/items/${item.slug}`);

  const rate = headlineRate(item);
  const muted = MUTED[signal.status];

  /* One sentence per state, resolved here so the card renders a finished
     string rather than a chain of conditionals in the middle of the layout. */
  const availability =
    signal.status === "out-of-stock"
      ? t("rental.cardBookedOut")
      : signal.status === "pre-order"
        ? t("rental.cardFreeFrom", { date: date(signal.nextFreeFrom ?? "") })
        : signal.status === "low-stock"
          ? t("rental.cardLastOne")
          : t("rental.cardFree", {
              free: number(signal.unitsFree),
              total: number(signal.totalUnits),
            });

  return (
    <article className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      {/* `shrink-0` — the card is a flex column with a definite height, and a
          flex item shrinks by default, so a two-line title would otherwise be
          paid for out of the plate's height (pitfalls #3). The chips are
          siblings of the clipping box, not inside it (pitfalls #4). */}
      <div className="relative shrink-0">
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas ${muted ? "opacity-55 saturate-50" : ""}`}
        >
          <RentalMedia item={item} priority={priority} />
        </div>

        {/* Hired kit is second-hand by definition, and what state it is in is
            the question a photograph would answer — so it is stated. */}
        <p className="absolute top-3 start-3 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-semibold text-primary-dark shadow-soft">
          {t(CONDITION_LABEL[item.condition])}
        </p>

        {/* You collect a rental in person, so where it lives is not a
            footnote the way a warehouse is for a parcel. */}
        <p className="absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-medium text-body shadow-soft">
          <span className="text-primary">
            <PinIcon size={12} />
          </span>
          <span dir="auto">{item.location.city}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        {/* Two lines reserved on the title and two on the summary. */}
        <h3 className="line-clamp-2 min-h-[3rem] text-[1.1rem] leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{item.summary}</p>

        <div className="mt-4 grid min-h-[3.25rem] gap-1 rounded-2xl bg-canvas px-4 py-3 text-[13px]">
          {item.rating.count > 0 ? (
            <p
              className="inline-flex items-center gap-1.5 leading-5 text-body"
              aria-label={`${t("rental.ratingValue", { rating: number(item.rating.average) })}, ${t("rental.reviewsCount", { count: number(item.rating.count) })}`}
            >
              <span className="text-accent">
                <StarIcon size={13} />
              </span>
              <span className="font-semibold text-ink" dir="ltr">
                {item.rating.average.toFixed(1)}
              </span>
              <span className="text-body/60" dir="ltr">
                {`(${number(item.rating.count)})`}
              </span>
            </p>
          ) : (
            <p className="leading-5 text-body/65">{t("rental.noReviews")}</p>
          )}

          <p className="inline-flex items-center gap-1.5 leading-5 text-body">
            <span className="text-accent-strong">
              <DepositIcon size={13} />
            </span>
            {item.deposit ? (
              <span>
                {t("rental.cardDeposit")}{" "}
                <span className="font-semibold text-ink" dir="ltr">
                  {money(item.deposit)}
                </span>
              </span>
            ) : (
              <span className="font-medium text-primary-dark">{t("rental.cardNoDeposit")}</span>
            )}
          </p>
        </div>

        {/*
          THE TWO ANSWERS, STACKED — not side by side. "Free from 8 October" is
          half as wide again as "Free: 3 of 6", so as a row the pair wrapped on
          some cards and not others and dragged the grid out of line.
        */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-1.5 leading-none">
              <span className="font-heading text-[1.35rem] font-bold text-ink" dir="ltr">
                {money(rate.price)}
              </span>
              <span className="text-[12.5px] font-medium text-body/75">{t(UNIT_LABEL[rate.unit])}</span>
            </p>
            <p className="stock-signal mt-2.5 min-h-[1.1rem]" data-stock={signal.status}>
              {availability}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
          >
            <ArrowIcon />
          </span>
        </div>
      </div>
    </article>
  );
}
