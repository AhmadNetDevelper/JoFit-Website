import type { RentalCondition, RentalRate } from "@/features/rental";
import type { LocalizedText } from "@/i18n";
import type { Media, Money, RatingSummary } from "@/types";

import { mockRentalLocations, type RawRentalLocation } from "./locations";

export interface RawRentalItem {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly media: readonly Media[];
  readonly rates: readonly RentalRate[];
  readonly deposit?: Money;
  /** Localized: a collection point is displayed text — see `locations.ts`. */
  readonly location: RawRentalLocation;
  readonly condition: RentalCondition;
  readonly totalUnits: number;
  readonly rating: RatingSummary;
  readonly publishedAt: string;
}

const jod = (amount: number): Money => ({ amount, currency: "JOD" });

/** Depots are looked up by id so a typo is a boot failure, not a blank card. */
const depot = (id: string): RawRentalLocation => {
  const found = mockRentalLocations.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown rental depot "${id}"`);
  return found;
};

const amman = depot("loc-amman");
const irbid = depot("loc-irbid");
const aqaba = depot("loc-aqaba");

/**
 * Listing dates are RELATIVE, never typed in.
 *
 * A fixture pinned to the afternoon it was written sorts "newest" into nonsense
 * a month later and dates the whole fleet to last spring. Same rule as
 * `buildCoachSlots`: the number of days is the fixture, the date is derived.
 */
const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/*
 * MEDIA IS EMPTY ON PURPOSE.
 *
 * The client has supplied no photography. These previously pointed at
 * `/images/placeholder-rental.svg` — a grey rectangle with the word
 * "placeholder" across it — and a grid of those reads as a broken page, not as
 * a page awaiting photographs. `rental-media.tsx` draws a brand-tinted tile
 * from tokens instead, and it disappears on its own the moment a real image
 * lands in this array.
 */
export const mockRentalItems: readonly RawRentalItem[] = [
  /* ---------------------------------------------------------------- WATER */
  {
    id: "rent-paddleboard",
    slug: "inflatable-paddleboard",
    title: { en: "Inflatable Paddleboard", ar: "لوح تجديف قابل للنفخ" },
    summary: {
      en: "10'6\" all-round board with pump, paddle and leash.",
      ar: "لوح متعدد الاستخدامات 10'6 مع منفاخ ومجداف وحبل أمان.",
    },
    description: {
      en: "A stable all-round board suited to flat water and light chop. Collected inflated or packed, by request.",
      ar: "لوح ثابت مناسب للمياه الهادئة والموج الخفيف. يُستلم منفوخاً أو مطوياً حسب الطلب.",
    },
    categoryIds: ["rcat-water"],
    sportIds: ["sport-water-sports"],
    media: [],
    rates: [
      { unit: "day", price: jod(18_000), minUnits: 1, maxUnits: 14 },
      { unit: "week", price: jod(95_000), minUnits: 1, maxUnits: 4 },
    ],
    deposit: jod(100_000),
    location: aqaba,
    condition: "excellent",
    totalUnits: 6,
    rating: { average: 4.7, count: 29 },
    publishedAt: daysAgo(188),
  },
  {
    id: "rent-sea-kayak",
    slug: "sea-kayak",
    title: { en: "Sea Kayak", ar: "قارب كاياك بحري" },
    summary: {
      en: "Sit-on-top single with paddle, pump and buoyancy aid.",
      ar: "كاياك مفتوح لشخص واحد مع مجداف ومضخة وسترة نجاة.",
    },
    description: {
      en: "A forgiving sit-on-top for coastal paddling. Hatches are dry-tested before every hire and the buoyancy aid is sized on collection.",
      ar: "كاياك مفتوح سهل الاستخدام للتجديف الساحلي. تُفحص الحجيرات قبل كل تأجير، وتُقاس سترة النجاة عند الاستلام.",
    },
    categoryIds: ["rcat-water"],
    sportIds: ["sport-water-sports"],
    media: [],
    rates: [
      { unit: "day", price: jod(22_000), minUnits: 1, maxUnits: 10 },
      { unit: "week", price: jod(110_000), minUnits: 1, maxUnits: 3 },
    ],
    deposit: jod(120_000),
    location: aqaba,
    condition: "good",
    totalUnits: 4,
    rating: { average: 4.6, count: 18 },
    publishedAt: daysAgo(96),
  },
  {
    id: "rent-wetsuit",
    slug: "shorty-wetsuit",
    title: { en: "Shorty Wetsuit (3/2 mm)", ar: "بدلة غطس قصيرة (3/2 مم)" },
    summary: {
      en: "Warm-water shorty, sizes S to XL.",
      ar: "بدلة قصيرة للمياه الدافئة، مقاسات S إلى XL.",
    },
    description: {
      en: "Flatlock-seam shorty for summer water. Rinsed and dried between hires; the size is confirmed when you collect.",
      ar: "بدلة بخياطة مسطّحة لمياه الصيف. تُغسل وتُجفّف بين كل تأجير، ويُثبّت المقاس عند الاستلام.",
    },
    categoryIds: ["rcat-water"],
    sportIds: ["sport-water-sports", "sport-swimming"],
    media: [],
    rates: [
      { unit: "day", price: jod(8_000), minUnits: 1, maxUnits: 14 },
      { unit: "week", price: jod(40_000), minUnits: 1, maxUnits: 4 },
    ],
    location: aqaba,
    condition: "fair",
    totalUnits: 10,
    rating: { average: 4.1, count: 6 },
    publishedAt: daysAgo(41),
  },

  /* -------------------------------------------------------------- CYCLING */
  {
    id: "rent-gravel-bike",
    slug: "gravel-bike",
    title: { en: "Gravel Bike", ar: "دراجة طرق وعرة" },
    summary: {
      en: "Carbon-fork gravel bike with 40 mm tyres.",
      ar: "دراجة بشوكة كربون وإطارات 40 مم.",
    },
    description: {
      en: "Set up for mixed-surface days. Includes helmet, pump and a saddle bag with tubes and levers.",
      ar: "مجهّزة للطرق المختلطة. تشمل خوذة ومنفاخاً وحقيبة سرج مع أنابيب وأدوات.",
    },
    categoryIds: ["rcat-cycling-road", "rcat-cycling"],
    sportIds: ["sport-cycling", "sport-outdoor"],
    media: [],
    rates: [
      { unit: "day", price: jod(25_000), minUnits: 1, maxUnits: 21 },
      { unit: "week", price: jod(130_000), minUnits: 1, maxUnits: 6 },
    ],
    deposit: jod(200_000),
    location: amman,
    condition: "good",
    totalUnits: 4,
    rating: { average: 4.5, count: 41 },
    publishedAt: daysAgo(232),
  },
  {
    id: "rent-road-bike",
    slug: "endurance-road-bike",
    title: { en: "Endurance Road Bike", ar: "دراجة طريق للمسافات" },
    summary: {
      en: "Long-distance geometry with a compact chainset.",
      ar: "هندسة مريحة للمسافات الطويلة مع طقم تروس مدمج.",
    },
    description: {
      en: "Built for the climbs out of the valley: relaxed geometry, wide-range gearing and 28 mm tyres. Helmet and pedals included, cleats on request.",
      ar: "مصمّمة لصعود المرتفعات: هندسة مريحة وتروس واسعة المدى وإطارات 28 مم. تشمل الخوذة والدواسات، والمشابك حسب الطلب.",
    },
    categoryIds: ["rcat-cycling-road", "rcat-cycling"],
    sportIds: ["sport-cycling"],
    media: [],
    rates: [
      { unit: "day", price: jod(28_000), minUnits: 1, maxUnits: 21 },
      { unit: "week", price: jod(145_000), minUnits: 1, maxUnits: 6 },
    ],
    deposit: jod(220_000),
    location: amman,
    condition: "excellent",
    totalUnits: 3,
    rating: { average: 4.8, count: 33 },
    publishedAt: daysAgo(64),
  },
  {
    id: "rent-trail-bike",
    slug: "trail-mountain-bike",
    title: { en: "Trail Mountain Bike", ar: "دراجة جبلية للمسارات" },
    summary: {
      en: "120 mm full suspension on 29\" wheels.",
      ar: "مساعدات كاملة 120 مم بعجلات 29 إنش.",
    },
    description: {
      en: "A trail bike for rocky ground and long descents. Suspension is serviced on a fixed interval and the fork is set to your weight at collection.",
      ar: "دراجة مسارات للأرض الصخرية والمنحدرات الطويلة. تُصان المساعدات دورياً وتُضبط الشوكة على وزنك عند الاستلام.",
    },
    categoryIds: ["rcat-cycling-trail", "rcat-cycling"],
    sportIds: ["sport-cycling", "sport-outdoor"],
    media: [],
    rates: [
      { unit: "day", price: jod(26_000), minUnits: 1, maxUnits: 14 },
      { unit: "week", price: jod(135_000), minUnits: 1, maxUnits: 4 },
    ],
    deposit: jod(200_000),
    location: irbid,
    condition: "good",
    totalUnits: 5,
    rating: { average: 4.4, count: 22 },
    publishedAt: daysAgo(120),
  },
  {
    id: "rent-ebike-trail",
    slug: "electric-trail-bike",
    title: { en: "Electric Trail Bike", ar: "دراجة كهربائية للمسارات" },
    summary: {
      en: "Mid-drive e-bike with a spare battery.",
      ar: "دراجة كهربائية بمحرّك أوسط مع بطارية احتياطية.",
    },
    description: {
      en: "Two batteries, a charger and a rack-mounted case. Range depends on the ground; the desk will talk it through before you take it out.",
      ar: "بطاريتان وشاحن وحقيبة مثبّتة على الحمّالة. يعتمد المدى على طبيعة الأرض، ويشرحه الموظف قبل الخروج.",
    },
    categoryIds: ["rcat-cycling-trail", "rcat-cycling"],
    sportIds: ["sport-cycling", "sport-outdoor"],
    media: [],
    rates: [
      { unit: "day", price: jod(45_000), minUnits: 1, maxUnits: 7 },
      { unit: "week", price: jod(240_000), minUnits: 1, maxUnits: 2 },
    ],
    deposit: jod(350_000),
    location: amman,
    condition: "new",
    totalUnits: 2,
    rating: { average: 4.9, count: 11 },
    publishedAt: daysAgo(17),
  },

  /* -------------------------------------------------------------- CAMPING */
  {
    id: "rent-expedition-tent",
    slug: "expedition-tent-3p",
    title: { en: "Expedition Tent (3 person)", ar: "خيمة رحلات (3 أشخاص)" },
    summary: {
      en: "Four-season tent rated for exposed camps.",
      ar: "خيمة لأربعة فصول مناسبة للمخيمات المكشوفة.",
    },
    description: {
      en: "Double-wall geodesic tent with a full-coverage fly and reinforced guy points.",
      ar: "خيمة مزدوجة الجدار بغطاء كامل ونقاط تثبيت معزّزة.",
    },
    categoryIds: ["rcat-camping"],
    sportIds: ["sport-outdoor"],
    media: [],
    rates: [{ unit: "day", price: jod(15_000), minUnits: 2, maxUnits: 30 }],
    deposit: jod(80_000),
    location: amman,
    condition: "good",
    totalUnits: 3,
    rating: { average: 4.3, count: 12 },
    publishedAt: daysAgo(256),
  },
  {
    id: "rent-trekking-pack",
    slug: "trekking-pack-65l",
    title: { en: "Trekking Pack (65 L)", ar: "حقيبة رحلات (65 لتر)" },
    summary: {
      en: "Adjustable-back pack with a rain cover.",
      ar: "حقيبة بظهر قابل للتعديل مع غطاء مطر.",
    },
    description: {
      en: "A load-carrying pack for multi-day walking. The back length is adjusted and the hip belt fitted when you collect it.",
      ar: "حقيبة لحمل الأثقال في المشي متعدد الأيام. يُعدَّل طول الظهر ويُضبط حزام الخصر عند الاستلام.",
    },
    categoryIds: ["rcat-camping"],
    sportIds: ["sport-outdoor", "sport-running"],
    media: [],
    rates: [
      { unit: "day", price: jod(7_000), minUnits: 1, maxUnits: 21 },
      { unit: "week", price: jod(35_000), minUnits: 1, maxUnits: 4 },
    ],
    location: irbid,
    condition: "fair",
    totalUnits: 8,
    rating: { average: 4.0, count: 9 },
    publishedAt: daysAgo(74),
  },
  {
    /* The one listing with no reviews at all. A fixture where every card has a
       rating never exercises the "no reviews yet" line, and that is the state
       that ships broken. */
    id: "rent-camp-stove",
    slug: "expedition-stove-set",
    title: { en: "Expedition Stove Set", ar: "طقم موقد رحلات" },
    summary: {
      en: "Windproof burner, pot set and a gas adaptor.",
      ar: "موقد مقاوم للرياح مع طقم قدور ووصلة غاز.",
    },
    description: {
      en: "A remote-canister burner that stays lit in wind, with a two-pot set and a lid that doubles as a pan. Gas is sold, not hired.",
      ar: "موقد بأسطوانة منفصلة يبقى مشتعلاً في الرياح، مع طقم قدرين وغطاء يصلح مقلاة. الغاز يُباع ولا يُؤجَّر.",
    },
    categoryIds: ["rcat-camping"],
    sportIds: ["sport-outdoor"],
    media: [],
    rates: [{ unit: "day", price: jod(5_000), minUnits: 1, maxUnits: 21 }],
    deposit: jod(25_000),
    location: amman,
    condition: "new",
    totalUnits: 12,
    rating: { average: 0, count: 0 },
    publishedAt: daysAgo(9),
  },

  /* ------------------------------------------------------------ FACILITIES */
  {
    id: "rent-indoor-court",
    slug: "indoor-basketball-court",
    title: { en: "Indoor Basketball Court", ar: "ملعب كرة سلة مغلق" },
    summary: {
      en: "Full-size indoor court, booked by the hour.",
      ar: "ملعب مغلق بحجم كامل، يُحجز بالساعة.",
    },
    description: {
      en: "Sprung hardwood court with adjustable hoops and changing rooms. Floodlights included after 18:00.",
      ar: "أرضية خشبية مرنة مع سلال قابلة للتعديل وغرف تبديل. الإضاءة مشمولة بعد الساعة 6 مساءً.",
    },
    categoryIds: ["rcat-facility"],
    sportIds: ["sport-basketball"],
    media: [],
    rates: [{ unit: "hour", price: jod(30_000), minUnits: 1, maxUnits: 8 }],
    location: amman,
    condition: "excellent",
    totalUnits: 2,
    rating: { average: 4.8, count: 57 },
    publishedAt: daysAgo(152),
  },
  {
    id: "rent-five-a-side",
    slug: "five-a-side-pitch",
    title: { en: "Five-a-side Pitch", ar: "ملعب خماسي" },
    summary: {
      en: "Floodlit artificial pitch with covered benches.",
      ar: "ملعب صناعي مضاء مع مقاعد مظلّلة.",
    },
    description: {
      en: "Third-generation surface with fixed goals and a covered bench each side. Bibs and two match balls come with the slot.",
      ar: "أرضية صناعية من الجيل الثالث بمرميين ثابتين ومقاعد مظلّلة على الجانبين. تشمل الحجز صدريات وكرتي مباراة.",
    },
    categoryIds: ["rcat-facility"],
    sportIds: ["sport-football"],
    media: [],
    rates: [{ unit: "hour", price: jod(22_000), minUnits: 1, maxUnits: 6 }],
    location: irbid,
    condition: "good",
    totalUnits: 3,
    rating: { average: 4.6, count: 34 },
    publishedAt: daysAgo(83),
  },
  {
    /* One physical unit, so its calendar is genuinely tight — this is the
       listing that shows the "booked out" signal rather than a green dot. */
    id: "rent-training-hall",
    slug: "training-hall",
    title: { en: "Training Hall", ar: "صالة تدريب" },
    summary: {
      en: "Matted hall for classes and martial arts.",
      ar: "صالة مفروشة بالحصائر للحصص وفنون القتال.",
    },
    description: {
      en: "A matted hall with mirrors, a sound system and storage for pads. One hall, so weekday evenings go early.",
      ar: "صالة مفروشة بالحصائر مع مرايا ونظام صوت ومخزن للواقيات. صالة واحدة فقط، لذا تُحجز أمسيات أيام العمل مبكراً.",
    },
    categoryIds: ["rcat-facility"],
    sportIds: ["sport-martial-arts", "sport-fitness"],
    media: [],
    rates: [{ unit: "hour", price: jod(18_000), minUnits: 1, maxUnits: 5 }],
    location: amman,
    condition: "good",
    totalUnits: 1,
    rating: { average: 4.2, count: 5 },
    publishedAt: daysAgo(30),
  },
];
