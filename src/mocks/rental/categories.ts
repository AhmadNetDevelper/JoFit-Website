import type { LocalizedText } from "@/i18n";

export interface RawRentalCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  readonly parentId: string | null;
  readonly sportIds: readonly string[];
}

/**
 * THE TREE IS REAL, not a flat list with a `parentId` column nobody sets.
 *
 * Cycling has two branches because a visitor looking for a road bike and a
 * visitor looking for a trail bike are not the same visitor, and flattening
 * them into four peers throws away the one piece of structure the fleet
 * actually has. `/rental/categories/[slug]` reads it twice — the rail marks the
 * branch a child sits in, and the breadcrumb walks the same path.
 */
export const mockRentalCategories: readonly RawRentalCategory[] = [
  {
    id: "rcat-water",
    slug: "water-sports",
    name: { en: "Water Sports", ar: "الرياضات المائية" },
    description: {
      en: "Paddle boards, kayaks and open-water gear.",
      ar: "ألواح تجديف وقوارب كاياك ومعدات المياه المفتوحة.",
    },
    parentId: null,
    sportIds: ["sport-water-sports", "sport-swimming"],
  },
  {
    id: "rcat-cycling",
    slug: "cycling",
    name: { en: "Cycling", ar: "ركوب الدراجات" },
    description: { en: "Road, gravel and trail bikes.", ar: "دراجات الطرق والحصى والمسارات الجبلية." },
    parentId: null,
    sportIds: ["sport-cycling"],
  },
  {
    id: "rcat-cycling-road",
    slug: "road-and-gravel",
    name: { en: "Road & Gravel", ar: "الطرق والحصى" },
    description: {
      en: "Drop-bar bikes for sealed roads and hardpack.",
      ar: "دراجات بمقود منحنٍ للطرق المعبّدة والدروب الصلبة.",
    },
    parentId: "rcat-cycling",
    sportIds: ["sport-cycling"],
  },
  {
    id: "rcat-cycling-trail",
    slug: "mountain-and-trail",
    name: { en: "Mountain & Trail", ar: "الجبال والمسارات" },
    description: {
      en: "Suspension bikes for rocky ground and descents.",
      ar: "دراجات بمساعدات للأرض الوعرة والمنحدرات.",
    },
    parentId: "rcat-cycling",
    sportIds: ["sport-cycling", "sport-outdoor"],
  },
  {
    id: "rcat-camping",
    slug: "camping",
    name: { en: "Camping & Outdoor", ar: "التخييم والأنشطة الخارجية" },
    description: {
      en: "Tents, packs and expedition equipment.",
      ar: "خيام وحقائب ومعدات الرحلات.",
    },
    parentId: null,
    sportIds: ["sport-outdoor"],
  },
  {
    id: "rcat-facility",
    slug: "facilities",
    name: { en: "Facilities", ar: "المرافق" },
    description: {
      en: "Courts, pitches and training halls by the hour.",
      ar: "ملاعب وصالات تدريب بالساعة.",
    },
    parentId: null,
    sportIds: ["sport-football", "sport-basketball", "sport-tennis"],
  },
];
