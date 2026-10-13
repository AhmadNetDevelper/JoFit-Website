import type { RawBrand } from "./types";

export const mockBrands: readonly RawBrand[] = [
  {
    id: "brand-apex",
    slug: "apex",
    // Brand names are proper nouns and are never translated.
    name: "Apex",
    description: { en: "Team sports equipment.", ar: "معدات الرياضات الجماعية." },
  },
  {
    id: "brand-northline",
    slug: "northline",
    name: "Northline",
    description: { en: "Outdoor and endurance gear.", ar: "معدات الأنشطة الخارجية والتحمّل." },
  },
  {
    id: "brand-corefit",
    slug: "corefit",
    name: "CoreFit",
    description: { en: "Strength and conditioning.", ar: "القوة واللياقة." },
  },
];
