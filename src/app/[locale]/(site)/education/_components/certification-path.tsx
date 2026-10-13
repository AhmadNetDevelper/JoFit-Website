import Link from "next/link";

import { buttonClasses, Reveal, Section, SectionHead } from "@/components/ui";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

/**
 * FROM ENQUIRY TO CERTIFICATE — the four steps, on the deep band.
 *
 * Shared by the home page and the catalogue: the same path, told the same way.
 * The copy is the education section's own and already says that fees and
 * intakes are given on enquiry. The steps sit on a gold line with numbered
 * seals — a sequence, because it genuinely is one: nobody sits the NCSF
 * examination before they have registered.
 */
export function CertificationPath({
  locale,
  t,
  eyebrow,
  showLink = true,
}: {
  locale: Locale;
  t: Translate;
  eyebrow?: string;
  /** The link to the six qualifications; off on `/specialisations` itself. */
  showLink?: boolean;
}) {
  const { number } = getFormatters(locale);
  const steps = [
    { title: t("education.pathStep1"), body: t("education.pathStep1Body") },
    { title: t("education.pathStep2"), body: t("education.pathStep2Body") },
    { title: t("education.pathStep3"), body: t("education.pathStep3Body") },
    { title: t("education.pathStep4"), body: t("education.pathStep4Body") },
  ];

  return (
    <Section tone="deep" labelledBy="certification-path">
      <SectionHead
        id="certification-path"
        tone="dark"
        align="center"
        eyebrow={eyebrow}
        title={t("education.pathTitle")}
        lead={t("education.pathLead")}
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
      {showLink ? (
        <div className="mt-14 text-center">
          <Link href={localePath(locale, "/specialisations")} className={buttonClasses({ variant: "gold", size: "lg" })}>
            {t("education.pathLink")}
          </Link>
        </div>
      ) : null}
    </Section>
  );
}
