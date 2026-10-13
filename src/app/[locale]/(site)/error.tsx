"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { buttonClasses, Container, Rosette } from "@/components/ui";
// The locale helpers only — `@/i18n` itself would pull both dictionaries into
// the browser bundle for one rarely seen screen.
import { localePath, resolveLocale, type Locale } from "@/i18n/locales";

/**
 * STOREFRONT-WIDE ERROR BOUNDARY — a formal error card between the site's own
 * header and footer.
 *
 * Error boundaries are Client Components, so they cannot await a dictionary,
 * and shipping the dictionary (two modules of ~130KB) to the browser for this
 * screen would be absurd. So the few words it needs are written here in both
 * languages — the title, the retry and the way home are the dictionary's own
 * `state.errorTitle`, `state.retry` and `notFound.home`; keep them in step —
 * and the language is the route's own `[locale]` param.
 *
 * It still shows the message the server produced when it threw (in production
 * Next replaces a server error's message with a generic one, so this is mostly
 * useful for client errors and in development), and the digest a support
 * request can quote.
 */
const COPY: Readonly<
  Record<Locale, { eyebrow: string; title: string; body: string; retry: string; home: string; reference: string }>
> = {
  en: {
    eyebrow: "Error",
    title: "Something went wrong",
    body: "This page could not be loaded. Try again, or return to the home page.",
    retry: "Try again",
    home: "Back to home",
    reference: "Reference",
  },
  ar: {
    eyebrow: "خطأ",
    title: "حدث خطأ ما",
    body: "تعذّر تحميل هذه الصفحة. أعد المحاولة أو عُد إلى الصفحة الرئيسية.",
    retry: "إعادة المحاولة",
    home: "العودة إلى الرئيسية",
    reference: "المرجع",
  },
};

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = resolveLocale(params?.locale);
  const copy = COPY[locale];

  return (
    <section data-band className="bg-canvas py-16 sm:py-24">
      <Container>
        <div
          role="alert"
          aria-live="assertive"
          className="relative isolate mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-14 text-center shadow-lift sm:px-12"
        >
          <span
            aria-hidden="true"
            className="absolute start-1/2 -top-40 -z-10 size-[30rem] -translate-x-1/2 text-accent/[0.14] rtl:translate-x-1/2"
          >
            <Rosette className="size-full" />
          </span>

          <span
            aria-hidden="true"
            className="mx-auto grid size-16 place-items-center rounded-full bg-deep text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-surface"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 7.5v6" />
              <path d="M12 17h.01" strokeWidth="2.4" />
              <circle cx="12" cy="12" r="9.25" strokeWidth="1.4" />
            </svg>
          </span>

          <p className="eyebrow mt-8">{copy.eyebrow}</p>
          <h1 className="mt-3 text-[2rem] leading-tight sm:text-4xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-[48ch] text-[1.02rem] leading-relaxed text-body">{copy.body}</p>

          {error.message ? (
            <p dir="auto" className="mx-auto mt-5 max-w-[52ch] rounded-xl bg-canvas px-4 py-3 text-[13px] leading-relaxed text-body/80">
              {error.message}
            </p>
          ) : null}
          {error.digest ? (
            <p className="mt-3 text-[12px] text-body/60">
              {copy.reference}: <span dir="ltr">{error.digest}</span>
            </p>
          ) : null}

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={reset} className={buttonClasses({ size: "lg" })}>
              {copy.retry}
            </button>
            <Link href={localePath(locale, "/")} className={buttonClasses({ variant: "outline", size: "lg" })}>
              {copy.home}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
