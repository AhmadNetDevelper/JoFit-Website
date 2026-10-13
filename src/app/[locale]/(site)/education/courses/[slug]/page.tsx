import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ArrowIcon, buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { coachesService } from "@/features/coaches";
import { educationService, type Course } from "@/features/education";
import { reviewsService } from "@/features/reviews";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { absoluteUrl, breadcrumbJsonLd, courseJsonLd, jsonLdScriptProps, metadataFromSeo } from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { CourseCard } from "../../_components/course-card";
import { CourseCover } from "../../_components/course-cover";
import {
  BarsIcon,
  CalendarIcon,
  CertificateIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  LayersIcon,
  PinIcon,
  StarIcon,
  UsersIcon,
} from "./_components/icons";
import { COURSE_FORMAT_LABEL, COURSE_LEVEL_LABEL, COURSE_STATE_LABEL, COURSE_STATE_STOCK } from "./_components/labels";

export async function generateMetadata({ params }: PageProps<"/[locale]/education/courses/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const course = await educationService.getCourseBySlug(slug, locale);
  if (!course) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(course.seo, {
    locale,
    title: course.title,
    description: course.summary,
    path: `/education/courses/${course.slug}`,
    imageUrl: course.media.find((media) => media.kind === "image")?.url,
  });
}

/**
 * A COURSE — the formal redesign's detail page, and the model for every other
 * detail page on the site.
 *
 *   PageHero   what it is (category, title, summary) with the FACTS CARD in the
 *              end column: the certificate cover, the next intake and its state,
 *              the hours, the format and level, who issues the certificate, the
 *              fees ("given on enquiry"), and the one action
 *   body       what it qualifies you to do, the syllabus as numbered modules, who
 *              teaches it — beside a sticky aside with the certificate, the
 *              audience, the language and the venue (each only when known)
 *   gallery    the client's photographs of the programme, when there are two or
 *              more (the first is also the cover)
 *   reviews    the aggregate and what people wrote
 *   related    three courses to take next
 *   help       the closing band
 *
 * NO PRICE, anywhere — not on the page and not in the structured data. The
 * client has not supplied fees; the fixtures' figures are placeholders, and
 * publishing them to a search engine would be a claim about money somebody
 * might rely on. Fees are given on enquiry, which the facts card says.
 *
 * ENROLLING is `./enrol`: it reserves a pending place on the next cohort (the
 * academy confirms it), so this page stays static.
 */
export default async function CoursePage({ params }: PageProps<"/[locale]/education/courses/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number, date } = getFormatters(locale);

  const course = await educationService.getCourseBySlug(slug, locale);
  if (!course) notFound();

  const [instructors, reviews, categories, sports, catalogue] = await Promise.all([
    coachesService.getManyByIds(course.instructorIds, locale),
    reviewsService.list({ locale, target: { type: "course", id: course.id }, pageSize: 4 }),
    educationService.listCategories(locale),
    sportsService.getManyByIds(course.sportIds, locale),
    educationService.listCourses({ locale, sort: "rating-desc", pageSize: 24 }),
  ]);

  const courseCategories = categories.filter((entry) => course.categoryIds.includes(entry.id));
  const categoryName = (id?: string) => categories.find((entry) => entry.id === id)?.name;

  /* Same category first, rating order kept inside each group (`sort` is stable). */
  const sharesCategory = (entry: Course) => entry.categoryIds.some((id) => course.categoryIds.includes(id));
  const related = catalogue.items
    .filter((entry) => entry.id !== course.id)
    .sort((a, b) => Number(sharesCategory(b)) - Number(sharesCategory(a)))
    .slice(0, 3);

  const intake = course.nextIntake;
  const enrolHref =
    intake.state === "full"
      ? localePath(locale, "/contact")
      : localePath(locale, `/education/courses/${course.slug}/enrol`);

  const ratingLabel = `${t("course.ratingValue", { rating: number(course.rating.average) })}, ${t("course.ratingsCount", { count: number(course.rating.count) })}`;
  const canonical = absoluteUrl(localePath(locale, `/education/courses/${course.slug}`));

  const facts: readonly { icon: ReactNode; label: string; value: ReactNode }[] = [
    {
      icon: <CalendarIcon size={16} />,
      label: t("course.nextIntakeLabel"),
      value: (
        <span className="flex flex-col gap-1">
          <span>{date(intake.startsOn)}</span>
          <span className="stock-signal" data-stock={COURSE_STATE_STOCK[intake.state]}>
            {t(COURSE_STATE_LABEL[intake.state])}
          </span>
        </span>
      ),
    },
    {
      icon: <ClockIcon size={16} />,
      label: t("course.factHours"),
      value: <span dir="ltr">{number(course.durationHours)}</span>,
    },
    {
      icon: <LayersIcon size={16} />,
      label: t("course.factFormat"),
      value: `${t(COURSE_FORMAT_LABEL[course.format])} · ${t(COURSE_LEVEL_LABEL[course.level])}`,
    },
    {
      icon: <CertificateIcon size={16} />,
      label: t("course.factCertificate"),
      value: course.certification?.issuedBy ?? t("course.certificateOnEnquiry"),
    },
    {
      icon: <BarsIcon size={16} />,
      label: t("course.feesLabel"),
      value: t("course.feesOnEnquiry"),
    },
  ];

  /* When all that is known about a course is its one-line description, the long
     description is that same line; the hero already says it, so the overview
     does not say it again, and a heading with nothing under it is left out. */
  const ownDescription = course.description && course.description !== course.summary ? course.description : undefined;
  const hasOverview = Boolean(ownDescription) || course.outcomes.length > 0;
  const gallery = course.media.filter((entry) => entry.kind === "image");

  return (
    <>
      {/* The qualification as structured data — without an Offer: see above. */}
      <script
        {...jsonLdScriptProps(
          courseJsonLd({
            name: course.title,
            description: course.summary,
            url: canonical,
            hours: course.durationHours,
            mode: course.format,
            certificationName: course.certification?.name,
            certificationIssuer: course.certification?.issuedBy,
          }),
        )}
      />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("education.title"), path: "/education" },
            { name: course.title, path: `/education/courses/${course.slug}` },
          ]),
        )}
      />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("education.title"), href: localePath(locale, "/education") },
          { label: course.title },
        ]}
        eyebrow={courseCategories.map((entry) => entry.name).join(" · ") || undefined}
        title={course.title}
        lead={course.summary}
        actions={
          course.rating.count > 0 ? (
            <p className="inline-flex items-center gap-2 text-[14px] text-white/75" aria-label={ratingLabel}>
              <span className="text-accent">
                <StarIcon size={16} />
              </span>
              <span className="font-heading text-lg font-bold text-white" dir="ltr">
                {course.rating.average.toFixed(1)}
              </span>
              <span dir="ltr">{`(${number(course.rating.count)})`}</span>
            </p>
          ) : undefined
        }
        aside={
          <div className="rounded-3xl bg-white p-4 text-ink shadow-lift">
            <CourseCover course={course} label={categoryName(course.categoryIds[0])} priority />
            <dl className="mt-2 divide-y divide-line px-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3 py-3.5">
                  <dt className="flex w-32 shrink-0 items-center gap-2 text-[13px] text-body">
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
              <Link href={enrolHref} className={buttonClasses({ size: "lg", className: "w-full" })}>
                {intake.state === "full" ? t("course.enrolWaitlist") : t("course.enrolAction")}
              </Link>
              <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline", className: "w-full" })}>
                {t("course.askQuestion")}
              </Link>
              <p className="mt-1 text-[12.5px] leading-relaxed text-body/75">{t("course.enrolNote")}</p>
            </div>
          </div>
        }
      />

      <Section labelledBy={hasOverview ? "course-outcomes" : "course-syllabus"}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            {hasOverview ? (
              <SectionHead id="course-outcomes" eyebrow={t("course.overviewEyebrow")} title={t("course.outcomesTitle")} />
            ) : null}
            {ownDescription ? (
              <p className="mt-6 max-w-[66ch] text-[1.05rem] leading-[1.9] text-body">{ownDescription}</p>
            ) : null}

            {course.outcomes.length > 0 ? (
              <Reveal stagger as="ul" className="mt-9 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5">
                    <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                      <CheckIcon size={12} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-ink">{outcome}</span>
                  </li>
                ))}
              </Reveal>
            ) : null}

            <h2 id="course-syllabus" className={`${hasOverview ? "mt-16" : ""} text-[1.75rem] leading-tight sm:text-[2rem]`}>
              {t("course.syllabusTitle")}
            </h2>
            <p className="mt-3 max-w-[56ch] text-[15px] text-body">{t("course.syllabusLead")}</p>

            <Reveal stagger as="ol" className="mt-8 space-y-3">
              {course.modules.map((module, index) => {
                const hours = module.durationMinutes ? Math.round(module.durationMinutes / 60) : undefined;
                return (
                  <li key={module.id} className="flex items-center gap-5 rounded-3xl border border-line bg-surface p-5 shadow-soft">
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-deep font-heading text-[15px] font-bold text-accent"
                      dir="ltr"
                    >
                      {number(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[16px] leading-snug font-semibold text-ink">{module.title}</span>
                      {module.summary ? (
                        <span className="mt-1 block text-[14px] leading-relaxed text-body">{module.summary}</span>
                      ) : null}
                    </span>
                    {hours ? (
                      /* A figure over a bare noun: Arabic agreement changes with
                         the number, so "{n} hours" would be wrong for most. */
                      <span className="shrink-0 text-center">
                        <span className="block font-heading text-[18px] leading-none font-bold text-ink" dir="ltr">
                          {number(hours)}
                        </span>
                        <span className="mt-1 block text-[11.5px] text-body/70">{t("course.hoursLabel")}</span>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </Reveal>

            {instructors.length > 0 ? (
              <>
                <h2 id="course-instructors" className="mt-16 text-[1.75rem] leading-tight sm:text-[2rem]">
                  {t("course.instructorsTitle")}
                </h2>
                <ul aria-labelledby="course-instructors" className="mt-8 grid gap-4 sm:grid-cols-2">
                  {instructors.map((coach) => (
                    <li key={coach.id} className="flex">
                      <Link
                        href={localePath(locale, `/coaches/${coach.slug}`)}
                        className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                          {coach.avatar ? (
                            <Image src={coach.avatar.url} alt="" fill sizes="64px" className="object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-heading text-[15px] font-semibold text-ink">{coach.name}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-body">{coach.headline}</span>
                        </span>
                        <span className="text-primary">
                          <ArrowIcon />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {course.certification ? (
              <SideCard icon={<CertificateIcon size={15} />} title={t("course.certificateTitle")}>
                <p className="font-heading text-[15px] leading-snug font-semibold text-ink">{course.certification.name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  {t("course.certifiedBy", { issuer: course.certification.issuedBy })}
                </p>
                {course.assessment ? (
                  <>
                    <p className="mt-4 text-[12.5px] font-semibold text-ink">{t("course.assessmentTitle")}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-body">{course.assessment}</p>
                  </>
                ) : null}
              </SideCard>
            ) : null}

            {course.audience.length > 0 ? (
              <SideCard icon={<UsersIcon size={15} />} title={t("course.audienceTitle")}>
                <ul className="space-y-2">
                  {course.audience.map((entry) => (
                    <li key={entry} className="flex items-start gap-2 text-[14px] text-body">
                      <span className="mt-1 text-primary">
                        <CheckIcon size={12} />
                      </span>
                      {entry}
                    </li>
                  ))}
                </ul>
              </SideCard>
            ) : null}

            {/* Only what is known: no language list is better than a guessed one,
                and "online" is only ever said of an online course. */}
            {course.languages.length > 0 ? (
              <SideCard icon={<GlobeIcon size={15} />} title={t("course.languagesTitle")}>
                <p className="text-[14px] text-body">{course.languages.join(" · ")}</p>
              </SideCard>
            ) : null}

            {course.venue || course.format === "online" ? (
              <SideCard icon={<PinIcon size={15} />} title={t("course.whereTitle")}>
                <p className="text-[14px] text-body">{course.venue ?? t("course.whereOnline")}</p>
              </SideCard>
            ) : null}

            {sports.length > 0 ? (
              <SideCard icon={<BarsIcon size={15} />} title={t("field.sports")}>
                <ul className="flex flex-wrap gap-2">
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
              </SideCard>
            ) : null}
          </aside>
        </div>
      </Section>

      {/* The programme in pictures — the client's own photographs, on the deep
          band with a gold inset frame like the certificate covers. Three or
          more make a feature layout (one large, the rest beside it); two sit
          side by side; one is already the cover and is not repeated. They are
          decorative (the course is named above them), so the grid is hidden
          from screen readers rather than announced as a list of blank items. */}
      {gallery.length > 1 ? (
        <Section tone="deep" labelledBy="course-gallery">
          <SectionHead id="course-gallery" tone="dark" eyebrow={t("course.galleryEyebrow")} title={t("course.galleryTitle")} />
          <div aria-hidden="true">
            <Reveal
              stagger
              className={`mt-12 grid gap-4 sm:gap-5 ${gallery.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}
            >
              {gallery.map((image, index) => {
                const feature = gallery.length >= 3 && index === 0;
                return (
                  <div
                    key={image.id}
                    className={`group relative overflow-hidden rounded-3xl bg-deep-2 ring-1 ring-white/10 ${
                      feature ? "aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:row-span-2 lg:aspect-auto" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes={feature ? "(min-width: 1024px) 760px, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <span className="pointer-events-none absolute inset-2.5 rounded-[1.1rem] border border-accent/30" />
                  </div>
                );
              })}
            </Reveal>
          </div>
        </Section>
      ) : null}

      <Section tone="muted" labelledBy="course-reviews">
        <SectionHead id="course-reviews" title={t("reviews.title", { label: t("reviews.labelCourse") })} />
        {course.rating.count === 0 ? (
          <p className="mt-8 max-w-[48ch] text-[15px] text-body">{t("reviews.none")}</p>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            {/* The score and the writing are two different things: a course can
                carry many ratings and no written review. */}
            <div className="rounded-3xl bg-deep p-7 text-white">
              <p className="font-heading text-[3rem] leading-none font-bold text-white" dir="ltr">
                {course.rating.average.toFixed(1)}
              </p>
              <p className="mt-3 flex gap-0.5 text-accent" aria-label={ratingLabel}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} aria-hidden="true" className={index < Math.round(course.rating.average) ? "" : "text-white/20"}>
                    <StarIcon size={16} />
                  </span>
                ))}
              </p>
              <p className="mt-6">
                <span className="block font-heading text-[1.4rem] leading-none font-bold" dir="ltr">
                  {number(course.rating.count)}
                </span>
                <span className="mt-1.5 block text-[12.5px] text-white/60">{t("course.ratingsLabel")}</span>
              </p>
            </div>

            {reviews.items.length === 0 ? (
              <div className="flex items-center rounded-3xl border border-line bg-surface px-6 py-10">
                <p className="max-w-[46ch] text-[15px] leading-relaxed text-body">{t("course.reviewsNoneWritten")}</p>
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

      {related.length > 0 ? (
        <Section labelledBy="course-related">
          <SectionHead
            id="course-related"
            title={t("course.relatedTitle")}
            actions={
              <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "outline" })}>
                {t("course.backToList")}
              </Link>
            }
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.id} className="flex">
                <CourseCard course={entry} locale={locale} t={t} coverLabel={categoryName(entry.categoryIds[0])} />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <HelpBand locale={locale} topic="courses" />
    </>
  );
}

function SideCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}
