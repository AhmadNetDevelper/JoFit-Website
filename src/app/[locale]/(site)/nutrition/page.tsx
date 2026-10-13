import Link from "next/link";

import { buttonClasses } from "@/components/ui";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ProseContact, ProsePage } from "../_components/prose-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/nutrition">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/nutrition",
    title: t("nutrition.title"),
    description: t("nutrition.description"),
  });
}

/** Verified: the client's WhatsApp Business number. */
const WHATSAPP_URL = "https://wa.me/962772116067";

/**
 * NUTRITION — DELIBERATELY SHORT.
 *
 * The client asked for this page but supplied no copy for it. The only verified
 * fact that touches nutrition is that JoFit delivers the NCSF "Sports Nutrition
 * Specialist" certification as the council's exclusive agent in Jordan, plus the
 * registration, refund and certificate commitments that apply to every course.
 *
 * So this page states exactly that and stops. Every section that would need a
 * fact nobody has supplied — the syllabus, the hours, the fee, whether one-to-one
 * consultations exist at all — is ABSENT, and marked with a `TODO(client)` at the
 * point where it belongs. Do not fill one of those gaps with plausible copy: a
 * course page that invents a duration or a price is a page that misleads a buyer.
 *
 * The hero links to the certification's own course page, which is where the
 * catalogue's details for it live; this page adds nothing to them.
 */
export default async function NutritionPage({ params }: PageProps<"/[locale]/nutrition">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  return (
    <>
      <ProsePage
        locale={locale}
        eyebrow={t("nutrition.eyebrow")}
        title={t("nutrition.title")}
        lead={t("nutrition.lead")}
        actions={
          <>
            <Link
              href={localePath(locale, "/education/courses/sports-nutrition-specialist")}
              className={buttonClasses({ variant: "gold", size: "lg" })}
            >
              {t("nutrition.courseCta")}
            </Link>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("nutrition.contactCta")}
            </Link>
          </>
        }
        sections={[
          {
            id: "nutrition-programme",
            heading: t("nutrition.programmeHeading"),
            paragraphs: [t("nutrition.programmeBody1"), t("nutrition.programmeBody2")],
          },

          /* TODO(client): "What the certification covers" belongs here — the NCSF
             module list / syllabus / learning outcomes for Sports Nutrition
             Specialist. Nothing was supplied, so no outline is shown. */

          {
            id: "nutrition-programme-family",
            heading: t("nutrition.familyHeading"),
            paragraphs: [t("nutrition.familyBody")],
            items: [
              t("nutrition.familyItemNutrition"),
              t("nutrition.familyItemTrainer"),
              t("nutrition.familyItemStrength"),
            ],
          },

          /* TODO(client): "How the course runs" belongs here — total training
             hours, duration, in-person or online, language of instruction, venue,
             group size and upcoming intake dates. None of these were supplied. */

          {
            id: "nutrition-certificate",
            heading: t("nutrition.certificateHeading"),
            paragraphs: [t("nutrition.certificateBody1"), t("nutrition.certificateBody2")],
          },
          {
            id: "nutrition-registration",
            heading: t("nutrition.registrationHeading"),
            paragraphs: [
              t("nutrition.registrationBody1"),
              /* TODO(client): the refund window and the refund percentage were
                 explicitly NOT supplied. Until they are, this paragraph sends the
                 reader to the office instead of naming a number of days or a
                 percentage. Replace it once the real conditions arrive. */
              t("nutrition.registrationBody2"),
              t("nutrition.registrationBody3"),
            ],
          },

          /* TODO(client): "Fees" belongs here — the course fee, the initial
             registration fee, instalments and accepted payment methods. */
        ]}
        footer={
          <ProseContact
            id="nutrition-enquire"
            heading={t("nutrition.enquireHeading")}
            body={t("nutrition.enquireBody")}
            channels={[
              {
                kind: "email",
                label: t("nutrition.emailLabel"),
                value: t("site.contactEmail"),
                href: `mailto:${t("site.contactEmail")}`,
                ltr: true,
              },
              {
                kind: "whatsapp",
                label: t("nutrition.whatsappLabel"),
                value: t("site.contactPhone"),
                href: WHATSAPP_URL,
                ltr: true,
                external: true,
              },
              { kind: "hours", label: t("nutrition.hoursLabel"), value: t("nutrition.hoursValue") },
            ]}
          >
            {/* TODO(client): a downloadable course brochure or syllabus PDF would
                sit beside this button — none has been supplied. */}
            <Link className={buttonClasses({ className: "mt-7" })} href={localePath(locale, "/contact")}>
              {t("nutrition.contactCta")}
            </Link>
          </ProseContact>
        }
      />

      {/* TODO(client): a "Nutrition consultations" section belongs after the
          document — one-to-one sports nutrition consultations, meal planning, body
          composition assessment or any similar service. It is NOT written here
          because nobody has confirmed that JoFit offers such a service at all, let
          alone who delivers it, what a session involves or what it costs. */}
    </>
  );
}
