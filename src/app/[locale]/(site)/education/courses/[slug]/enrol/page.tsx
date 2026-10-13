import { updateTag } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, Card, PageHero, Rosette, Section } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import { educationService } from "@/features/education";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, isAppError } from "@/lib";
import { cacheTags } from "@/services";

import { ActionForm, type FormState } from "../../../../_components/portal/action-form";
import { CourseCover } from "../../../_components/course-cover";
import { BarsIcon, CalendarIcon, ClockIcon, LayersIcon, UsersIcon } from "../_components/icons";
import { COURSE_FORMAT_LABEL, COURSE_LEVEL_LABEL } from "../_components/labels";

export async function generateMetadata({ params }: PageProps<"/[locale]/education/courses/[slug]/enrol">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/education", title: getTranslator(locale)("enrol.title"), noIndex: true });
}

/**
 * RESERVING A PLACE ON A COURSE — the formal design's form page.
 *
 *   PageHero (compact)  the course being reserved, and the way back to it
 *   body                the reservation card — the cohort's facts and the one
 *                       button — beside a deep panel: the certificate the course
 *                       leads to and what happens after the button
 *
 * One decision, one button. The card states exactly what the button does —
 * holds a seat on the next cohort, confirmed by the academy once the
 * registration fee is in — because "enrol" on a certification has to mean the
 * same thing to the customer as it does to the academy.
 *
 * NO PRICE. The fixtures' fees are placeholders, so the card says what the
 * course page says: fees are given on enquiry.
 *
 * Only a signed-in CUSTOMER reaches it: `requireAccount` sends anyone else to
 * sign in and back. A customer who already holds a place sees that place
 * instead of a second button.
 */
export default async function EnrolPage({ params }: PageProps<"/[locale]/education/courses/[slug]/enrol">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const path = `/education/courses/${slug}/enrol`;
  const account = await requireAccount(locale, "customer", path);
  const t = getTranslator(locale);
  const f = getFormatters(locale);

  const course = await educationService.getCourseBySlug(slug, locale);
  if (!course) notFound();
  const [existing, categories] = await Promise.all([
    educationService.findEnrolment(account.customerId!, course.id, locale),
    educationService.listCategories(locale),
  ]);
  const intake = course.nextIntake;
  const courseId = course.id;
  const fallback = t("state.errorTitle");
  const courseHref = localePath(locale, `/education/courses/${slug}`);

  async function reserve(): Promise<FormState> {
    "use server";
    const caller = await requireAccount(locale, "customer", path);
    let reference: string;
    try {
      reference = (await educationService.enrol(caller.customerId!, courseId, locale)).reference;
    } catch (error) {
      return { status: "error", message: isAppError(error) ? error.message : fallback };
    }
    // A seat was taken: the course pages must not show the old count.
    updateTag(cacheTags.courses);
    // Outside the try: `redirect` works by throwing, and a catch would swallow it.
    redirect(`${localePath(locale, "/account/enrolments")}?reserved=${encodeURIComponent(reference)}`);
  }

  /* A figure beside a bare noun label for the hours and the seats: Arabic
     plural agreement changes with the number, so "{n} hours" would be wrong
     for most values. */
  const facts: readonly { icon: ReactNode; label: string; value: ReactNode }[] = [
    { icon: <CalendarIcon size={16} />, label: t("enrol.cohort"), value: f.date(intake.startsOn) },
    {
      icon: <LayersIcon size={16} />,
      label: t("enrol.format"),
      value: `${t(COURSE_FORMAT_LABEL[course.format])} · ${t(COURSE_LEVEL_LABEL[course.level])}`,
    },
    { icon: <ClockIcon size={16} />, label: t("course.factHours"), value: <span dir="ltr">{f.number(course.durationHours)}</span> },
    {
      icon: <UsersIcon size={16} />,
      label: t("enrol.seatsLeft"),
      value: <span dir="ltr">{f.number(Math.max(0, intake.seatsTotal - intake.seatsTaken))}</span>,
    },
  ];

  const next = [
    { title: t("education.pathStep2"), body: t("education.pathStep2Body") },
    { title: t("education.pathStep3"), body: t("education.pathStep3Body") },
    { title: t("education.pathStep4"), body: t("education.pathStep4Body") },
  ];

  const categoryName = categories.find((entry) => entry.id === course.categoryIds[0])?.name;

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("education.title"), href: localePath(locale, "/education") },
          { label: course.title, href: courseHref },
          { label: t("enrol.title") },
        ]}
        eyebrow={t("enrol.eyebrow")}
        title={course.title}
        lead={course.summary}
        actions={
          <Link href={courseHref} className={buttonClasses({ variant: "ghostDark" })}>
            {t("enrol.backToCourse")}
          </Link>
        }
      />

      <Section labelledBy="enrol-heading">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10">
          <Card className="p-6 sm:p-8 lg:p-10">
            <h2 id="enrol-heading" className="text-[1.75rem] leading-tight sm:text-[2rem]">
              {t(existing ? "enrol.alreadyTitle" : "enrol.panelTitle")}
            </h2>

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3.5 rounded-2xl border border-line bg-canvas p-4">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-primary ring-1 ring-primary/15"
                  >
                    {fact.icon}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[12.5px] text-body/75">{fact.label}</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold text-ink">{fact.value}</dd>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3.5 rounded-2xl border border-accent/30 bg-accent-10 p-4 sm:col-span-2">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-accent-strong ring-1 ring-accent/30"
                >
                  <BarsIcon size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="text-[12.5px] text-body/75">{t("course.feesLabel")}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-ink">{t("course.feesOnEnquiry")}</dd>
                </div>
              </div>
            </dl>

            {existing ? (
              <>
                <p className="mt-6 rounded-2xl border border-primary/20 bg-primary-05 px-4 py-3.5 text-[14px] font-medium text-primary-dark">
                  {t("enrol.alreadyBody", { reference: existing.reference, date: f.date(existing.cohortStartsOn) })}
                </p>
                <Link
                  href={localePath(locale, "/account/enrolments")}
                  className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}
                >
                  {t("enrol.seePlace")}
                </Link>
              </>
            ) : intake.state === "full" ? (
              <>
                <p className="mt-6 text-[15px] leading-relaxed text-body">{t("enrol.full")}</p>
                <Link href={localePath(locale, "/contact")} className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}>
                  {t("course.enrolWaitlist")}
                </Link>
              </>
            ) : (
              <ActionForm
                action={reserve}
                submitLabel={t("enrol.reserve")}
                pendingLabel={t("account.working")}
                submitSize="lg" submitClassName="mt-7 w-full"
              >
                <p className="mt-6 text-[14px] leading-relaxed text-body">{t("enrol.terms", { name: account.name })}</p>
              </ActionForm>
            )}
          </Card>

          <aside
            aria-labelledby="enrol-next"
            className="relative isolate overflow-hidden rounded-[2rem] bg-deep p-6 text-white/75 sm:p-8 lg:sticky lg:top-28"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
            <span aria-hidden="true" className="absolute -end-28 -bottom-28 -z-10 size-80 text-accent/15">
              <Rosette className="spin-slow size-full" />
            </span>

            <div className="rounded-2xl ring-1 ring-white/15">
              <CourseCover course={course} label={categoryName} sizes="(min-width: 1024px) 380px, 100vw" />
            </div>
            {course.certification ? (
              <p className="mt-4 text-[13px] leading-relaxed text-white/65">
                <span className="block font-heading text-[15px] font-semibold text-white">{course.certification.name}</span>
                {t("education.issuedBy", { issuer: course.certification.issuedBy })}
              </p>
            ) : null}

            <h2 id="enrol-next" className="mt-8 border-t border-white/15 pt-7 text-[1.3rem] leading-snug text-white">
              {t("enrol.nextTitle")}
            </h2>
            <ol className="mt-6 space-y-5">
              {next.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[14px] font-bold text-accent ring-1 ring-accent/50"
                    dir="ltr"
                  >
                    {f.number(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-[15px] font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", className: "mt-8 w-full" })}>
              {t("course.askQuestion")}
            </Link>
          </aside>
        </div>
      </Section>
    </>
  );
}
