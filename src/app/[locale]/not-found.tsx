import Link from "next/link";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { buttonClasses, Container, Rosette } from "@/components/ui";
import { getTranslator, LOCALE_DIRECTION, LOCALES, localePath, type Locale } from "@/i18n";
import { buildMetadata } from "@/lib";
// This page sits outside every route group, so it carries its own Tailwind
// import. See the comment in `[locale]/layout.tsx`.
import "@/styles/globals.css";

const en = getTranslator("en");
const ar = getTranslator("ar");

export const metadata = buildMetadata({ title: `${en("notFound.title")} · ${ar("notFound.title")}`, noIndex: true });

/**
 * THE 404 — a formal, standalone screen.
 *
 * It renders inside the root `[locale]` layout but OUTSIDE the `(site)` group,
 * so there is no header or footer here: the page carries its own brand bar and
 * foot, on the heroes' deep green with the certificate linework and the
 * rosette turning behind the figure.
 *
 * WHICH LANGUAGE. `not-found.tsx` cannot read route params, but the root layout
 * above it already set `<html lang>` from the URL. So both languages are
 * rendered and CSS keeps the one that matches the document (`:root:lang(ar)`):
 * no JavaScript, no guess, and the hidden copy is `display: none`, so a screen
 * reader meets exactly one `<h1>`. The page is not indexed either way.
 */
export default function NotFound() {
  return (
    <main id="main-content" className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-deep text-white/75">
      <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.035]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(56rem_34rem_at_50%_38%,color-mix(in_srgb,var(--color-primary)_42%,transparent),transparent_70%)]"
      />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent" />

      {LOCALES.map((locale) => (
        <NotFoundCopy key={locale} locale={locale} />
      ))}
    </main>
  );
}

function NotFoundCopy({ locale }: { locale: Locale }) {
  const t = locale === "ar" ? ar : en;
  const home = localePath(locale, "/");

  return (
    <div
      lang={locale}
      dir={LOCALE_DIRECTION[locale]}
      /* Specificity does the choosing: `:root:lang(ar) .x` outranks `.flex`. */
      className={`flex flex-1 flex-col ${locale === "ar" ? "[:root:not(:lang(ar))_&]:hidden" : "[:root:lang(ar)_&]:hidden"}`}
    >
      <Container className="flex items-center justify-between gap-6 py-6">
        <Link href={home} className="rounded-lg">
          <JofitLogo variant="full" title={t("site.name")} className="jf-logo-lift h-11 w-auto" />
        </Link>
        <Link href={localePath(locale, "/contact")} className="text-[14px] font-medium text-white/70 transition-colors hover:text-white">
          {t("nav.contact")}
        </Link>
      </Container>

      <Container className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="relative isolate">
          <span
            aria-hidden="true"
            className="absolute start-1/2 top-1/2 -z-10 size-[26rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.18] sm:size-[34rem] rtl:translate-x-1/2"
          >
            <Rosette className="spin-slow size-full" />
          </span>
          <p
            aria-hidden="true"
            dir="ltr"
            className="bg-linear-to-b from-accent to-accent/35 bg-clip-text font-heading text-[7.5rem] leading-none font-extrabold text-transparent sm:text-[11rem]"
          >
            404
          </p>
        </div>

        <p className="eyebrow mt-8" data-tone="dark">
          {t("notFound.eyebrow")}
        </p>
        <h1 className="mt-4 max-w-2xl text-[2.1rem] leading-tight text-white sm:text-5xl">{t("notFound.title")}</h1>
        <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-white/70 sm:text-lg">{t("notFound.description")}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href={home} className={buttonClasses({ variant: "gold", size: "lg" })}>
            {t("notFound.home")}
          </Link>
          <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
            {t("landing.heroPrimary")}
          </Link>
        </div>
      </Container>

      <Container className="border-t border-white/10 py-6 text-center text-[13px] text-white/50">
        {t("site.footerRights", { year: String(new Date().getFullYear()) })}
        <span aria-hidden="true" className="mx-2 text-white/25">
          ·
        </span>
        {t("landing.heroEyebrow")}
      </Container>
    </div>
  );
}
