import type { LocalizedText } from "@/i18n";

/**
 * A DEPOT, before the adapter picks a language for it.
 *
 * These used to be plain English strings on the item (`"Aqaba Waterfront"`),
 * which meant `/ar/rental` showed an English place name in the corner of every
 * Arabic card, and the pickup filter compared a URL parameter against a label
 * the operator could retype at any time. Same fix as `mockSpecialisations` in
 * the coaches fixtures: an id plus a `LocalizedText`, resolved once in `toItem`
 * beside the title and the summary.
 *
 * A depot is a real thing a renter drives to, so the city is carried separately
 * from the site name — the card shows the city, the detail page shows both.
 */
export interface RawRentalLocation {
  readonly id: string;
  readonly name: LocalizedText;
  readonly city: LocalizedText;
  readonly countryCode: string;
}

export const mockRentalLocations: readonly RawRentalLocation[] = [
  {
    id: "loc-amman",
    name: { en: "Amman Hub", ar: "مركز عمّان" },
    city: { en: "Amman", ar: "عمّان" },
    countryCode: "JO",
  },
  {
    id: "loc-irbid",
    name: { en: "Irbid Centre", ar: "مركز إربد" },
    city: { en: "Irbid", ar: "إربد" },
    countryCode: "JO",
  },
  {
    id: "loc-aqaba",
    name: { en: "Aqaba Waterfront", ar: "واجهة العقبة البحرية" },
    city: { en: "Aqaba", ar: "العقبة" },
    countryCode: "JO",
  },
];
