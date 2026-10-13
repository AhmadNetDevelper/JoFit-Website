import { SkipLink } from "@/components/ui";
import { getTranslator, resolveLocale } from "@/i18n";
import { jsonLdScriptProps, organizationJsonLd } from "@/lib";
// Tailwind is imported per route group rather than in the root layout.
import "@/styles/globals.css";

/* The header is one directory up, beside the root layout; the footer is this
   group's own. */
import { PageMain } from "../_components/page-main";
import { SiteHeader } from "../_components/site-header";
import { SiteSupport } from "../_components/site-support";
import { SiteFooter } from "./_components/site-footer";

/**
 * The storefront shell. Route groups are used only where the chrome genuinely
 * differs: `(site)` carries the full header and footer, `(checkout)` strips them
 * back. Grouping costs nothing in the URL and avoids a layout full of
 * conditionals.
 */
export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);

  return (
    <>
      <SkipLink label={t("site.skipToContent")} />
      {/*
        THE SITE'S IDENTITY, DECLARED ONCE.

        Every other JSON-LD block on the site refers back to this one by `@id`
        rather than repeating the address and the telephone — a product's
        seller, a course's provider. One declaration means one place to correct
        when a real detail changes, and no chance of two pages claiming
        different opening hours.

        It is in the layout rather than the page because it describes the
        business, not the page: it should be on `/shop` and `/contact` alike.
      */}
      <script {...jsonLdScriptProps(organizationJsonLd(locale, t("site.tagline")))} />

      <SiteHeader locale={locale} />
      {/*
        A designed page is a stack of full-bleed bands that paint their own
        background and centre their contents through `Container`. Those opt out
        by carrying `data-band` — set by the `Section` component, or by hand on
        the few bands this page writes directly.

        Everything else — the pages still waiting to be designed — gets the
        measure and padding here, so they stay readable without each one
        repeating a wrapper. Opting in to full bleed rather than guessing from
        the tag name matters: those pages use `<section>` for meaning, not for
        layout, and excluding the tag would drop them out of the measure.

        The header is in the page flow now (it no longer floats over a
        photograph), so the first child needs breathing room, not clearance.
      */}
      {/* `PageMain` IS this `<main>` — it only exists so the element can be
          keyed by pathname and animate in on every route change. The className
          is unchanged and still lands on `<main>` itself, so the measure rule
          for direct children keeps working exactly as before. */}
      <PageMain className="flex-1 [&>*:not([data-band])]:mx-auto [&>*:not([data-band])]:w-full [&>*:not([data-band])]:max-w-page [&>*:not([data-band])]:px-4 [&>*:not([data-band])]:first:pt-12 lg:[&>*:not([data-band])]:first:pt-16 [&>*:not([data-band])]:last:pb-16 sm:[&>*:not([data-band])]:px-6">
        {children}
      </PageMain>
      <SiteFooter locale={locale} />
      <SiteSupport locale={locale} />
    </>
  );
}
