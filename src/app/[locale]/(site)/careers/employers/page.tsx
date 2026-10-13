import Link from "next/link";

import { buttonClasses, HeroFacts, inputClasses, PageHero, Reveal, Section } from "@/components/ui";
import { careersService } from "@/features/careers";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, resolveSearchParams } from "@/lib";

import { CertifyBand } from "../_components/certify-band";
import { EmployerBand } from "../_components/employer-band";
import { EmployerCard } from "../_components/employer-card";
import { SearchIcon } from "../_components/icons";
import { Pagination } from "../_components/pagination";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers/employers">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/careers/employers",
    title: t("careers.employers.metaTitle"),
    description: t("careers.employers.metaDescription"),
  });
}

const PAGE_SIZE = 9;

/**
 * THE EMPLOYERS DIRECTORY — every verified company on the board, the ones with
 * open jobs first: a register, the way a certification body keeps one. Search
 * is a GET form and the pages are links, so every view has an address.
 *
 *   PageHero       what the list is, and four figures COUNTED from the board
 *   search panel   rising over the hero's foot, with the result line
 *   the grid       one card per company, its open jobs as the figure
 *   employers      the deep band: the way in for a company not here yet
 *   certify        the closing band
 */
export default async function EmployersPage({ params, searchParams }: PageProps<"/[locale]/careers/employers">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const query = readParam(search, "q")?.trim() || undefined;
  const page = Math.max(1, Math.trunc(readNumberParam(search, "page") ?? 1));
  const [result, everyone, stats] = await Promise.all([
    careersService.listEmployers({ locale, search: query, page, pageSize: PAGE_SIZE }),
    /* The whole register, for the hero's figure: a count that moved with the
       search would be reporting the search, not the register. */
    query ? careersService.listEmployers({ locale, pageSize: 1 }) : null,
    careersService.getStats(),
  ]);
  const verified = (everyone ?? result).meta.totalItems;
  const base = localePath(locale, "/careers/employers");

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("nav.careers"), href: localePath(locale, "/careers") },
          { label: t("careers.employers.eyebrow") },
        ]}
        eyebrow={t("careers.employers.eyebrow")}
        title={t("careers.employers.heroTitle")}
        lead={t("careers.employers.heroLead")}
        actions={
          <>
            <Link href={localePath(locale, "/careers")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("careers.job.browse")}
            </Link>
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
            { label: t("careers.board.statVerified"), value: <span dir="ltr">{number(verified)}</span> },
            { label: t("careers.board.statEmployers"), value: <span dir="ltr">{number(stats.employersHiring)}</span> },
            { label: t("careers.board.statJobs"), value: <span dir="ltr">{number(stats.openJobs)}</span> },
            { label: t("careers.board.statCategories"), value: <span dir="ltr">{number(stats.categories)}</span> },
          ]}
        />
      </PageHero>

      {/* The search panel rises over the foot of the hero, as the board's does. */}
      <div data-band className="bg-canvas pb-2">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
            <form action={base} method="get" role="search" className="flex flex-wrap items-center gap-3">
              <label htmlFor="employer-search" className="sr-only">
                {t("careers.employers.searchLabel")}
              </label>
              <div className="relative min-w-0 flex-1 basis-60">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
                  <SearchIcon size={17} />
                </span>
                <input
                  id="employer-search"
                  type="search"
                  name="q"
                  dir="auto"
                  defaultValue={query ?? ""}
                  placeholder={t("careers.employers.searchPlaceholder")}
                  className={inputClasses("rounded-full ps-12")}
                />
              </div>
              <button type="submit" className={buttonClasses({ size: "lg", className: "h-12 max-sm:w-full" })}>
                {t("careers.board.searchSubmit")}
              </button>
            </form>
            <p id="employers-count" className="mt-5 border-t border-line pt-4 text-[13px] text-body" aria-live="polite">
              {t("careers.employers.count", { total: number(result.meta.totalItems) })}
              {query ? (
                <>
                  {" · "}
                  <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                    {t("careers.employers.emptyAction")}
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <Section tone="muted" labelledBy="employers-heading" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 id="employers-heading" className="sr-only">
          {t("careers.employers.eyebrow")}
        </h2>
        {result.items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="font-heading text-[1.4rem] font-bold text-ink">{t("careers.employers.emptyTitle")}</p>
            <Link href={base} className={buttonClasses({ className: "mt-8" })}>
              {t("careers.employers.emptyAction")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((employer) => (
                <li key={employer.id} className="flex min-w-0">
                  <EmployerCard employer={employer} locale={locale} t={t} number={number} />
                </li>
              ))}
            </Reveal>
            <Pagination
              meta={result.meta}
              hrefFor={(target) => `${base}${buildQueryString({ q: query, page: target > 1 ? target : undefined })}`}
              number={number}
              labels={{ nav: t("careers.board.pages"), previous: t("careers.board.previous"), next: t("careers.board.next") }}
            />
          </>
        )}
      </Section>

      <EmployerBand locale={locale} t={t} />
      <CertifyBand locale={locale} t={t} />
    </>
  );
}
