import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { coachesService } from "@/features/coaches";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, readParams, resolveSearchParams } from "@/lib";

import { HelpBand } from "../_components/help-band";
import { CoachCard } from "./_components/coach-card";
import { CoachFilters } from "./_components/coach-filters";

export async function generateMetadata({ params }: PageProps<"/[locale]/coaches">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/coaches",
    title: t("coaches.title"),
    description: t("coaches.description"),
  });
}

/**
 * THE COACHES INDEX — the formal listing recipe.
 *
 *   PageHero     what the roster is, with four figures COUNTED from it
 *   filters      the white panel rising over the hero's foot: search, sport,
 *                specialisation, online, sort — all links and one GET form
 *   grid         round-portrait coach cards on the canvas
 *   how          the four booking steps, on the deep band, as numbered seals
 *   help         the closing band
 *
 * Everything on it renders on the server. The filters are links, the search is
 * a GET form, and the only JavaScript this route ships is the scroll reveal
 * (the booking wizard is on a profile).
 */
export default async function CoachesPage({ params, searchParams }: PageProps<"/[locale]/coaches">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const state = {
    search: readParam(search, "q"),
    sort: readParam(search, "sort"),
    sportSlugs: readParams(search, "sport"),
    specialisationIds: readParams(search, "specialization"),
    remoteOnly: readParam(search, "remote") === "1",
  };
  const page = readNumberParam(search, "page") ?? 1;

  const [result, everyone, specialisations, sports] = await Promise.all([
    coachesService.listCoaches({
      locale,
      search: state.search,
      sort: state.sort,
      page,
      pageSize: 8,
      sportSlugs: state.sportSlugs,
      specializations: state.specialisationIds,
      remoteOnly: state.remoteOnly,
    }),
    /*
     * The unfiltered set, for the hero's figures. A figure that moved every
     * time someone ticked a filter would be reporting the filter, not the
     * roster — and "average rating 5.0" under a single result is a lie the
     * page tells itself.
     */
    coachesService.listCoaches({ locale, pageSize: 100 }),
    coachesService.listSpecializations(locale),
    sportsService.list({ locale }),
  ]);

  /* Only sports somebody actually coaches: a filter chip that can only ever
     return nothing is a dead end with a label on it. */
  const coachedSportIds = new Set(everyone.items.flatMap((coach) => coach.sportIds));
  const filterSports = sports.filter((sport) => coachedSportIds.has(sport.id));

  const averageRating =
    everyone.items.reduce((sum, coach) => sum + coach.rating.average, 0) / (everyone.items.length || 1);
  const totalSessions = everyone.items.reduce((sum, coach) => sum + coach.completedSessions, 0);

  const steps = [
    { title: t("coaches.howStep1"), body: t("coaches.howStep1Body") },
    { title: t("coaches.howStep2"), body: t("coaches.howStep2Body") },
    { title: t("coaches.howStep3"), body: t("coaches.howStep3Body") },
    { title: t("coaches.howStep4"), body: t("coaches.howStep4Body") },
  ];

  const pageLink = (target: number) =>
    `${localePath(locale, "/coaches")}${buildQueryString({
      q: state.search,
      sort: state.sort,
      sport: [...state.sportSlugs],
      specialization: [...state.specialisationIds],
      remote: state.remoteOnly ? "1" : undefined,
      page: target > 1 ? target : undefined,
    })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("coaches.title") }]}
        eyebrow={t("coaches.eyebrow")}
        title={t("coaches.heroTitle")}
        lead={t("coaches.heroLead")}
        actions={
          <Link href={localePath(locale, "/coaches/join")} className={buttonClasses({ variant: "ghostDark" })}>
            {t("coaches.joinAction")}
          </Link>
        }
      >
        <HeroFacts
          items={[
            { label: t("coaches.statCoaches"), value: <span dir="ltr">{number(everyone.meta.totalItems)}</span> },
            { label: t("coaches.statSpecialisations"), value: <span dir="ltr">{number(specialisations.length)}</span> },
            { label: t("coaches.statRating"), value: <span dir="ltr">{averageRating.toFixed(1)}</span> },
            {
              label: t("coaches.statSessions"),
              value: <span dir="ltr">{number(Math.round(totalSessions / 100) * 100)}</span>,
            },
          ]}
        />
      </PageHero>

      <div data-band>
        <CoachFilters
          locale={locale}
          t={t}
          state={state}
          sports={filterSports}
          specialisations={specialisations}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{t("coaches.title")}</h2>
        {result.items.length === 0 ? (
          /* An empty state is an invitation, not a shrug: it says what to try
             and hands over the control that does it. */
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="font-heading text-[1.4rem] font-bold text-ink">{t("coaches.empty")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("coaches.emptyBody")}</p>
            <Link href={localePath(locale, "/coaches")} className={buttonClasses({ className: "mt-8" })}>
              {t("coaches.filterClear")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {result.items.map((coach, index) => (
                <li key={coach.id} className="flex">
                  <CoachCard coach={coach} locale={locale} t={t} priority={index < 3} />
                </li>
              ))}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={t("coaches.title")} className="mt-12 flex items-center justify-center gap-2">
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

      {/* HOW BOOKING WORKS — numbered, because it genuinely is a sequence: you
          cannot pick a time before you have picked a coach. Told the way the
          catalogue tells the path to a certificate, on the one deep band. */}
      <Section tone="deep" labelledBy="coaches-how">
        <SectionHead
          id="coaches-how"
          tone="dark"
          align="center"
          eyebrow={t("coaches.howEyebrow")}
          title={t("coaches.howTitle")}
          lead={t("coaches.howLead")}
        />
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
      </Section>

      <HelpBand locale={locale} topic="coaches" />
    </>
  );
}
