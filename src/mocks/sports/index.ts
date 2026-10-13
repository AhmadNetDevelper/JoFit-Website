import type { LocalizedText } from "@/i18n";
import type { MediaImage } from "@/types";

/**
 * Raw fixtures hold every language; the adapter resolves one.
 *
 * `Raw*` types live here rather than in the feature, because they describe the
 * *source* shape — the same role a wire-format type will play for the HTTP
 * adapter. The feature's own types stay resolved and language-free.
 */
export interface RawSport {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly iconKey?: string;
  readonly isFeatured: boolean;
  /** Absent from every fixture; set by staff through the admin (`../catalogue-images.ts`). */
  readonly image?: MediaImage;
}

export const mockSports: readonly RawSport[] = [
  {
    id: "sport-football",
    slug: "football",
    name: { en: "Football", ar: "كرة القدم" },
    description: {
      en: "Pitch sports, team training and match-day equipment.",
      ar: "رياضات الملاعب وتدريب الفرق ومعدات المباريات.",
    },
    iconKey: "football",
    isFeatured: true,
  },
  {
    id: "sport-basketball",
    slug: "basketball",
    name: { en: "Basketball", ar: "كرة السلة" },
    description: {
      en: "Court equipment, training aids and skills coaching.",
      ar: "معدات الملاعب وأدوات التدريب وتطوير المهارات.",
    },
    iconKey: "basketball",
    isFeatured: true,
  },
  {
    id: "sport-tennis",
    slug: "tennis",
    name: { en: "Tennis", ar: "التنس" },
    description: {
      en: "Racquets, court hire and technique coaching.",
      ar: "المضارب وحجز الملاعب وتدريب التكنيك.",
    },
    iconKey: "tennis",
    isFeatured: true,
  },
  {
    id: "sport-swimming",
    slug: "swimming",
    name: { en: "Swimming", ar: "السباحة" },
    description: {
      en: "Pool training, safety gear and stroke coaching.",
      ar: "التدريب في المسابح ومعدات السلامة وتحسين السباحة.",
    },
    iconKey: "swimming",
    isFeatured: false,
  },
  {
    id: "sport-running",
    slug: "running",
    name: { en: "Running", ar: "الجري" },
    description: {
      en: "Road and trail running gear, plans and events.",
      ar: "معدات الجري على الطرق والجبال وبرامج وفعاليات.",
    },
    iconKey: "running",
    isFeatured: true,
  },
  {
    id: "sport-fitness",
    slug: "fitness",
    name: { en: "Fitness", ar: "اللياقة البدنية" },
    description: {
      en: "General conditioning, mobility and home training.",
      ar: "اللياقة العامة والمرونة والتدريب المنزلي.",
    },
    iconKey: "fitness",
    isFeatured: true,
  },
  {
    id: "sport-gym",
    slug: "gym",
    name: { en: "Gym", ar: "الصالة الرياضية" },
    description: {
      en: "Strength equipment, facility fit-out and programming.",
      ar: "معدات القوة وتجهيز الصالات وبناء البرامج.",
    },
    iconKey: "gym",
    isFeatured: false,
  },
  {
    id: "sport-martial-arts",
    slug: "martial-arts",
    name: { en: "Martial Arts", ar: "الفنون القتالية" },
    description: {
      en: "Striking, grappling and protective equipment.",
      ar: "اللكم والمصارعة ومعدات الحماية.",
    },
    iconKey: "martial-arts",
    isFeatured: false,
  },
  {
    id: "sport-cycling",
    slug: "cycling",
    name: { en: "Cycling", ar: "ركوب الدراجات" },
    description: {
      en: "Road, gravel and indoor cycling.",
      ar: "دراجات الطرق والطرق الوعرة والتدريب الداخلي.",
    },
    iconKey: "cycling",
    isFeatured: false,
  },
  {
    id: "sport-outdoor",
    slug: "outdoor",
    name: { en: "Outdoor", ar: "الأنشطة الخارجية" },
    description: {
      en: "Hiking, camping and expedition equipment.",
      ar: "معدات المشي والتخييم والرحلات.",
    },
    iconKey: "outdoor",
    isFeatured: false,
  },
  {
    id: "sport-water-sports",
    slug: "water-sports",
    name: { en: "Water Sports", ar: "الرياضات المائية" },
    description: {
      en: "Paddle, surf and open-water activities.",
      ar: "التجديف وركوب الأمواج وأنشطة المياه المفتوحة.",
    },
    iconKey: "water-sports",
    isFeatured: false,
  },
];
