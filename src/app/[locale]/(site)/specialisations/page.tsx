import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { accreditations } from "@/config";
import { educationService, type Course } from "@/features/education";
import { getFormatters, getTranslator, localePath, resolveLocale, type TranslationKey } from "@/i18n";
import { breadcrumbJsonLd, buildMetadata, jsonLdScriptProps } from "@/lib";

import { HelpBand } from "../_components/help-band";
import { CertificationPath } from "../education/_components/certification-path";
import { CertificateIcon } from "../education/_components/icons";
import { AgencyPlaque } from "./_components/agency-plaque";
import { QualificationCard } from "./_components/qualification-card";

/**
 * THE QUALIFICATIONS PAGE — the commercial heart of the site.
 *
 *   PageHero        the agency first: eyebrow, title, lead, four figures
 *                   counted from this page's own lists and the catalogue, and
 *                   the AGENCY PLAQUE in the end column — JoFit's mark and the
 *                   council's seal joined by a gold rule
 *   agency          the statement in its own right, stated once and loudly: the
 *                   council, the territory, who issues the certificate, and the
 *                   bodies that recognise it
 *   certifications  the three NCSF international certifications, each wearing
 *                   its course's certificate cover and linking to its course
 *   specialised     the specialised programmes (injuries, Reformer Pilates,
 *                   Olympic Weightlifting) and the CPD workshops, beside a
 *                   sticky note on why fees and dates are asked for rather
 *                   than printed
 *   path            the four steps from enquiry to certificate
 *   help            the closing band
 *
 * ---------------------------------------------------------------------------
 * THE `id` ON EACH ITEM IS KEPT AS AN ANCHOR. The header's menu used to link
 * `/specialisations#cpt` and so on; it now links the course pages
 * (`config/navigation.ts`), but a bookmarked or shared hash must still land on
 * its card, so the ids stay.
 *
 * NOTHING HERE IS INVENTED. The names and descriptions are the owner's copy;
 * the figures are counted; there is no price, no date and no duration — those
 * are given on enquiry, which the page says.
 */
interface Qualification {
  /** The anchor a shared link may still point at. */
  readonly id: string;
  readonly indexKey: TranslationKey;
  readonly nameKey: TranslationKey;
  readonly bodyKey: TranslationKey;
  /** The course it leads to, or (for the CPD workshops) the category. */
  readonly courseSlug?: string;
  readonly categorySlug?: string;
}

const CERTIFICATIONS: readonly Qualification[] = [
  {
    id: "cpt",
    indexKey: "specialisations.cpt.index",
    nameKey: "specialisations.cpt.name",
    bodyKey: "specialisations.cpt.body",
    courseSlug: "certified-personal-trainer",
  },
  {
    id: "strength-conditioning",
    indexKey: "specialisations.strength.index",
    nameKey: "specialisations.strength.name",
    bodyKey: "specialisations.strength.body",
    courseSlug: "strength-and-conditioning-specialist",
  },
  {
    id: "sports-nutrition",
    indexKey: "specialisations.nutrition.index",
    nameKey: "specialisations.nutrition.name",
    bodyKey: "specialisations.nutrition.body",
    courseSlug: "sports-nutrition-specialist",
  },
];

const SPECIALISED: readonly Qualification[] = [
  {
    id: "injury-rehabilitation",
    indexKey: "specialisations.rehab.index",
    nameKey: "specialisations.rehab.name",
    bodyKey: "specialisations.rehab.body",
    courseSlug: "sports-injury-prevention-and-rehabilitation",
  },
  {
    id: "pilates",
    indexKey: "specialisations.pilates.index",
    nameKey: "specialisations.pilates.name",
    bodyKey: "specialisations.pilates.body",
    courseSlug: "professional-pilates-instructor",
  },
  {
    id: "olympic-weightlifting",
    indexKey: "specialisations.weightlifting.index",
    nameKey: "specialisations.weightlifting.name",
    bodyKey: "specialisations.weightlifting.body",
    courseSlug: "olympic-weightlifting",
  },
  {
    id: "continuing-education",
    indexKey: "specialisations.ceu.index",
    nameKey: "specialisations.ceu.name",
    bodyKey: "specialisations.ceu.body",
    categorySlug: "cpd",
  },
];

export async function generateMetadata({ params }: PageProps<"/[locale]/specialisations">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/specialisations",
    title: t("specialisations.title"),
    description: t("specialisations.description"),
  });
}

export default async function SpecialisationsPage({ params }: PageProps<"/[locale]/specialisations">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const [catalogue, categories] = await Promise.all([
    educationService.listCourses({ locale, pageSize: 200 }),
    educationService.listCategories(locale),
  ]);

  const categoryBySlug = (slug: string) => categories.find((entry) => entry.slug === slug);
  const inCategory = (id?: string) => catalogue.items.filter((course) => id && course.categoryIds.includes(id));
  const cpd = categoryBySlug("cpd");

  /* The course a qualification leads to — for the CPD strand, the first
     workshop on the track, whose cover reads "CPD". */
  const courseFor = (item: Qualification): Course | undefined =>
    item.courseSlug
      ? catalogue.items.find((course) => course.slug === item.courseSlug)
      : inCategory(categoryBySlug(item.categorySlug ?? "")?.id)[0];

  const hrefFor = (item: Qualification) =>
    localePath(
      locale,
      item.courseSlug ? `/education/courses/${item.courseSlug}` : `/education/categories/${item.categorySlug}`,
    );

  const categoryName = (course?: Course) => categories.find((entry) => entry.id === course?.categoryIds[0])?.name;

  const card = (item: Qualification, layout: "stack" | "row", priority = false) => {
    const course = courseFor(item);
    return (
      <li key={item.id} id={item.id} className="flex scroll-mt-28">
        <QualificationCard
          index={t(item.indexKey)}
          name={t(item.nameKey)}
          body={t(item.bodyKey)}
          href={hrefFor(item)}
          action={item.courseSlug ? t("specialisations.viewCourse") : t("specialisations.viewWorkshops")}
          course={course}
          coverSlug={item.courseSlug ?? item.categorySlug ?? item.id}
          coverLabel={categoryName(course)}
          certificate={course?.certification?.name}
          layout={layout}
          priority={priority}
        />
      </li>
    );
  };

  const pillars: readonly { icon: ReactNode; label: string; value: string }[] = [
    { icon: <SealIcon />, label: t("specialisations.agency.councilLabel"), value: t("specialisations.agency.councilValue") },
    { icon: <MapIcon />, label: t("specialisations.agency.territoryLabel"), value: t("specialisations.agency.territoryValue") },
    { icon: <CertificateIcon size={22} />, label: t("specialisations.agency.recognisedTitle"), value: t("landing.heroSealBody") },
  ];

  const LOGO_HEIGHT = { seal: "h-14", wordmark: "h-9", badge: "h-11" } as const;

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("nav.specialisations"), path: "/specialisations" },
          ]),
        )}
      />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("nav.specialisations") }]}
        eyebrow={t("specialisations.eyebrow")}
        title={t("specialisations.title")}
        lead={t("specialisations.lead")}
        actions={
          <>
            <Link href="#certifications" className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("education.heroAction")}
            </Link>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("specialisations.cta.action")}
            </Link>
          </>
        }
        aside={
          <AgencyPlaque
            kicker={t("specialisations.agency.eyebrow")}
            title={t("site.footerAgency")}
            territory={t("specialisations.agency.territoryValue")}
            sealAlt={t("site.ncsfSealAlt")}
          />
        }
      >
        <HeroFacts
          items={[
            { label: t("landing.heroCountCerts"), value: <span dir="ltr">{number(CERTIFICATIONS.length)}</span> },
            { label: t("landing.heroCountCourses"), value: <span dir="ltr">{number(SPECIALISED.length)}</span> },
            { label: t("education.statCpd"), value: <span dir="ltr">{number(inCategory(cpd?.id).length)}</span> },
            { label: t("specialisations.agency.councilLabel"), value: <span dir="ltr">{t("specialisations.councilShort")}</span> },
          ]}
        />
      </PageHero>

      {/*
        THE AGENCY, STATED ONCE AND LOUDLY.

        Being the exclusive official agent of the council in Jordan is the
        strongest sentence this business has, so it is the page's first band
        and is set as a declaration: centred, large, closed by a gold rule, and
        followed by the three facts that stand behind it and the bodies that
        recognise the certificate.
      */}
      <Section labelledBy="specialisations-agency">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow">{t("specialisations.agency.eyebrow")}</p>
          <h2
            id="specialisations-agency"
            className="mt-5 text-[1.75rem] leading-[1.3] sm:text-[2.3rem] lg:text-[2.6rem]"
          >
            {t("specialisations.agency.headline")}
          </h2>
          <span aria-hidden="true" className="mx-auto mt-8 flex w-40 items-center gap-2">
            <span className="h-px flex-1 bg-accent/70" />
            <span className="size-2 rotate-45 bg-accent" />
            <span className="h-px flex-1 bg-accent/70" />
          </span>
          <p className="mx-auto mt-8 max-w-3xl text-[1.08rem] leading-relaxed text-body">
            {t("specialisations.agency.body")}
          </p>
        </div>

        <Reveal stagger as="dl" className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.label} className="flex h-full flex-col items-center rounded-3xl border border-line bg-canvas px-6 py-8 text-center">
              <span
                aria-hidden="true"
                className="grid size-14 place-items-center rounded-full bg-surface text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-canvas"
              >
                {pillar.icon}
              </span>
              <dt className="mt-5 text-[13px] font-semibold text-accent-strong">{pillar.label}</dt>
              <dd className="mt-2 font-heading text-[1.05rem] leading-snug font-semibold text-ink">{pillar.value}</dd>
            </div>
          ))}
        </Reveal>

        <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center gap-6 border-t border-line pt-10 sm:flex-row sm:justify-between">
          <p className="max-w-md text-center text-[14.5px] leading-relaxed text-body sm:text-start">
            <span className="block font-semibold text-ink">{t("landing.recognisedLabel")}</span>
            {t("landing.recognisedBody")}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {accreditations.map((logo) => (
              <li key={logo.id}>
                <Image
                  src={logo.src}
                  alt={logo.altKey ? t(logo.altKey) : logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className={`${LOGO_HEIGHT[logo.shape]} w-auto opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0`}
                />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="certifications" tone="muted" labelledBy="specialisations-certifications">
        <SectionHead
          id="specialisations-certifications"
          eyebrow={t("landing.certsEyebrow")}
          title={t("specialisations.certifications.heading")}
          lead={t("specialisations.certifications.lead")}
          actions={
            <Link href={localePath(locale, "/education/categories/certifications")} className={buttonClasses({ variant: "outline" })}>
              {t("landing.viewAll")}
            </Link>
          }
        />
        <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((item, index) => card(item, "stack", index === 0))}
        </Reveal>
      </Section>

      <Section labelledBy="specialisations-specialised">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              id="specialisations-specialised"
              eyebrow={t("landing.specialEyebrow")}
              title={t("specialisations.specialised.heading")}
              lead={t("specialisations.specialised.lead")}
            />

            {/*
              WHY THERE ARE NO FEES OR DATES ON THIS PAGE.

              They were never supplied, so the page says where they come from
              instead of guessing at a number.
            */}
            <aside
              aria-labelledby="specialisations-cta"
              className="relative isolate mt-10 overflow-hidden rounded-3xl bg-deep p-7 text-white/75 sm:p-8"
            >
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
              <h3 id="specialisations-cta" className="text-[1.3rem] leading-snug text-white">
                {t("specialisations.cta.title")}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed">{t("specialisations.cta.body")}</p>
              <Link
                href={localePath(locale, "/contact")}
                className={buttonClasses({ variant: "gold", className: "mt-6" })}
              >
                {t("specialisations.cta.action")}
              </Link>
            </aside>
          </div>

          <Reveal stagger as="ul" className="grid gap-5">
            {SPECIALISED.map((item) => card(item, "row"))}
          </Reveal>
        </div>
      </Section>

      <CertificationPath locale={locale} t={t} eyebrow={t("landing.pathEyebrow")} showLink={false} />
      <HelpBand locale={locale} topic="courses" />
    </>
  );
}

function SealIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6" />
      <path d="m9.5 10 1.8 1.8L15 8.2" />
      <path d="m8.2 14.8-1.4 6.2L12 18.8l5.2 2.2-1.4-6.2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}
