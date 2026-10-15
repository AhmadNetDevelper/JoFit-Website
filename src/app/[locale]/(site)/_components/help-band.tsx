import Link from "next/link";

import { buttonClasses, Container, Rosette } from "@/components/ui";
import { getTranslator, localePath, type Locale } from "@/i18n";

const WHATSAPP_URL = "https://wa.me/962772116067";

const COPY = {
  general: ["landing.helpGeneralTitle", "landing.helpGeneralBody"],
  courses: ["landing.helpTitle", "landing.helpBody"],
  coaches: ["landing.helpCoachesTitle", "landing.helpCoachesBody"],
  shop: ["landing.helpShopTitle", "landing.helpShopBody"],
} as const;

export type HelpTopic = keyof typeof COPY;

/**
 * THE CLOSING BAND: "Have a question? Our team is ready."
 *
 * Every page that sells something ends here, the way a certification body's
 * site does — the reader who scrolled this far and still has a question should
 * not have to go looking for the contact page. A framed panel rather than a
 * full-bleed band, so it sits on the page above the footer's deep green
 * instead of merging into it.
 *
 * `topic` picks the question: course pages ask about choosing a course, the
 * coach pages about choosing a coach, the shop about choosing kit, and
 * everything else asks generally.
 */
export function HelpBand({
  locale,
  topic = "general",
  className = "",
}: {
  locale: Locale;
  topic?: HelpTopic;
  className?: string;
}) {
  const t = getTranslator(locale);
  const [titleKey, bodyKey] = COPY[topic];

  return (
    <section data-band aria-labelledby="help-band-title" className={`bg-surface py-16 lg:py-20 ${className}`}>
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#063C22] px-6 py-12 text-white sm:px-12 lg:px-16 lg:py-14">
          <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.06]" />
          <span aria-hidden="true" className="absolute -end-24 -top-40 -z-10 size-[30rem] text-white/[0.12]">
            <Rosette className="spin-slow size-full" />
          </span>
          <span
            aria-hidden="true"
            className="absolute -bottom-24 -start-16 -z-10 size-72 rounded-full bg-accent/25 blur-3xl"
          />

          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 id="help-band-title" className="text-[1.75rem] leading-tight text-white sm:text-[2.1rem]">
                {t(titleKey)}
              </h2>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-white/80">{t(bodyKey)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "onDark", size: "lg" })}>
                {t("landing.helpPrimary")}
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: "ghostDark", size: "lg" })}
              >
                {t("landing.helpWhatsapp")}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
