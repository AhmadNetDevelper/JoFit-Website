import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section } from "@/components/ui";
import {
  COURSE_SORT_KEYS,
  educationService,
  parseCourseListQuery,
  type CourseFormat,
  type CourseLevel,
} from "@/features/education";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, readParams, resolveSearchParams } from "@/lib";

import { HelpBand } from "../_components/help-band";
import { CertificationPath } from "./_components/certification-path";
import { CourseCard } from "./_components/course-card";
import { CourseFilters } from "./_components/course-filters";

export async function generateMetadata({ params }: PageProps<"/[locale]/education">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/education",
    title: t("education.title"),
    description: t("education.description"),
  });
}

/**
 * THE COURSE CATALOGUE — the formal redesign's listing page, and the model for
 * every other listing on the site (see the `jofit-design` skill's page recipe).
 *
 *   PageHero     the agency, stated first; four figures COUNTED from the
 *                catalogue (never typed in)
 *   filters      a white panel rising over the hero's foot: search, programme,
 *                format, level, sort — all links and one GET form
 *   grid         certificate-cover course cards, no prices (the fixtures' fees
 *                are placeholders; fees are given on enquiry)
 *   path         the four steps from enquiry to certificate, on the deep band
 *   help         the closing band
 *
 * Everything renders on the server; this route ships no JavaScript of its own
 * beyond the scroll reveal.
 */
export default async function EducationPage({
  params,
  searchParams,
}: PageProps<"/[locale]/education">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const query = parseCourseListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;
  const sort = COURSE_SORT_KEYS.find((key) => key === query.sort);

  const state = {
    search: readParam(search, "q"),
    sort,
    categorySlugs: readParams(search, "category"),
    formats: (query.formats ?? []) as readonly CourseFormat[],
    levels: (query.levels ?? []) as readonly CourseLevel[],
  };

  const [result, everything, categories] = await Promise.all([
    educationService.listCourses({ ...query, page, pageSize: 9 }),
    /* The whole catalogue, for the hero's figures: a figure that moved with
       every filter would be reporting the filter, not the academy. */
    educationService.listCourses({ locale, pageSize: 200 }),
    educationService.listCategories(locale),
  ]);

  const countIn = (id: string) => everything.items.filter((course) => course.categoryIds.includes(id)).length;
  const categoryName = (id?: string) => categories.find((category) => category.id === id)?.name;

  const pageLink = (target: number) =>
    `${localePath(locale, "/education")}${buildQueryString({
      q: state.search,
      sort: state.sort,
      category: [...state.categorySlugs],
      format: [...state.formats],
      level: [...state.levels],
      page: target > 1 ? target : undefined,
    })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("education.title") }]}
        eyebrow={t("education.eyebrow")}
        title={t("education.heroTitle")}
        lead={t("education.heroLead")}
        actions={
          <>
            <Link href={localePath(locale, "/specialisations")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("education.heroAction")}
            </Link>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("education.heroContact")}
            </Link>
          </>
        }
      >
        <HeroFacts
          items={[
            { label: t("education.statCourses"), value: <span dir="ltr">{number(everything.meta.totalItems)}</span> },
            { label: t("education.statCertifications"), value: <span dir="ltr">{number(countIn("ccat-certifications"))}</span> },
            { label: t("education.statSpecialised"), value: <span dir="ltr">{number(countIn("ccat-specialised"))}</span> },
            { label: t("education.statCpd"), value: <span dir="ltr">{number(countIn("ccat-cpd"))}</span> },
          ]}
        />
      </PageHero>

      <div data-band>
        <CourseFilters
          locale={locale}
          t={t}
          state={state}
          categories={categories}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{t("education.catalogue")}</h2>
        {result.items.length === 0 ? (
          /* An empty state is an invitation, not a shrug: it says what to try
             and hands over the control that does it. */
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="text-[1.4rem] font-heading font-bold text-ink">{t("education.empty")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("education.emptyBody")}</p>
            <Link href={localePath(locale, "/education")} className={buttonClasses({ className: "mt-8" })}>
              {t("education.filterClear")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((course, index) => (
                <li key={course.id} className="flex">
                  <CourseCard
                    course={course}
                    locale={locale}
                    t={t}
                    priority={index < 3}
                    coverLabel={categoryName(course.categoryIds[0])}
                  />
                </li>
              ))}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={t("education.catalogue")} className="mt-12 flex items-center justify-center gap-2">
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

      <CertificationPath locale={locale} t={t} />
      <HelpBand locale={locale} topic="courses" />
    </>
  );
}
