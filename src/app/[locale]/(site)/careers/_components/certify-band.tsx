import Link from "next/link";

import { buttonClasses, Container, Rosette } from "@/components/ui";
import { localePath, type Locale, type Translate } from "@/i18n";

/**
 * THE CAREERS PAGES' CLOSING BAND — the board's link back to what JoFit is.
 *
 * JoFit runs this board because it qualifies the people on it: it is the
 * official NCSF agent in Jordan. So the board does not end on the course
 * pages' "need help choosing your course?"; it ends on the certification a
 * candidate can add to their application. The same framed green panel as
 * `HelpBand`, so every page's last word looks the same.
 */
export function CertifyBand({ locale, t }: { locale: Locale; t: Translate }) {
  return (
    <section data-band aria-labelledby="careers-certify-title" className="bg-surface py-16 lg:py-20">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white sm:px-12 lg:px-16 lg:py-14">
          <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.06]" />
          <span aria-hidden="true" className="absolute -end-24 -top-40 -z-10 size-[30rem] text-white/[0.12]">
            <Rosette className="spin-slow size-full" />
          </span>
          <span aria-hidden="true" className="absolute -bottom-24 -start-16 -z-10 size-72 rounded-full bg-accent/25 blur-3xl" />

          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              {/* White, not the eyebrow's gold: gold type on the action green
                  is too faint to read; the dash stays gold. */}
              <p className="eyebrow text-white/85" data-tone="dark">
                {t("site.footerAgency")}
              </p>
              <h2 id="careers-certify-title" className="mt-3 text-[1.75rem] leading-tight text-white sm:text-[2.1rem]">
                {t("careers.certify.title")}
              </h2>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-white/80">{t("careers.certify.body")}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "onDark", size: "lg" })}>
                {t("landing.heroPrimary")}
              </Link>
              <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
                {t("landing.helpPrimary")}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
