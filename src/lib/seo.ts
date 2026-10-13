import type { Metadata } from "next";

import { siteConfig } from "@/config";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HREFLANG,
  LOCALE_OG,
  localePath,
  type Locale,
} from "@/i18n/locales";
import type { SeoMeta } from "@/types";

import { absoluteUrl } from "./url";

export interface BuildMetadataInput {
  title?: string;
  description?: string;
  /**
   * Locale-free, site-relative path, e.g. `/shop/products/pro-football`.
   * The locale prefix is added here so no caller has to remember it.
   */
  path?: string;
  locale?: Locale;
  imageUrl?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Single funnel for every page's metadata.
 *
 * Besides title/description/OG, it emits the bilingual signals a public site
 * needs: a canonical URL inside the current language, `hreflang` alternates for
 * every other language, and `x-default` pointing at the default locale. Without
 * those, the two language versions of a page compete with each other in search
 * results instead of being understood as translations.
 */
export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const path = input.path ?? "/";
  const title = input.title ?? siteConfig.name;
  const description = input.description ?? siteConfig.description;
  const canonical = absoluteUrl(localePath(locale, path));
  /*
   * A REAL FILE, and the extension is the point.
   *
   * This defaulted to `/opengraph-image`, a route that does not exist. Worse,
   * `src/proxy.ts` matches on a pattern that exempts only paths CONTAINING A
   * DOT, so the bare path was first redirected into `/en/opengraph-image` and
   * then 404'd. Several scrapers do not follow redirects on image URLs at all,
   * so every share of every page on WhatsApp, Facebook and LinkedIn rendered
   * as a bare link with no card -- on a business whose own quotations page
   * routes its call to action through WhatsApp.
   *
   * `public/brand/og-default.jpg` has a dot in it, which takes it out of the
   * matcher, and being static there is nothing to render at request time. It
   * carries the lockup, the agency line in both Arabic and English, and the
   * NCSF seal on the rosette, so one file serves both languages. It is a JPEG
   * (~130KB) because WhatsApp drops link previews whose image is much over
   * 300KB. It was rendered from the site's own components at 1200×630; to
   * change it, render again rather than editing pixels.
   */
  const image = input.imageUrl ?? absoluteUrl("/brand/og-default.jpg");

  const languages = Object.fromEntries([
    ...LOCALES.map((entry) => [LOCALE_HREFLANG[entry], absoluteUrl(localePath(entry, path))]),
    ["x-default", absoluteUrl(localePath(DEFAULT_LOCALE, path))],
  ]);

  return {
    /*
     * The page's own title with the site name appended.
     *
     * Without this a search result for this site read "Shop", or "Cart", or
     * "Search" — one bare word with nothing saying whose. A title that already
     * contains the site name is left alone, so the home page does not become
     * "JoFit | JoFit" and neither does "Contact JoFit".
     */
    title: title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`,
    description,
    alternates: { canonical, languages },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: input.type ?? "website",
      siteName: siteConfig.name,
      /* `LOCALE_OG`, not `LOCALE_HREFLANG`. OpenGraph requires
         `language_TERRITORY`; a bare `en` is discarded and the scraper guesses
         the page's language from its content instead, which on a bilingual
         site is exactly the guess you do not want made. */
      locale: LOCALE_OG[locale],
      alternateLocale: LOCALES.filter((entry) => entry !== locale).map(
        (entry) => LOCALE_OG[entry],
      ),
      title,
      description,
      url: canonical,
      images: [{ url: image }],
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: siteConfig.twitterHandle,
    },
  };
}

/** Maps API-owned SEO fields onto the metadata builder, with page fallbacks. */
export function metadataFromSeo(
  seo: SeoMeta | undefined,
  fallback: BuildMetadataInput,
): Metadata {
  return buildMetadata({
    ...fallback,
    title: seo?.title ?? fallback.title,
    description: seo?.description ?? fallback.description,
    path: seo?.canonicalPath ?? fallback.path,
    imageUrl: seo?.ogImageUrl ?? fallback.imageUrl,
    noIndex: seo?.noIndex ?? fallback.noIndex,
  });
}

/**
 * JSON-LD is emitted as a plain object and serialised by the caller. Schema
 * choice per entity is intentionally left to the domain that owns the entity.
 */
export function jsonLdScriptProps(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    /* `<` is escaped so text someone else wrote — a job description, a
       review — can never close the script tag and run as markup. The JSON is
       unchanged for any parser. */
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") },
  } as const;
}
