import { getDictionary, type TranslationKey } from "./dictionaries";
import type { Locale } from "./locales";

export type Translate = (
  key: TranslationKey,
  values?: Readonly<Record<string, string | number>>,
) => string;

function interpolate(
  template: string,
  values?: Readonly<Record<string, string | number>>,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Returns a translator for a locale.
 *
 * Server Components call this directly — no provider, no context, no client
 * JavaScript. Only the handful of Client Components that need strings receive
 * them as props (see `SiteHeader` → `CartIndicator`).
 *
 * Interpolation exists because word order differs between English and Arabic:
 * sentences must stay whole and reorderable, never concatenated from fragments.
 */
export function getTranslator(locale: Locale): Translate {
  const dictionary = getDictionary(locale);
  return (key, values) => interpolate(dictionary[key], values);
}
