import type { Locale } from "@/i18n";

/**
 * The words inside variant titles, option values and product tags.
 *
 * The fixtures keep those as plain English strings because the values double
 * as KEYS — `variant.selections.Colour === "Black"` is how a variant is found —
 * so translating them in place would break the lookup. The adapter translates
 * a copy for display instead, which is what the API does too: it answers the
 * key and, beside it, the label in the requested locale.
 *
 * Sizes (S, M, 42) and numbers stay as they are: Jordanian shops print them
 * in Latin on Arabic pages as well.
 */
const AR_WORDS: Readonly<Record<string, string>> = {
  Size: "المقاس",
  Grip: "المقبض",
  kg: "كغ",
  Black: "أسود",
  Sand: "رملي",
  Slate: "رمادي",
  Clear: "شفافة",
  Smoke: "داكنة",
  Youth: "ناشئون",
  Senior: "كبار",
};

const TAGS: Readonly<Record<string, { en: string; ar: string }>> = {
  apparel: { en: "Apparel", ar: "ملابس" },
  barbell: { en: "Barbell", ar: "بار حديد" },
  club: { en: "Club", ar: "أندية" },
  court: { en: "Court", ar: "ملاعب" },
  grip: { en: "Grip", ar: "ثبات" },
  "home-gym": { en: "Home gym", ar: "صالة منزلية" },
  indoor: { en: "Indoor", ar: "داخلي" },
  match: { en: "Match", ar: "مباريات" },
  olympic: { en: "Olympic", ar: "أولمبي" },
  outdoor: { en: "Outdoor", ar: "خارجي" },
  pool: { en: "Pool", ar: "مسبح" },
  racquet: { en: "Racquet", ar: "مضرب" },
  recovery: { en: "Recovery", ar: "استشفاء" },
  sale: { en: "Sale", ar: "تخفيضات" },
  strength: { en: "Strength", ar: "قوة" },
  swim: { en: "Swim", ar: "سباحة" },
  team: { en: "Team", ar: "فرق" },
  trail: { en: "Trail", ar: "مسارات" },
  training: { en: "Training", ar: "تدريب" },
};

/** "Size 4" → "المقاس 4", "M / Black" → "M / أسود"; English unchanged. */
export function localizeLabel(text: string, locale: Locale): string {
  if (locale === "en") return text;
  return text.replace(/[A-Za-z]{2,}/g, (word) => AR_WORDS[word] ?? word);
}

/** A tag slug as a reader sees it, in either language. */
export function tagLabel(tag: string, locale: Locale): string {
  return TAGS[tag]?.[locale] ?? tag;
}
