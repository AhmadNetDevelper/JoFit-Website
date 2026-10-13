import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import {
  parseRentalListQuery,
  readAvailabilitySignal,
  RENTAL_SORT_KEYS,
  rentalService,
} from "@/features/rental";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import {
  addDays,
  buildMetadata,
  buildQueryString,
  isValidDateRange,
  readNumberParam,
  readParam,
  readParams,
  resolveSearchParams,
  toIsoDate,
} from "@/lib";

import { HelpBand } from "../_components/help-band";
import { RentalCard } from "./_components/rental-card";
import { RentalFilters } from "./_components/rental-filters";

export async function generateMetadata({ params }: PageProps<"/[locale]/rental">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/rental",
    title: t("rental.title"),
    description: t("rental.description"),
  });
}

/** How far ahead the page will look for the next window that fits. */
const HORIZON_DAYS = 20;

/** The window a visitor who has not chosen one is shown: a long weekend. */
const DEFAULT_HIRE_DAYS = 2;

/**
 * THE RENTAL INDEX — the formal listing recipe, as the course catalogue has it.
 *
 *   PageHero   the fleet, stated; four figures COUNTED from the fleet
 *   rail       a white panel rising over the hero's foot: WHEN first, then
 *              search, category, sport, depot, sort — links and one GET form
 *   grid       rental cards on the canvas, each answering "is it free then"
 *   how        the four steps of a hire on the deep band, with numbered seals,
 *              closing on the group-hire quote
 *   help       the closing band
 *
 * (Rental left the site menu at the owner's request; the pages remain.)
 *
 * WHAT MAKES IT A RENTAL PAGE AND NOT A SECOND SHOP is that a date window runs
 * through all of it. Renting is a claim on a physical unit over a period, so
 * the first control on the page is "when", every card answers "is it free
 * THEN", and an item that is not free names the date it opens instead of going
 * quiet.
 *
 * The window is real even before anybody chooses one: with no dates in the URL
 * the page assumes the next three days, says so in words under the pickers, and
 * does NOT filter by it — so the grid still shows the fleet, with honest
 * signals, rather than hiding what is busy this weekend. Filtering only starts
 * once the visitor has actually asked for dates.
 *
 * Everything renders on the server. The filters are links, the window is a GET
 * form, and this route ships no JavaScript of its own beyond the scroll reveal.
 */
export default async function RentalPage({ params, searchParams }: PageProps<"/[locale]/rental">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const query = parseRentalListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;

  /* `query.sort` is typed `string` because `ListQuery` is shared across every
     domain and each one has its own sort vocabulary. Narrowing it against the
     rental keys here is what lets the rail's pressed states be exhaustive. */
  const sort = RENTAL_SORT_KEYS.find((key) => key === query.sort);

  const today = toIsoDate(new Date());
  const chosen =
    query.availableBetween && isValidDateRange(query.availableBetween)
      ? query.availableBetween
      : undefined;
  const hireWindow = chosen ?? { from: today, to: addDays(today, DEFAULT_HIRE_DAYS) };

  const state = {
    search: readParam(search, "q"),
    sort,
    categorySlugs: readParams(search, "category"),
    sportSlugs: readParams(search, "sport"),
    locationIds: readParams(search, "location"),
    datesChosen: chosen !== undefined,
  };

  const [result, everything, categories, sports] = await Promise.all([
    rentalService.listItems({ ...query, sort, page, pageSize: 9 }),
    /*
     * The unfiltered fleet, for the hero's figures. A figure that moved every
     * time somebody ticked a category would be reporting the filter rather
     * than the fleet — the same reasoning as the course catalogue's hero.
     */
    rentalService.listItems({ locale, pageSize: 200 }),
    rentalService.listCategories(locale),
    sportsService.list({ locale }),
  ]);

  /*
   * ONE CALENDAR PER ITEM, asked for once and read twice — by the hero's
   * "free these dates" figure and by every card's signal.
   *
   * The horizon runs three weeks past the window's start rather than stopping
   * at its end, because "booked out" and "free from the 8th" are different
   * answers and only the longer range can tell them apart. The reduction from
   * a calendar to a signal is `readAvailabilitySignal` in the feature layer;
   * no component does arithmetic on days.
   */
  const horizon = { from: hireWindow.from, to: addDays(hireWindow.from, HORIZON_DAYS) };
  const calendars = await Promise.all(
    everything.items.map((item) => rentalService.getAvailability(item.id, horizon)),
  );

  const signals = new Map(
    everything.items.map((item, index) => [
      item.id,
      readAvailabilitySignal(calendars[index], hireWindow, item.totalUnits),
    ]),
  );

  /* One entry per collection point, in fleet order. Derived from the items the
     service already resolved, so the names are localized rather than looked up
     from a second English table. */
  const depots = [
    ...new Map(everything.items.map((item) => [item.location.id, item.location])).values(),
  ];

  /* Only sports something is actually hired for: a filter chip that can only
     ever return nothing is a dead end with a label on it. */
  const rentedSportIds = new Set(everything.items.flatMap((item) => item.sportIds));
  const filterSports = sports.filter((sport) => rentedSportIds.has(sport.id));

  /* The rail lists the trunks; the branches (road, trail) belong to the
     category pages, where there is room to explain the difference. */
  const topCategories = categories.filter((category) => category.parentId === null);

  const fleetUnits = everything.items.reduce((sum, item) => sum + item.totalUnits, 0);
  const freeNow = everything.items.filter((item) => {
    const signal = signals.get(item.id);
    return signal?.status === "in-stock" || signal?.status === "low-stock";
  }).length;

  const steps = [
    { title: t("rental.howStep1"), body: t("rental.howStep1Body") },
    { title: t("rental.howStep2"), body: t("rental.howStep2Body") },
    { title: t("rental.howStep3"), body: t("rental.howStep3Body") },
    { title: t("rental.howStep4"), body: t("rental.howStep4Body") },
  ];

  const pageLink = (target: number) =>
    `${localePath(locale, "/rental")}${buildQueryString({
      q: state.search,
      sort: state.sort,
      category: [...state.categorySlugs],
      sport: [...state.sportSlugs],
      location: [...state.locationIds],
      from: chosen?.from,
      to: chosen?.to,
      page: target > 1 ? target : undefined,
    })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("rental.title") }]}
        eyebrow={t("rental.eyebrow")}
        title={t("rental.heroTitle")}
        lead={t("rental.heroLead")}
      >
        <HeroFacts
          items={[
            { label: t("rental.statItems"), value: <span dir="ltr">{number(everything.meta.totalItems)}</span> },
            { label: t("rental.statUnits"), value: <span dir="ltr">{number(fleetUnits)}</span> },
            { label: t("rental.statFree"), value: <span dir="ltr">{number(freeNow)}</span> },
            { label: t("rental.statDepots"), value: <span dir="ltr">{number(depots.length)}</span> },
          ]}
        />
      </PageHero>

      <div data-band>
        <RentalFilters
          locale={locale}
          t={t}
          state={state}
          window={hireWindow}
          today={today}
          categories={topCategories}
          sports={filterSports}
          depots={depots}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{t("rental.title")}</h2>
        {result.items.length === 0 ? (
          /* An empty state is an invitation, not a shrug: it says what to try
             and hands over the control that does it. */
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="font-heading text-[1.4rem] font-bold text-ink">{t("rental.empty")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("rental.emptyBody")}</p>
            <Link href={localePath(locale, "/rental")} className={buttonClasses({ className: "mt-8" })}>
              {t("rental.filterClear")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((item, index) => {
                const signal = signals.get(item.id);
                return signal ? (
                  <li key={item.id} className="flex">
                    <RentalCard item={item} signal={signal} locale={locale} t={t} priority={index < 3} />
                  </li>
                ) : null;
              })}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={t("rental.title")} className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: result.meta.totalPages }, (_, index) => index + 1).map((target) => {
                  const current = target === result.meta.page;
                  return (
                    <Link
                      key={target}
                      href={pageLink(target)}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex size-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${
                        current
                          ? "border-primary bg-primary text-on-primary"
                          : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
                      }`}
                    >
                      <span dir="ltr">{number(target)}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </>
        )}
      </Section>

      {/*
        HOW RENTING WORKS — numbered, because it genuinely is a sequence: you
        cannot collect a board before the days are yours. The same seals on a
        gold line as the path to certification, so the site tells a process one
        way. It closes on the group-hire quote, the desk's one real action.
      */}
      <Section tone="deep" labelledBy="rental-how">
        <SectionHead id="rental-how" tone="dark" align="center" title={t("rental.howTitle")} lead={t("rental.howLead")} />

        <Reveal stagger as="ol" className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute start-16 top-7 hidden h-px w-[calc(100%-3rem)] bg-linear-to-r from-accent/60 to-accent/10 lg:block rtl:bg-linear-to-l"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="relative grid size-14 place-items-center rounded-full bg-deep-2 font-heading text-lg font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-deep"
                dir="ltr"
              >
                {number(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-[1.2rem] text-white">{step.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/65">{step.body}</p>
            </li>
          ))}
        </Reveal>

        <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center gap-5 border-t border-white/10 pt-10 text-center">
          <div>
            <p id="rental-cta" className="font-heading text-[1.35rem] leading-snug font-semibold text-white">
              {t("rental.ctaTitle")}
            </p>
            <p className="mx-auto mt-2 max-w-[60ch] text-[15px] leading-relaxed text-white/65">{t("rental.ctaBody")}</p>
          </div>
          <Link
            href={localePath(locale, "/contact")}
            aria-describedby="rental-cta"
            className={buttonClasses({ variant: "gold", size: "lg" })}
          >
            {t("rental.ctaAction")}
          </Link>
        </div>
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
