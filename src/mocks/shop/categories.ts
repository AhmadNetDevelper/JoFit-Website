import type { RawProductCategory } from "./types";

export const mockProductCategories: readonly RawProductCategory[] = [
  {
    id: "cat-equipment",
    slug: "equipment",
    name: { en: "Equipment", ar: "المعدات" },
    description: {
      en: "Balls, racquets and training hardware.",
      ar: "كرات ومضارب وأدوات تدريب.",
    },
    parentId: null,
    sportIds: ["sport-football", "sport-basketball", "sport-tennis"],
  },
  {
    id: "cat-apparel",
    slug: "apparel",
    name: { en: "Apparel", ar: "الملابس" },
    description: {
      en: "Training and match-day clothing.",
      ar: "ملابس التدريب والمباريات.",
    },
    parentId: null,
    sportIds: ["sport-football", "sport-running", "sport-fitness"],
  },
  {
    id: "cat-footwear",
    slug: "footwear",
    name: { en: "Footwear", ar: "الأحذية" },
    description: { en: "Court, pitch and road footwear.", ar: "أحذية الملاعب والطرق." },
    parentId: "cat-apparel",
    sportIds: ["sport-running", "sport-basketball"],
  },
  {
    id: "cat-strength",
    slug: "strength",
    name: { en: "Strength & Conditioning", ar: "القوة والتأهيل" },
    description: {
      en: "Weights, bands and recovery tools.",
      ar: "أثقال وأحزمة وأدوات استشفاء.",
    },
    parentId: null,
    sportIds: ["sport-fitness", "sport-gym"],
  },
];
