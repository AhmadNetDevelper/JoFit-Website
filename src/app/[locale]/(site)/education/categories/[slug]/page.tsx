import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon, buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import {
  COURSE_SORT_KEYS,
  educationService,
  parseCourseListQuery,
  type Course,
  type CourseCategory,
  type CourseLevel,
  type CourseSortKey,
} from "@/features/education";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import {
  breadcrumbJsonLd,
  buildQueryString,
  jsonLdScriptProps,
  metadataFromSeo,
  readNumberParam,
  readParam,
  resolveSearchParams,
} from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { CertificationPath } from "../../_components/certification-path";
import { CourseCard } from "../../_components/course-card";
import { CertificateIcon, SearchIcon } from "../../_components/icons";
import { CategoryRail } from "./_components/category-rail";

/**
 * Answered twice on purpose — here and in the page — because Next resolves
 * metadata and the component independently. Returning a `noIndex` document
 * rather than letting this throw is what keeps a mistyped slug out of the index
 * instead of serving it a category's worth of canonical tags.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/education/categories/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  const category = await educationService.getCategoryBySlug(slug, locale);
  if (!category) {
    return metadataFromSeo(undefined, {
      locale,
      title: t("notFound.title"),
      description: t("notFound.description"),
      noIndex: true,
    });
  }

  return metadataFromSeo(category.seo, {
    locale,
    title: category.name,
    description: category.description ?? t("courseCategory.leadFallback"),
    path: `/education/categories/${category.slug}`,
  });
}

/**
 * A COURSE CATEGORY — the catalogue narrowed to one track, in the formal design.
 *
 *   PageHero   the track's name and description, and four figures COUNTED from
 *              this track's courses (never typed in, and never a price: the
 *              fixtures' fees are placeholders)
 *   rail       the white panel rising over the hero's foot: a subject switcher,
 *              a level toggle and the sort — all links
 *   grid       the index's own course cards, so a course looks the same on the
 *              index and on its track
 *   junction   the other tracks, each with the number of courses on it — the
 *              bottom of a category is where a reader goes next door
 *   path       the four steps from enquiry to certificate
 *   help       the closing band
 *
 * THE SECOND ROW IS LEVEL, NOT A SUB-CATEGORY. Course categories are flat —
 * there is no `parentId` to walk. The axis that divides a course shelf is who
 * it is for, so the rail offers one level at a time.
 *
 * Everything renders on the server. Every control is a link; this route ships
 * no JavaScript of its own beyond the scroll reveal.
 */
export default async function CourseCategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/education/categories/[slug]">) {
  const [{ locale: raw, slug }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const category = await educationService.getCategoryBySlug(slug, locale);
  if (!category) notFound();

  /* The index's own parser, not a second one. It narrows every facet against
     the domain's vocabulary, so a hand-edited `?level=olympian` filters
     nothing instead of quietly returning an empty page. */
  const query = parseCourseListQuery(search, locale);
  const page = readNumberParam(search, "page") ?? 1;
  const sort = COURSE_SORT_KEYS.find((key) => key === query.sort);
  const searchTerm = readParam(search, "q");

  /* One level at a time on this rail. */
  const level = query.levels?.[0];

  const [result, catalogue, categories] = await Promise.all([
    /* On this route the path IS the filter, and it overrides whatever
       `category` params happen to be in the URL. */
    educationService.listCourses({
      ...query,
      categorySlugs: [category.slug],
      levels: level ? [level] : undefined,
      page,
      pageSize: 9,
    }),
    /* The whole academy, unfiltered, once: the hero's figures describe this
       track rather than the current query, and the junction counts the other
       tracks. Neither may move when somebody re-sorts. */
    educationService.listCourses({ locale, pageSize: 200 }),
    educationService.listCategories(locale),
  ]);

  const countIn = (entry: CourseCategory) =>
    catalogue.items.filter((course) => course.categoryIds.includes(entry.id)).length;

  /* The figures, all of them about THIS track. */
  const shelf: readonly Course[] = catalogue.items.filter((course) => course.categoryIds.includes(category.id));
  const rated = shelf.filter((course) => course.rating.count > 0);
  const averageRating = rated.reduce((sum, course) => sum + course.rating.average, 0) / (rated.length || 1);
  const tuitionHours = shelf.reduce((sum, course) => sum + course.durationHours, 0);
  const certified = shelf.filter((course) => course.certification).length;

  /* An em dash, not a zero: a shelf with no ratings has no average, and
     printing `0.0` would state something untrue. */
  const facts = [
    { label: t("courseCategory.statCourses"), value: <span dir="ltr">{number(shelf.length)}</span> },
    { label: t("courseCategory.statHours"), value: <span dir="ltr">{number(tuitionHours)}</span> },
    {
      label: t("courseCategory.statRating"),
      value: <span dir="ltr">{rated.length > 0 ? averageRating.toFixed(1) : "—"}</span>,
    },
    { label: t("courseCategory.statCertified"), value: <span dir="ltr">{number(certified)}</span> },
  ];

  /* Links. None of them carries `page`. */
  const base = localePath(locale, `/education/categories/${category.slug}`);
  const categoryHref = (entry: CourseCategory) =>
    `${localePath(locale, `/education/categories/${entry.slug}`)}${buildQueryString({ sort })}`;
  const levelHref = (next: CourseLevel | undefined) => `${base}${buildQueryString({ q: searchTerm, level: next, sort })}`;
  const sortHref = (next: CourseSortKey | undefined) => `${base}${buildQueryString({ q: searchTerm, level, sort: next })}`;
  const pageHref = (target: number) =>
    `${base}${buildQueryString({ q: searchTerm, level, sort, page: target > 1 ? target : undefined })}`;

  const elsewhere = categories.filter((entry) => entry.id !== category.id);

  /* Why the grid is empty decides what the empty state offers to undo: a
     narrowed level or a search can be dropped; an unstocked track cannot. */
  const narrowed = Boolean(level || searchTerm);

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("education.title"), path: "/education" },
            { name: category.name, path: `/education/categories/${category.slug}` },
          ]),
        )}
      />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("education.title"), href: localePath(locale, "/education") },
          { label: category.name },
        ]}
        eyebrow={t("courseCategory.eyebrow")}
        title={category.name}
        lead={category.description ?? t("courseCategory.leadFallback")}
        actions={
          <>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("courseCategory.ctaAction")}
            </Link>
            <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("courseCategory.allCourses")}
            </Link>
          </>
        }
      >
        <HeroFacts items={facts} />
      </PageHero>

      <div data-band>
        <CategoryRail
          locale={locale}
          t={t}
          category={category}
          categories={categories}
          level={level}
          sort={sort}
          categoryHref={categoryHref}
          levelHref={levelHref}
          sortHref={sortHref}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{category.name}</h2>
        {result.items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <span
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
            >
              <SearchIcon size={22} />
            </span>
            <p className="mt-5 font-heading text-[1.4rem] font-bold text-ink">{t("education.emptyCategory")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">
              {narrowed ? t("courseCategory.emptyFiltered") : t("courseCategory.emptyBody")}
            </p>
            <Link href={narrowed ? base : localePath(locale, "/education")} className={buttonClasses({ className: "mt-8" })}>
              {narrowed ? t("courseCategory.filterClear") : t("courseCategory.allCourses")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((course, index) => (
                <li key={course.id} className="flex">
                  <CourseCard course={course} locale={locale} t={t} priority={index < 3} coverLabel={category.name} />
                </li>
              ))}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={category.name} className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: result.meta.totalPages }, (_, index) => index + 1).map((target) => {
                  const current = target === result.meta.page;
                  return (
                    <Link
                      key={target}
                      href={pageHref(target)}
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

      {elsewhere.length > 0 ? (
        <Section labelledBy="course-category-more">
          <SectionHead
            id="course-category-more"
            eyebrow={t("courseCategory.moreEyebrow")}
            title={t("courseCategory.moreTitle")}
            lead={t("courseCategory.moreLead")}
          />
          {/* A figure over a BARE NOUN: "{n} دورات" is only grammatical for some
              values of n, and a label under the figure sidesteps Arabic plural
              agreement entirely. */}
          <Reveal
            stagger
            as="ul"
            className={`mt-12 grid gap-6 md:grid-cols-2 ${elsewhere.length >= 3 ? "lg:grid-cols-3" : ""}`}
          >
            {elsewhere.map((entry) => (
              <li key={entry.id} className="flex">
                <article className="group relative flex w-full items-start gap-5 rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:p-7">
                  <span className="flex w-20 shrink-0 flex-col items-center text-center">
                    <span
                      className="grid size-16 place-items-center rounded-full bg-deep font-heading text-2xl font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-surface"
                      dir="ltr"
                    >
                      {number(countIn(entry))}
                    </span>
                    <span className="mt-3 text-[12px] leading-5 text-body/70">{t("courseCategory.coursesLabel")}</span>
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col self-stretch">
                    <h3 className="text-[1.15rem] leading-snug">
                      <Link
                        href={categoryHref(entry)}
                        className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
                      >
                        {entry.name}
                      </Link>
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-body">
                      {entry.description ?? t("courseCategory.leadFallback")}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[14px] font-semibold text-primary">
                      <span className="text-accent-strong">
                        <CertificateIcon size={15} />
                      </span>
                      {t("courseCategory.browseTrack")}
                      <ArrowIcon size={14} />
                    </span>
                  </span>
                </article>
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <CertificationPath locale={locale} t={t} />
      <HelpBand locale={locale} topic="courses" />
    </>
  );
}
