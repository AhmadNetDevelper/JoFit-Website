"use client";

import Image from "next/image";
import Link from "next/link";

import { buttonClasses } from "@/components/ui";
import { isFeatureEnabled } from "@/config";
import { formatDate, formatMoney, toIsoDate } from "@/lib";

import { useCart } from "../hooks/use-cart";
import { isLineStillValid, lineSubtotal } from "../line-handlers";
import type { CartLine } from "../types";
import { groupByFulfilment } from "../utils/totals";

/**
 * All copy and the locale tag arrive as props from the Server Component that
 * renders this. The cart is the one place with real client state, and it still
 * ships no dictionary — translation stays on the server.
 */
export interface CartCopy {
  readonly loading: string;
  readonly empty: string;
  readonly emptyLead: string;
  readonly browseShop: string;
  readonly emptyRental: string;
  readonly purchases: string;
  readonly bookings: string;
  readonly remove: string;
  /** Contains a literal `{title}` placeholder. */
  readonly removeNamed: string;
  readonly totals: string;
  readonly summary: string;
  readonly items: string;
  readonly deposits: string;
  readonly payableNow: string;
  readonly taxNote: string;
  readonly checkout: string;
  readonly checkoutSoon: string;
  readonly clear: string;
  readonly staleBooking: string;
  /** Contains a literal `{amount}` placeholder. */
  readonly refundableDeposit: string;
  readonly quantity: string;
  /** Both contain a literal `{title}` placeholder. */
  readonly increase: string;
  readonly decrease: string;
  readonly rentalPeriod: string;
  readonly rentalFixed: string;
}

/* ---------------------------------------------------------------------------
 * THE QUANTITY STEPPER — a pill with a minus, the count and a plus.
 *
 * SHOP LINES ONLY, and that is a rule rather than an omission. A rental line
 * carries a quote issued by the rental service, and the cart never recomputes
 * rental pricing — multiplying a quoted subtotal by a number the visitor
 * picked would invent a price the server never agreed to. Changing how many
 * units you are hiring means asking for a new quote, which happens on the item
 * page. The line says so.
 * ------------------------------------------------------------------------- */
function QuantityStepper({
  value,
  title,
  copy,
  onChange,
}: {
  value: number;
  title: string;
  copy: CartCopy;
  onChange: (next: number) => void;
}) {
  const button =
    "grid size-8 cursor-pointer place-items-center rounded-full text-ink transition-colors duration-200 " +
    "hover:bg-primary-05 hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      {/* The group's name. Each button already says which item it acts on, so
          this is the only place the word "quantity" needs to appear. */}
      <span className="sr-only">{copy.quantity}</span>
      <button
        type="button"
        className={button}
        /* One is the floor, not zero: emptying a line is what Remove is for,
           and a stepper that silently deletes the row is a different action
           wearing the same button. */
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={copy.decrease.replace("{title}", title)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* `dir="ltr"` and tabular figures: a count is a Latin numeral inside
          prose that may be RTL, and proportional digits make the row twitch
          every time the number changes width. */}
      <span dir="ltr" className="min-w-7 text-center text-[15px] font-semibold text-ink tabular-nums">
        {value}
      </span>

      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        aria-label={copy.increase.replace("{title}", title)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 6h7M6 2.5v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Renders a cart line by kind. The union is destructured here rather than
 * flattened into a lowest-common-denominator shape, so a rental line can show
 * its period and deposit without the shop line pretending to have them.
 */
function CartLineRow({
  line,
  isValid,
  onRemove,
  onQuantity,
  copy,
  localeTag,
  itemHref,
}: {
  line: CartLine;
  isValid: boolean;
  onRemove: () => void;
  onQuantity: (next: number) => void;
  copy: CartCopy;
  localeTag: string;
  itemHref: string;
}) {
  return (
    <li className="group relative flex flex-col gap-5 rounded-3xl border border-line bg-surface p-4 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-primary/25 hover:shadow-lift sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      {/*
        The photograph, or the small plate that stands in for one — the shop
        grid's plate in miniature (canvas, dotted grid, a white medallion with a
        gold inner ring). No product photography has been supplied, so `image`
        is empty on every fixture. The shop's own `ProductMedia` cannot be
        reused: it takes a whole `Product`, which a cart line deliberately is
        not, and it lives under `(site)/shop`, which a feature may not import.

        `aria-hidden` and out of the tab order because the title beside it is
        the same link; two stops to the same place is noise on a keyboard.
      */}
      <Link
        href={itemHref}
        className="relative isolate grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-canvas"
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.image ? (
          <Image
            src={line.image.url}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <span className="pattern-grid absolute inset-0 -z-10 text-primary/[0.13]" />
            <span className="relative grid size-14 place-items-center rounded-full bg-surface text-primary shadow-soft ring-1 ring-primary/10">
              <span className="absolute inset-1 rounded-full border border-accent/45" />
              {line.kind === "shop" ? <BagOutline /> : <CalendarOutline />}
            </span>
          </>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <h3 className="text-[1.05rem] leading-snug">
          <Link href={itemHref} className="transition-colors hover:text-primary">
            {line.title}
          </Link>
        </h3>

        {line.kind === "shop" ? (
          <p className="mt-1 text-[14px] text-body">
            <span dir="auto">{line.variantTitle}</span>
            <span className="px-2 text-body/35" aria-hidden="true">
              ·
            </span>
            <span dir="ltr" className="tabular-nums">
              {formatMoney(line.unitPrice, localeTag)}
            </span>
          </p>
        ) : (
          <div className="mt-1 space-y-0.5 text-[14px] text-body">
            <p>
              <span className="text-body/70">{`${copy.rentalPeriod}: `}</span>
              {/* Two locale-formatted dates, NOT wrapped in an LTR run: an
                  Arabic date carries its own bidi marks, and forcing the
                  direction reorders them into garbage (pitfalls #11). */}
              <span className="tabular-nums">{formatDate(line.period.range.from, localeTag)}</span>
              <span className="px-1.5 text-body/50" aria-hidden="true">
                –
              </span>
              <span className="tabular-nums">{formatDate(line.period.range.to, localeTag)}</span>
            </p>
            <p>
              <span dir="ltr" className="tabular-nums">
                {`${line.quote.billableUnits} × ${line.period.unit}`}
              </span>
            </p>
          </div>
        )}

        {line.kind === "rental" && line.quote.deposit ? (
          <p className="mt-2 inline-flex items-center rounded-full bg-accent-10 px-3 py-1 text-[12.5px] font-medium text-accent-strong">
            {copy.refundableDeposit.replace("{amount}", formatMoney(line.quote.deposit, localeTag))}
          </p>
        ) : null}

        {/* Only rental lines can go stale: a quote is tied to a period that may
            have passed or sold out since it was added. */}
        {isValid ? null : (
          <p role="alert" className="mt-3 rounded-xl bg-danger-05 px-3.5 py-2 text-[13px] font-medium text-danger">
            {copy.staleBooking}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          {line.kind === "shop" ? (
            <QuantityStepper value={line.quantity} title={line.title} copy={copy} onChange={onQuantity} />
          ) : (
            <p className="max-w-[34ch] text-[12.5px] leading-relaxed text-body/70">{copy.rentalFixed}</p>
          )}

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-medium text-body transition-colors hover:bg-danger-05 hover:text-danger"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.8 4.4h10.4M6.4 4.4V2.8h3.2v1.6M4.2 4.4l.6 8.4a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.6-8.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span aria-hidden="true">{copy.remove}</span>
            <span className="sr-only">{copy.removeNamed.replace("{title}", line.title)}</span>
          </button>
        </div>
      </div>

      {/* The money. Last in the DOM so a screen reader hears what the thing is
          before what it costs, and pulled to the row's end visually. */}
      <p dir="ltr" className="shrink-0 font-heading text-[1.2rem] font-bold text-ink tabular-nums sm:text-end">
        {formatMoney(lineSubtotal(line), localeTag)}
      </p>
    </li>
  );
}

/* ---------------------------------------------------------------------------
 * THE SKELETON.
 *
 * The cart lives in localStorage, so the first paint genuinely does not know
 * what is in it. Shapes the size of the real thing hold the space instead of a
 * sentence the page then jumps away from. The text is still there for screen
 * readers, which cannot see a grey rectangle.
 * ------------------------------------------------------------------------- */
function CartSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10" aria-hidden="true">
        <div className="space-y-4">
          <div className="h-7 w-40 animate-pulse rounded-full bg-canvas" />
          {[0, 1].map((key) => (
            <div key={key} className="h-[136px] animate-pulse rounded-3xl border border-line bg-canvas" />
          ))}
        </div>
        <div className="h-[340px] animate-pulse rounded-3xl bg-deep/90" />
      </div>
    </div>
  );
}

export function CartView({
  copy,
  localeTag,
  shopHref,
  rentalHref,
  checkoutHref,
  productBase,
  rentalItemBase,
}: {
  copy: CartCopy;
  localeTag: string;
  shopHref: string;
  rentalHref: string;
  checkoutHref: string;
  /*
   * BASE PATHS, NOT `(slug) => string`.
   *
   * The obvious shape here is a pair of builder functions passed down from the
   * server, where `localePath` and the locale already are. It does not work:
   * only Server Actions may cross into a Client Component, and a plain function
   * throws "Functions cannot be passed directly to Client Components" at
   * render.
   *
   * So the server sends the two prefixes it has already localized and the
   * client appends a slug — which is string concatenation, not routing
   * knowledge, and keeps the locale on the server where it belongs.
   */
  productBase: string;
  rentalItemBase: string;
}) {
  const { cart, totals, isHydrated, removeLine, setQuantity, clear } = useCart();

  if (!isHydrated) {
    return <CartSkeleton label={copy.loading} />;
  }

  if (cart.lines.length === 0) {
    return (
      /* A designed empty state rather than a centred sentence. An empty cart is
         the most common state this page has, and the one screen where a
         visitor is most likely to leave — so it gets a reason to stay and two
         real destinations, not an apology. */
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-soft sm:px-12 sm:py-16">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
        >
          <BagOutline />
        </span>

        <h2 className="mt-7 text-[1.6rem] leading-tight sm:text-[1.9rem]">{copy.empty}</h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed text-body">{copy.emptyLead}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href={shopHref} className={buttonClasses({ size: "lg" })}>
            {copy.browseShop}
          </Link>
          <Link href={rentalHref} className={buttonClasses({ variant: "outline", size: "lg" })}>
            {copy.emptyRental}
          </Link>
        </div>
      </div>
    );
  }

  const today = toIsoDate(new Date());
  const groups = groupByFulfilment(cart);
  const checkoutOpen = isFeatureEnabled("checkout");

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
      <div className="space-y-12">
        {groups.map((group) => (
          <section key={group.kind} aria-labelledby={`group-${group.kind}`}>
            <h2 id={`group-${group.kind}`} className="flex items-center gap-3 text-[1.35rem] sm:text-[1.5rem]">
              {group.kind === "shop" ? copy.purchases : copy.bookings}
              <span
                dir="ltr"
                className="grid h-7 min-w-7 place-items-center rounded-full bg-primary-05 px-2 font-sans text-[13px] font-semibold text-primary-dark"
              >
                {group.lines.length}
              </span>
            </h2>

            <ul className="mt-6 grid gap-4">
              {group.lines.map((line) => (
                <CartLineRow
                  key={line.lineId}
                  line={line}
                  isValid={isLineStillValid(line, today)}
                  onRemove={() => removeLine(line.lineId)}
                  onQuantity={(next) => setQuantity(line.lineId, next)}
                  copy={copy}
                  localeTag={localeTag}
                  itemHref={
                    line.kind === "shop" ? `${productBase}/${line.productSlug}` : `${rentalItemBase}/${line.itemSlug}`
                  }
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/*
        THE SUMMARY — a deep panel, the one dark surface on the page below the
        hero, so the figure the whole page is about is the easiest thing on it
        to find. It sticks on desktop: a cart can run past a screen, and a total
        that scrolls away is a total you have to hunt for.
      */}
      <section
        aria-labelledby="totals-heading"
        className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7 lg:sticky lg:top-28"
      >
        <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
        <span
          aria-hidden="true"
          className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
        />

        <h2 id="totals-heading" className="text-[1.3rem] text-white">
          {copy.summary}
        </h2>

        <dl className="mt-6 space-y-3.5 text-[15px]">
          <div className="flex items-baseline justify-between gap-4">
            <dt>{copy.items}</dt>
            <dd dir="ltr" className="font-semibold text-white tabular-nums">
              {formatMoney(totals.itemsSubtotal, localeTag)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>{copy.deposits}</dt>
            <dd dir="ltr" className="font-semibold text-white tabular-nums">
              {formatMoney(totals.depositsTotal, localeTag)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-white/15 pt-4">
            <dt className="font-semibold text-white">{copy.payableNow}</dt>
            <dd dir="ltr" className="font-heading text-[1.7rem] leading-none font-bold text-accent tabular-nums">
              {formatMoney(totals.payableTotal, localeTag)}
            </dd>
          </div>
        </dl>

        {/* Tax, shipping and fees are calculated server-side at checkout. */}
        <p className="mt-4 text-[12.5px] leading-relaxed text-white/60">{copy.taxNote}</p>

        {checkoutOpen ? (
          <Link href={checkoutHref} className={buttonClasses({ variant: "gold", size: "lg", className: "mt-7 w-full" })}>
            {copy.checkout}
          </Link>
        ) : (
          /*
            A disabled LINK is not a thing. `aria-disabled` on an anchor still
            navigates on click and still takes focus. A real <button disabled>
            cannot be clicked by anyone, and the sentence underneath says why.
          */
          <>
            <button type="button" disabled className={buttonClasses({ variant: "gold", size: "lg", className: "mt-7 w-full" })}>
              {copy.checkout}
            </button>
            <p className="mt-2.5 text-center text-[12.5px] text-white/60">{copy.checkoutSoon}</p>
          </>
        )}

        <button
          type="button"
          onClick={clear}
          className="mt-3 w-full cursor-pointer rounded-full py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {copy.clear}
        </button>
      </section>
    </div>
  );
}

/* Line icons on the site's 24-unit grid: a bag for something you are buying, a
   calendar for something you are booking, so the plate still says which kind
   of line it is. */
function BagOutline({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5h15l-1.1 11.6a1.5 1.5 0 0 1-1.5 1.4H7.1a1.5 1.5 0 0 1-1.5-1.4L4.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.5 10V6.5a3.5 3.5 0 1 1 7 0V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarOutline({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
