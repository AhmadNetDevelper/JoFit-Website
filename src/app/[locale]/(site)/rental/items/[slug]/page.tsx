import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { AddRentalToCartButton } from "@/features/cart";
import {
  lowestRate,
  readAvailabilitySignal,
  rentalService,
  supportedUnits,
  type RentalCondition,
  type RentalPeriod,
  type RentalUnit,
} from "@/features/rental";
import { reviewsService } from "@/features/reviews";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import {
  addDays,
  buildQueryString,
  countDaysInclusive,
  metadataFromSeo,
  readNumberParam,
  readParam,
  resolveSearchParams,
  toIsoDate,
} from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { RentalCard } from "../../_components/rental-card";
import { RentalDesk } from "../../_components/rental-desk";
import { RentalMedia } from "../../_components/rental-media";
import {
  daySignal,
  firstFreeDate,
  firstFreeWindow,
  windowSignal,
  type StockSignal,
} from "./_components/availability";
import { BookingPanel } from "./_components/booking-panel";
import { CalendarIcon, ClockIcon, PinIcon, ShieldIcon, SparkIcon, StackIcon, StarIcon } from "./_components/icons";

/** What the calendar strip shows. */
const HORIZON_DAYS = 14;
/** How far ahead the page will look for a way to say yes instead of no. */
const SCAN_DAYS = 45;
/** The related cards answer for the coming week, and look a month deep so a
    booked item can name the day it frees up — the category page's rule. */
const RELATED_WINDOW_DAYS = 6;
const RELATED_HORIZON_DAYS = 34;

export async function generateMetadata({ params }: PageProps<"/[locale]/rental/items/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  /* The same lookup the page does, so an unknown slug is `noindex` rather than
     a 404 page advertising itself to a crawler. */
  const item = await rentalService.getItemBySlug(slug, locale);
  if (!item) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(item.seo, {
    locale,
    title: item.title,
    description: item.summary,
    path: `/rental/items/${item.slug}`,
    imageUrl: item.media.find((media) => media.kind === "image")?.url,
  });
}

/**
 * A HIRE ITEM — the formal detail recipe, as the course page has it:
 *
 *   PageHero   what it is, its rating and this fortnight's signal, with the
 *              TERMS CARD in the end column: the plate, the lowest rate, the
 *              deposit, the depot, the condition, the fleet, and the one action
 *   booking    the period form beside the fourteen-day calendar
 *   about      the description with the rate card and the depot beside it
 *   reviews    the aggregate and what people wrote
 *   related    three more items, then the group-hire desk
 *   help       the closing band
 *
 * Everything on this page exists to answer "can I have it, and when".
 *
 * ---------------------------------------------------------------------------
 * THE UNHAPPY PATHS ARE DESIGNED, NOT HANDLED.
 *
 *   - THE DATES ARE TAKEN. It names the days that are short, then offers the
 *     first window of the same length that would work, as a link that books it.
 *   - THE ITEM HAS NO AVAILABILITY AT ALL. The whole fortnight is out, so the
 *     calendar says so plainly and says when the fleet comes back — a date,
 *     not "unavailable".
 *   - THE PERIOD ITSELF IS WRONG (a hand-edited URL, an unsupported unit). It
 *     says which, rather than rendering a quote of zero.
 *
 * ---------------------------------------------------------------------------
 * ONE CLIENT COMPONENT, AND IT IS THE DATE PICKER.
 *
 * `BookingPanel` takes finished strings and receives the priced result as
 * server-rendered `children`. The translator, `Intl`, the money formatter and
 * every availability decision stay here, on the server.
 */
export default async function RentalItemPage({
  params,
  searchParams,
}: PageProps<"/[locale]/rental/items/[slug]">) {
  const [{ locale: raw, slug }, search] = await Promise.all([
    params,
    resolveSearchParams(searchParams),
  ]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { money, date, number, weekday } = getFormatters(locale);

  const item = await rentalService.getItemBySlug(slug, locale);
  if (!item) notFound();

  /* A unit and a condition are stored as IDS, and an id is not a word. Both are
     resolved to the reader's language here rather than printed raw. */
  const UNIT_LABEL: Readonly<Record<RentalUnit, string>> = {
    hour: t("rentalItem.unitHour"),
    day: t("rentalItem.unitDay"),
    week: t("rentalItem.unitWeek"),
  };

  const CONDITION_LABEL: Readonly<Record<RentalCondition, string>> = {
    new: t("rentalItem.conditionNew"),
    excellent: t("rentalItem.conditionExcellent"),
    good: t("rentalItem.conditionGood"),
    fair: t("rentalItem.conditionFair"),
  };

  const SIGNAL_LABEL: Readonly<Record<StockSignal, string>> = {
    "in-stock": t("rentalItem.signalFree"),
    "low-stock": t("rentalItem.signalLimited"),
    "out-of-stock": t("rentalItem.signalNone"),
  };

  const units = supportedUnits(item);
  const requestedUnit = readParam(search, "unit");
  const unit: RentalUnit = units.find((entry) => entry === requestedUnit) ?? lowestRate(item).unit;
  /* Clamped to the fleet: asking for seven of something the depot owns four of
     is a question with no useful answer, and the number came from a URL. */
  const quantity = Math.min(
    item.totalUnits,
    Math.max(1, Math.round(readNumberParam(search, "qty") ?? 1)),
  );

  const today = toIsoDate(new Date());
  const lastBookableDate = addDays(today, SCAN_DAYS - 1);
  const from = readParam(search, "from");
  const to = readParam(search, "to");
  const period: RentalPeriod | null = from && to ? { range: { from, to }, unit, quantity } : null;

  const [scan, quote, reviews, categories, sports] = await Promise.all([
    /* ONE calendar call, read four ways: the strip, the hero signal, the day a
       blocked item frees up, and the search for a window that would work. */
    rentalService.getAvailability(item.id, { from: today, to: lastBookableDate }),
    period ? rentalService.quote(item.id, period) : Promise.resolve(null),
    reviewsService.list({ locale, target: { type: "rental-item", id: item.id }, pageSize: 3 }),
    rentalService.listCategories(locale),
    sportsService.getManyByIds(item.sportIds, locale),
  ]);

  const horizon = scan.days.slice(0, HORIZON_DAYS);
  const heroSignal = windowSignal(horizon, item.totalUnits);
  const fleetIsOut = horizon.every((day) => day.unitsAvailable === 0);
  const returnsOn = firstFreeDate(scan.days, 1);

  const itemCategories = categories.filter((entry) => item.categoryIds.includes(entry.id));

  /* Same category first, then the best rated, de-duplicated. The catalogue is
     small enough that a strict category match can come back empty, and a "more
     kit" band that disappears on half the items is worse than a looser one. */
  const [sameCategory, popular] = await Promise.all([
    rentalService.listItems({
      locale,
      categorySlugs: itemCategories.map((entry) => entry.slug),
      pageSize: 6,
    }),
    rentalService.listItems({ locale, sort: "rating-desc", pageSize: 6 }),
  ]);

  const related = [...sameCategory.items, ...popular.items]
    .filter(
      (entry, index, all) =>
        entry.id !== item.id && all.findIndex((other) => other.id === entry.id) === index,
    )
    .slice(0, 3);

  /* The related cards are the listing's own cards, so they read their signal
     the listing's way: the coming week, from a calendar a month deep. */
  const relatedWindow = { from: today, to: addDays(today, RELATED_WINDOW_DAYS) };
  const relatedAvailability = await Promise.all(
    related.map((entry) =>
      rentalService.getAvailability(entry.id, { from: today, to: addDays(today, RELATED_HORIZON_DAYS) }),
    ),
  );

  const cheapest = lowestRate(item);
  const bookingPath = localePath(locale, `/rental/items/${item.slug}`);
  const ratingLabel = `${t("rentalItem.ratingValue", { rating: number(item.rating.average) })}, ${t("rentalItem.reviewsCount", { count: number(item.rating.count) })}`;

  const facts: readonly { icon: ReactNode; label: string; value: ReactNode }[] = [
    {
      icon: <ShieldIcon size={16} />,
      label: t("rentalItem.factDeposit"),
      value: item.deposit ? <span dir="ltr">{money(item.deposit)}</span> : t("rental.noDeposit"),
    },
    {
      icon: <PinIcon size={16} />,
      label: t("rentalItem.factDepot"),
      value: <span dir="auto">{`${item.location.name} · ${item.location.city}`}</span>,
    },
    {
      icon: <SparkIcon size={16} />,
      label: t("rentalItem.factCondition"),
      value: CONDITION_LABEL[item.condition],
    },
    {
      icon: <StackIcon size={16} />,
      label: t("rentalItem.factFleet"),
      value: <span dir="ltr">{number(item.totalUnits)}</span>,
    },
  ];

  /* ------------------------------------------------------------------------ */
  /* THE PRICED RESULT — rendered here, on the server, and handed to the       */
  /* client panel as children so no formatter has to cross the boundary.      */
  /* ------------------------------------------------------------------------ */
  const blockingDays =
    period && quote && !quote.isAvailable && quote.unavailableReason === "insufficient-units"
      ? scan.days.filter(
          (day) =>
            day.date >= period.range.from &&
            day.date <= period.range.to &&
            day.unitsAvailable < quantity,
        )
      : [];

  const alternative =
    period && blockingDays.length > 0
      ? firstFreeWindow(scan.days, Math.max(1, countDaysInclusive(period.range)), quantity)
      : undefined;

  const alternativeHref = alternative
    ? `${bookingPath}${buildQueryString({ from: alternative.from, to: alternative.to, unit, qty: quantity })}`
    : undefined;

  let quoteView: ReactNode;

  if (!period || !quote) {
    quoteView = (
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
        >
          <CalendarIcon size={18} />
        </span>
        <div>
          <p className="font-heading text-[15px] font-semibold text-ink">{t("rentalItem.promptTitle")}</p>
          <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-body">{t("rentalItem.promptBody")}</p>
        </div>
      </div>
    );
  } else if (quote.isAvailable) {
    quoteView = (
      <div>
        <p className="eyebrow">{t("rental.yourQuote")}</p>

        <dl className="mt-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-[14px] text-body">{t("rental.period")}</dt>
            {/* Two dates, two elements. The flex row lays them out along the
                page's own direction, so neither one names a side. */}
            <dd className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-semibold text-ink">
              <span>{date(period.range.from)}</span>
              <span aria-hidden="true" className="text-body/45">
                —
              </span>
              <span>{date(period.range.to)}</span>
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="text-[14px] text-body">{t("rental.billableUnits")}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-1.5 text-[14px] font-semibold text-ink">
              <span dir="ltr">{number(quote.billableUnits)}</span>
              <span>{UNIT_LABEL[period.unit]}</span>
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
            <dt className="font-heading text-[15px] font-semibold text-ink">{t("rental.subtotal")}</dt>
            <dd className="font-heading text-[1.6rem] leading-none font-bold text-ink" dir="ltr">
              {money(quote.subtotal)}
            </dd>
          </div>

          {quote.deposit ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <dt className="text-[13px] text-body/80">{t("rentalItem.quoteDeposit")}</dt>
              <dd className="text-[13px] font-semibold text-body" dir="ltr">
                {money(quote.deposit)}
              </dd>
            </div>
          ) : null}
        </dl>

        {quote.deposit ? (
          <p className="mt-3 text-[12.5px] leading-relaxed text-body/75">{t("rentalItem.quoteDepositNote")}</p>
        ) : null}

        <AddRentalToCartButton
          itemId={item.id}
          itemSlug={item.slug}
          title={item.title}
          period={period}
          quote={quote}
          image={item.media.find((media) => media.kind === "image")}
          labels={{
            add: t("rental.addBooking"),
            unavailable: t("rental.notAvailable"),
            added: t("rental.bookingAdded", { title: "{title}" }),
          }}
        />
      </div>
    );
  } else if (quote.unavailableReason === "unsupported-unit") {
    quoteView = (
      <div role="alert" className="rounded-2xl bg-accent-10 p-5 ring-1 ring-accent/30">
        <p className="font-heading text-[15px] font-semibold text-ink">{t("rentalItem.unsupportedTitle")}</p>
        <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-body">
          {t("rentalItem.unsupportedBody", {
            units: units.map((entry) => UNIT_LABEL[entry]).join(" · "),
          })}
        </p>
      </div>
    );
  } else if (quote.unavailableReason === "invalid-period") {
    quoteView = (
      <div role="alert" className="rounded-2xl bg-accent-10 p-5 ring-1 ring-accent/30">
        <p className="font-heading text-[15px] font-semibold text-ink">{t("rentalItem.invalidTitle")}</p>
        <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-body">{t("rentalItem.invalidBody")}</p>
      </div>
    );
  } else {
    /* TAKEN. Name the days that are short, then offer a window that is not. */
    quoteView = (
      <div className="rounded-2xl bg-primary-05 p-5 ring-1 ring-primary/15">
        <p className="font-heading text-[15px] font-semibold text-ink">{t("rentalItem.takenTitle")}</p>
        <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-body">{t("rentalItem.takenBody")}</p>

        {blockingDays.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {blockingDays.slice(0, 5).map((day) => (
              <li
                key={day.date}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-body"
              >
                {date(day.date)}
              </li>
            ))}
          </ul>
        ) : null}

        {alternative && alternativeHref ? (
          <div className="mt-5 border-t border-primary-20 pt-5">
            <p className="text-[13px] text-body">{t("rentalItem.takenSuggestion")}</p>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 font-heading text-[15px] font-semibold text-ink">
              <span>{date(alternative.from)}</span>
              <span aria-hidden="true" className="text-body/45">
                —
              </span>
              <span>{date(alternative.to)}</span>
            </p>
            <Link href={alternativeHref} className={buttonClasses({ className: "mt-4" })}>
              {t("rentalItem.takenAction")}
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-body/80">{t("rentalItem.takenNoWindow")}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("rental.title"), href: localePath(locale, "/rental") },
          { label: item.title },
        ]}
        eyebrow={itemCategories.map((entry) => entry.name).join(" · ") || t("rentalItem.eyebrow")}
        title={item.title}
        lead={item.summary}
        actions={
          <>
            {item.rating.count > 0 ? (
              <p className="inline-flex items-center gap-2 text-[14px] text-white/75" aria-label={ratingLabel}>
                <span className="text-accent">
                  <StarIcon size={16} />
                </span>
                <span className="font-heading text-lg font-bold text-white" dir="ltr">
                  {item.rating.average.toFixed(1)}
                </span>
                <span dir="ltr">{`(${number(item.rating.count)})`}</span>
              </p>
            ) : (
              <p className="text-[14px] text-white/60">{t("rentalItem.noReviews")}</p>
            )}
            {/* On a white pill: `.stock-signal` inks its word for a light
                surface, and the deep band would swallow it. */}
            <p className="rounded-full bg-white px-3.5 py-1.5">
              <span className="stock-signal" data-stock={heroSignal}>
                {SIGNAL_LABEL[heroSignal]}
              </span>
            </p>
          </>
        }
        aside={
          <div className="rounded-3xl bg-white p-4 text-ink shadow-lift">
            <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-canvas">
              <RentalMedia item={item} priority sizes="(min-width: 1024px) 440px, 100vw" glyphSize={64} />
            </div>

            <div className="px-2 pt-5">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[13px] text-body/75">{t("rentalItem.fromLabel")}</span>
                <span className="font-heading text-[1.9rem] leading-none font-bold text-ink" dir="ltr">
                  {money(cheapest.price)}
                </span>
                <span className="text-[14px] font-medium text-body/75">
                  {t("rentalItem.perUnitSuffix", { unit: UNIT_LABEL[cheapest.unit] })}
                </span>
              </p>
            </div>

            <dl className="mt-2 divide-y divide-line px-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3 py-3">
                  <dt className="flex w-36 shrink-0 items-center gap-2 text-[13px] text-body">
                    <span aria-hidden="true" className="text-primary">
                      {fact.icon}
                    </span>
                    {fact.label}
                  </dt>
                  <dd className="min-w-0 text-[14px] font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-2 grid gap-2.5 px-2 pb-2">
              <a href="#booking" className={buttonClasses({ size: "lg", className: "w-full" })}>
                {t("rentalItem.checkDates")}
              </a>
              <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline", className: "w-full" })}>
                {t("rentalItem.ctaAction")}
              </Link>
              <p className="mt-1 inline-flex items-center gap-2 text-[12.5px] leading-relaxed text-body/75">
                <span aria-hidden="true" className="text-primary">
                  <CalendarIcon size={14} />
                </span>
                {fleetIsOut && returnsOn
                  ? t("rentalItem.heroReturns", { date: date(returnsOn) })
                  : t("rentalItem.heroWindow", { count: number(HORIZON_DAYS) })}
              </p>
            </div>
          </div>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* WHEN YOU CAN HAVE IT                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section id="booking" tone="muted" labelledBy="item-booking" className="scroll-mt-28">
        <SectionHead id="item-booking" title={t("rentalItem.bookingTitle")} lead={t("rentalItem.bookingLead")} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-8">
          <BookingPanel
            basePath={bookingPath}
            today={today}
            lastBookableDate={lastBookableDate}
            units={units.map((entry) => ({ value: entry, label: UNIT_LABEL[entry] }))}
            defaults={{ from, to, unit, quantity }}
            maxQuantity={item.totalUnits}
            labels={{
              legend: t("rentalItem.formLegend"),
              from: t("rental.startDate"),
              to: t("rental.endDate"),
              unit: t("rental.billedPer"),
              quantity: t("rentalItem.formQuantity"),
              quantityHint: t("rentalItem.formQuantityHint", {
                count: number(item.totalUnits),
              }),
              submit: t("rental.checkAvailability"),
              submitting: t("rentalItem.formSubmitting"),
              reset: t("rentalItem.formReset"),
              staleTitle: t("rentalItem.staleTitle"),
              staleBody: t("rentalItem.staleBody"),
            }}
          >
            {quoteView}
          </BookingPanel>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8 lg:self-start">
            {/* THE FLEET IS OUT. Stated once, with the date it comes back,
                above a calendar that then shows the reader why. */}
            {fleetIsOut ? (
              <div className="mb-7 rounded-2xl bg-accent-10 p-5 ring-1 ring-accent/30">
                <p className="inline-flex items-center gap-2 font-heading text-[15px] font-semibold text-ink">
                  <span aria-hidden="true" className="text-accent-strong">
                    <ClockIcon size={16} />
                  </span>
                  {t("rentalItem.blockedTitle")}
                </p>
                <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-body">
                  {returnsOn
                    ? t("rentalItem.blockedBody", { date: date(returnsOn) })
                    : t("rentalItem.blockedBodyNoDate")}
                </p>
                <Link
                  href={localePath(locale, "/rental")}
                  className={buttonClasses({ variant: "outline", size: "sm", className: "mt-5" })}
                >
                  {t("rentalItem.blockedAction")}
                </Link>
              </div>
            ) : null}

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-heading text-[1.1rem] font-semibold text-ink">{t("rentalItem.availabilityTitle")}</h3>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-body">
                <span>{date(horizon[0].date)}</span>
                <span aria-hidden="true" className="text-body/45">
                  —
                </span>
                <span>{date(horizon[horizon.length - 1].date)}</span>
              </p>
            </div>

            <ul className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {horizon.map((day) => {
                const signal = daySignal(day.unitsAvailable, item.totalUnits);
                const selected =
                  period !== null && day.date >= period.range.from && day.date <= period.range.to;

                return (
                  <li
                    key={day.date}
                    className={`rounded-2xl border p-2.5 text-center transition-colors ${
                      selected ? "border-primary bg-primary-05" : "border-line bg-canvas"
                    }`}
                  >
                    <span aria-hidden="true">
                      <span className="block text-[11.5px] text-body/70">{weekday(day.date)}</span>
                      <span className="mt-0.5 block font-heading text-[17px] leading-tight font-bold text-ink" dir="ltr">
                        {number(Number(day.date.slice(8, 10)))}
                      </span>
                      <span className="mt-2 flex justify-center">
                        <span className="stock-signal" data-stock={signal}>
                          <span dir="ltr">{number(day.unitsAvailable)}</span>
                        </span>
                      </span>
                    </span>

                    {/* One sentence for a screen reader, instead of three
                        fragments read in a row. */}
                    <span className="sr-only">
                      {t("rentalItem.dayFree", {
                        date: date(day.date),
                        count: number(day.unitsAvailable),
                        total: number(item.totalUnits),
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 text-[12.5px] leading-relaxed text-body/75">{t("rentalItem.availabilityNote")}</p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* WHAT YOU ARE HIRING                                                */}
      {/* ------------------------------------------------------------------ */}
      <Section labelledBy="item-about">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <SectionHead id="item-about" eyebrow={t("rentalItem.eyebrow")} title={t("rentalItem.aboutTitle")} />
            <p className="mt-6 max-w-[66ch] text-[1.05rem] leading-[1.9] text-body">{item.description}</p>

            {sports.length > 0 ? (
              <>
                <h3 className="mt-10 font-heading text-[15px] font-semibold text-ink">{t("rentalItem.sportsTitle")}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <li key={sport.id}>
                      <Link
                        href={localePath(locale, `/sports/${sport.slug}`)}
                        className="inline-block rounded-full bg-primary-05 px-3 py-1.5 text-[13px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        {sport.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          {/* The rate card: the one thing the paragraph cannot say, and the
              reason a hire price needs two numbers rather than one. */}
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <h3 id="item-rates" className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
                  <ClockIcon size={14} />
                </span>
                {t("rentalItem.ratesTitle")}
              </h3>
              <ul aria-labelledby="item-rates" className="divide-y divide-line">
                {item.rates.map((rate) => (
                  <li key={rate.unit} className="flex items-baseline justify-between gap-3 py-3 first:pt-1 last:pb-0">
                    <span>
                      <span className="block text-[14px] font-semibold text-ink">{UNIT_LABEL[rate.unit]}</span>
                      <span className="mt-0.5 block text-[12.5px] text-body/75">
                        {t("rentalItem.ratesMin", { count: number(rate.minUnits) })}
                      </span>
                    </span>
                    <span className="font-heading text-[15px] font-bold text-ink" dir="ltr">
                      {money(rate.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
                  <PinIcon size={14} />
                </span>
                {t("rentalItem.depotTitle")}
              </h3>
              <p className="text-[14px] font-semibold text-ink" dir="auto">
                {item.location.name}
              </p>
              <p className="mt-0.5 text-[13px] text-body" dir="auto">
                {item.location.city}
              </p>
            </div>
          </aside>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* WHAT PEOPLE SAID                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Section tone="muted" labelledBy="item-reviews">
        <SectionHead id="item-reviews" title={t("reviews.title", { label: t("reviews.labelRentalItem") })} />

        {item.rating.count === 0 && reviews.items.length === 0 ? (
          <p className="mt-8 max-w-[48ch] text-[15px] text-body">{t("reviews.none")}</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            {/* The score and the writing are two different things: an item can
                carry many ratings and no written review. */}
            <div className="rounded-3xl bg-deep p-7 text-white">
              <p className="font-heading text-[3rem] leading-none font-bold text-white">
                <span dir="ltr">{item.rating.average.toFixed(1)}</span>
              </p>
              <p className="mt-3 flex gap-0.5 text-accent" aria-label={ratingLabel}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} aria-hidden="true" className={index < Math.round(item.rating.average) ? "" : "text-white/20"}>
                    <StarIcon size={16} />
                  </span>
                ))}
              </p>
              <p className="mt-6">
                <span className="block font-heading text-[1.4rem] leading-none font-bold">
                  <span dir="ltr">{number(item.rating.count)}</span>
                </span>
                <span className="mt-1.5 block text-[12.5px] text-white/60">{t("rentalItem.ratingsLabel")}</span>
              </p>
            </div>

            {reviews.items.length === 0 ? (
              <div className="flex items-center rounded-3xl border border-line bg-surface px-6 py-10">
                <p className="max-w-[46ch] text-[15px] leading-relaxed text-body">{t("rentalItem.reviewsNoneWritten")}</p>
              </div>
            ) : (
              <Reveal stagger as="ul" className="grid gap-4 sm:grid-cols-2">
                {reviews.items.map((review) => (
                  <li key={review.id} className="flex">
                    <article className="flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                      <p className="text-accent" aria-label={t("reviews.outOf", { rating: number(review.rating) })}>
                        <span className="flex gap-0.5" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map((index) => (
                            <span key={index} className={index < review.rating ? "" : "text-ink/15"}>
                              <StarIcon size={14} />
                            </span>
                          ))}
                        </span>
                      </p>
                      {/* Written by a renter, so rendered exactly as submitted
                          with the direction detected rather than assumed. */}
                      {review.title ? (
                        <h3 className="mt-4 text-[16px]" dir="auto">
                          {review.title}
                        </h3>
                      ) : null}
                      <p className="mt-2 text-[14px] leading-relaxed text-body" dir="auto">
                        {review.body}
                      </p>
                      <p className="mt-auto pt-5 text-[13px] font-semibold text-ink" dir="auto">
                        {review.author.displayName}
                      </p>
                    </article>
                  </li>
                ))}
              </Reveal>
            )}
          </div>
        )}
      </Section>

      {/* No bottom padding: the help band below is white too and brings its own. */}
      <Section labelledBy={related.length > 0 ? "item-related" : "item-cta"} className="pb-0 sm:pb-0 lg:pb-0">
        {related.length > 0 ? (
          <>
            <SectionHead
              id="item-related"
              title={t("rentalItem.relatedTitle")}
              actions={
                <Link href={localePath(locale, "/rental")} className={buttonClasses({ variant: "outline" })}>
                  {t("rentalItem.relatedAll")}
                </Link>
              }
            />
            <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry, index) => (
                <li key={entry.id} className="flex">
                  <RentalCard
                    item={entry}
                    signal={readAvailabilitySignal(relatedAvailability[index], relatedWindow, entry.totalUnits)}
                    locale={locale}
                    t={t}
                  />
                </li>
              ))}
            </Reveal>
          </>
        ) : null}

        <RentalDesk
          id="item-cta"
          title={t("rentalItem.ctaTitle")}
          body={t("rentalItem.ctaBody")}
          action={t("rentalItem.ctaAction")}
          href={localePath(locale, "/contact")}
          flush={related.length === 0}
        />
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
