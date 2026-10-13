import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * The shape localized content arrives in *before* the data layer resolves it.
 *
 * The storefront's domain models carry plain `string` — a public page needs one
 * language, and shipping the other is waste. Resolution happens in the service
 * adapter, exactly where a real API would do it from an `Accept-Language` header
 * or a `?locale=` parameter.
 *
 * So this type appears only in `src/mocks` and in the adapters that read them.
 * No component ever sees it. (The admin is the opposite: it stores every
 * language, because staff edit them all.)
 */
export type LocalizedText = Readonly<Partial<Record<Locale, string>>>;

/**
 * Falls back to the default locale, then to any non-empty value, so a page never
 * renders blank because one translation is missing.
 */
export function resolveText(text: LocalizedText, locale: Locale): string {
  const exact = text[locale];
  if (exact && exact.trim() !== "") return exact;

  const fallback = text[DEFAULT_LOCALE];
  if (fallback && fallback.trim() !== "") return fallback;

  return Object.values(text).find((value) => value && value.trim() !== "") ?? "";
}
