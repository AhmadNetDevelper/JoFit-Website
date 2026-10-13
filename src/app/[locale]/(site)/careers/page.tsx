import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { careersService } from "@/features/careers";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, readNumberParam, resolveSearchParams } from "@/lib";

import { CertifyBand } from "./_components/certify-band";
import { EmployerBand } from "./_components/employer-band";
import { EmployerCard } from "./_components/employer-card";
import { JobCard } from "./_components/job-card";
import { boardQuery, JobFilters, readJobFilters } from "./_components/job-filters";
import { Pagination } from "./_components/pagination";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/careers",
    title: t("careers.board.metaTitle"),
    description: t("careers.board.metaDescription"),
  });
}

/** Two rows of three on a desktop — enough to scan, few enough to page. */
const PAGE_SIZE = 6;

/**
 * THE CAREERS BOARD — the fitness and sports sector's jobs, not JoFit's own,
 * framed as what JoFit is: a certification body keeping a register of
 * verified employers for the professionals it qualifies.
 *
 * The catalogue's band stack (the formal listing recipe), because it is the
 * same job: find the right one in a list.
 *
 *   PageHero        the promise, and four figures COUNTED from the board
 *   filter panel    rising over the hero's foot: the search, five facets with
 *                   live counts, the result line and the sort
 *   the job grid    cards, then pages
 *   companies       who is hiring, each a link to the company
 *   employers       the deep band: the other half of the market, in 3 steps
 *   certify         the closing band — the certification behind the career
 *
 * Everything renders on the server. The filters are links and the search is a
 * GET form, so the board works — and every filtered view has an address —
 * before any JavaScript has loaded.
 */
export default async function CareersPage({ params, searchParams }: PageProps<"/[locale]/careers">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const state = readJobFilters(search);
  const page = Math.max(1, Math.trunc(readNumberParam(search, "page") ?? 1));

  const [result, stats, employers] = await Promise.all([
    careersService.listJobs({
      locale,
      search: state.search,
      sort: state.sort,
      page,
      pageSize: PAGE_SIZE,
      categorySlugs: state.categories,
      cityIds: state.cities,
      employmentTypes: state.types,
      workModes: state.modes,
      experienceLevels: state.levels,
    }),
    /* The unfiltered figures: a figure that moved with every filter would be
       reporting the filter, not the board. */
    careersService.getStats(),
    careersService.listEmployers({ locale, pageSize: 6 }),
  ]);

  const hiring = employers.items.filter((employer) => employer.openJobCount > 0);
  const base = localePath(locale, "/careers");

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("nav.careers") }]}
        eyebrow={t("careers.board.eyebrow")}
        title={t("careers.board.heroTitle")}
        lead={t("careers.board.heroLead")}
        actions={
          <>
            <a href="#careers-jobs" className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("careers.job.browse")}
            </a>
            <Link
              href={localePath(locale, "/careers/employers/join")}
              className={buttonClasses({ variant: "ghostDark", size: "lg" })}
            >
              {t("careers.board.ctaAction")}
            </Link>
          </>
        }
      >
        <HeroFacts
          items={[
            { label: t("careers.board.statJobs"), value: <span dir="ltr">{number(stats.openJobs)}</span> },
            { label: t("careers.board.statEmployers"), value: <span dir="ltr">{number(stats.employersHiring)}</span> },
            { label: t("careers.board.statVerified"), value: <span dir="ltr">{number(employers.meta.totalItems)}</span> },
            { label: t("careers.board.statCategories"), value: <span dir="ltr">{number(stats.categories)}</span> },
          ]}
        />
      </PageHero>

      <div data-band>
        <JobFilters
          locale={locale}
          t={t}
          state={state}
          facets={result.facets}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
          number={number}
        />
      </div>

      <Section
        id="careers-jobs"
        tone="muted"
        labelledBy="careers-jobs-heading"
        className="scroll-mt-6 pt-10 sm:pt-12 lg:pt-14"
      >
        <h2 id="careers-jobs-heading" className="sr-only">
          {t("careers.board.listLabel")}
        </h2>
        {result.items.length === 0 ? (
          /* An empty state is an invitation, not a shrug: it says what to try
             and hands over the control that does it. */
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="font-heading text-[1.4rem] font-bold text-ink">{t("careers.board.emptyTitle")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("careers.board.emptyBody")}</p>
            <Link href={base} className={buttonClasses({ className: "mt-8" })}>
              {t("careers.board.filterClear")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((job) => (
                <li key={job.id} className="flex min-w-0">
                  <JobCard job={job} locale={locale} t={t} />
                </li>
              ))}
            </Reveal>
            <Pagination
              meta={result.meta}
              hrefFor={(target) => `${base}${boardQuery(state, { page: target })}`}
              number={number}
              labels={{
                nav: t("careers.board.pages"),
                previous: t("careers.board.previous"),
                next: t("careers.board.next"),
              }}
            />
          </>
        )}
      </Section>

      {hiring.length > 0 ? (
        <Section labelledBy="careers-companies">
          <SectionHead
            id="careers-companies"
            eyebrow={t("careers.employers.eyebrow")}
            title={t("careers.board.companiesTitle")}
            lead={t("careers.board.companiesLead")}
            actions={
              <Link href={localePath(locale, "/careers/employers")} className={buttonClasses({ variant: "outline" })}>
                {t("careers.board.companiesAll")}
              </Link>
            }
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hiring.map((employer) => (
              <li key={employer.id} className="flex min-w-0">
                <EmployerCard employer={employer} locale={locale} t={t} number={number} />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <EmployerBand locale={locale} t={t} />
      <CertifyBand locale={locale} t={t} />
    </>
  );
}
