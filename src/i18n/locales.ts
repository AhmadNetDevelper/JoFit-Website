/**
 * The platform is bilingual: English and Arabic, with Arabic written
 * right-to-left.
 *
 * Locale is a routing concept here, not a client toggle: it is the first path
 * segment (`/en/shop`, `/ar/shop`). A public, indexable site needs one stable
 * URL per language — a client-side switcher would leave both languages sharing
 * one URL, which search engines cannot index separately and users cannot share.
 */
export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export type TextDirection = "ltr" | "rtl";

export const LOCALE_DIRECTION: Readonly<Record<Locale, TextDirection>> = {
  en: "ltr",
  ar: "rtl",
};

/** Endonyms: each language is named in itself, never translated. */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ar: "العربية",
};

/**
 * BCP-47 tags handed to `Intl`.
 *
 * Arabic is pinned to `-u-nu-latn` so prices and dates render with Latin digits
 * (1234), which is what Jordanian commerce uses. Dropping that subtag switches to
 * Arabic-Indic digits (١٢٣٤) — a one-line change here.
 */
export const LOCALE_TAGS: Readonly<Record<Locale, string>> = {
  en: "en-GB",
  ar: "ar-JO-u-nu-latn",
};

/** `hreflang` takes a bare language subtag, or language-region. */
export const LOCALE_HREFLANG: Readonly<Record<Locale, string>> = {
  en: "en",
  ar: "ar",
};

/**
 * OpenGraph's `locale` is NOT hreflang, and reusing one for the other was a
 * silent failure.
 *
 * The spec requires `language_TERRITORY` with an underscore — `en_GB`, `ar_JO`.
 * A bare `en` is not a value OpenGraph accepts, so Facebook, WhatsApp and
 * LinkedIn discard the tag and fall back to guessing the page's language from
 * its content. On a bilingual site that is exactly the guess you do not want a
 * scraper making.
 */
export const LOCALE_OG: Readonly<Record<Locale, string>> = {
  en: "en_GB",
  ar: "ar_JO",
};

export function localeDirection(locale: Locale): TextDirection {
  return LOCALE_DIRECTION[locale];
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Builds a locale-prefixed path: `localePath("ar", "/shop")` → `/ar/shop`. */
export function localePath(locale: Locale, path = "/"): string {
  const normalised = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalised}`;
}

/** Strips the locale prefix, so a language switcher can rebuild the same page. */
export function stripLocale(pathname: string): string {
  const match = /^\/(en|ar)(?=\/|$)/.exec(pathname);
  if (!match) return pathname || "/";
  return pathname.slice(match[0].length) || "/";
}
