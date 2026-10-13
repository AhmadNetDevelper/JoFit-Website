import type { Money } from "@/types";

import type { RawProduct } from "./types";

/** JOD has three minor digits: 25_000 renders as 25.000 JOD. */
const jod = (amount: number): Money => ({ amount, currency: "JOD" });

/*
 * NO `media` ANYWHERE, AND THAT IS THE CURRENT TRUTH.
 *
 * There is no product photography in this repo and none has been supplied. The
 * fixtures used to point at `/images/placeholder-product.svg` — a grey
 * rectangle with the words "product placeholder" printed on it — which the
 * grid rendered twelve of. `ProductMedia` now draws a brand-tinted tile with
 * the product's own category glyph instead: obviously not a photograph, which
 * is honest, and obviously designed, which a grey box is not.
 *
 * Put a real image in `media` and the tile disappears on its own. There is no
 * flag to remember.
 */
export const mockProducts: readonly RawProduct[] = [
  {
    id: "prod-match-football",
    slug: "apex-match-football",
    title: { en: "Apex Match Football", ar: "كرة قدم أبكس للمباريات" },
    summary: {
      en: "FIFA-quality match ball for competitive play.",
      ar: "كرة مباريات بمعايير الاتحاد الدولي للمنافسات.",
    },
    description: {
      en: "A thermally bonded match ball with a textured casing for consistent flight in wet and dry conditions.",
      ar: "كرة ملحومة حرارياً بغلاف محبّب لمسار ثابت في الأجواء الجافة والرطبة.",
    },
    brandId: "brand-apex",
    categoryIds: ["cat-equipment"],
    sportIds: ["sport-football"],
    media: [],
    options: [{ key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["4", "5"] }],
    variants: [
      {
        id: "var-match-football-4",
        sku: "APX-FB-04",
        title: "Size 4",
        selections: { Size: "4" },
        price: { current: jod(28_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-match-football-5",
        sku: "APX-FB-05",
        title: "Size 5",
        selections: { Size: "5" },
        price: { current: jod(32_000), compareAt: jod(38_000) },
        stockStatus: "low-stock",
      },
    ],
    defaultVariantId: "var-match-football-5",
    priceRange: { min: jod(28_000), max: jod(32_000) },
    rating: { average: 4.6, count: 38 },
    tags: ["match", "outdoor"],
    publishedAt: "2026-02-11",
  },
  {
    id: "prod-indoor-basketball",
    slug: "apex-indoor-basketball",
    title: { en: "Apex Indoor Basketball", ar: "كرة سلة أبكس للصالات" },
    summary: {
      en: "Composite leather ball tuned for indoor courts.",
      ar: "كرة جلد مركّب مخصصة للملاعب المغلقة.",
    },
    description: {
      en: "Deep-channel composite construction with a tacky finish that holds grip through long training blocks.",
      ar: "بناء مركّب بقنوات عميقة وسطح ماسك يحافظ على القبضة خلال التدريبات الطويلة.",
    },
    brandId: "brand-apex",
    categoryIds: ["cat-equipment"],
    sportIds: ["sport-basketball"],
    media: [],
    options: [{ key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["6", "7"] }],
    variants: [
      {
        id: "var-indoor-basketball-6",
        sku: "APX-BB-06",
        title: "Size 6",
        selections: { Size: "6" },
        price: { current: jod(34_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-indoor-basketball-7",
        sku: "APX-BB-07",
        title: "Size 7",
        selections: { Size: "7" },
        price: { current: jod(36_500) },
        stockStatus: "in-stock",
      },
    ],
    defaultVariantId: "var-indoor-basketball-7",
    priceRange: { min: jod(34_000), max: jod(36_500) },
    rating: { average: 4.4, count: 21 },
    tags: ["indoor"],
    publishedAt: "2026-03-02",
  },
  {
    id: "prod-trail-runner",
    slug: "northline-trail-runner",
    title: { en: "Northline Trail Runner", ar: "حذاء نورث لاين للجري الجبلي" },
    summary: {
      en: "Grip-first trail shoe for mixed terrain.",
      ar: "حذاء جري جبلي يركّز على الثبات في التضاريس المختلطة.",
    },
    description: {
      en: "A 6 mm-drop trail shoe with a rock plate and aggressive lugs for loose and rocky ground.",
      ar: "حذاء بفارق ارتفاع 6 مم مع صفيحة حماية ونتوءات قوية للأرض الصخرية وغير الثابتة.",
    },
    brandId: "brand-northline",
    categoryIds: ["cat-footwear", "cat-apparel"],
    sportIds: ["sport-running", "sport-outdoor"],
    media: [],
    options: [
      { key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["41", "42", "43"] },
      { key: "Colour", name: { en: "Colour", ar: "اللون" }, values: ["Slate"] },
    ],
    variants: [
      {
        id: "var-trail-runner-41",
        sku: "NL-TR-41",
        title: "41 / Slate",
        selections: { Size: "41", Colour: "Slate" },
        price: { current: jod(89_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-trail-runner-42",
        sku: "NL-TR-42",
        title: "42 / Slate",
        selections: { Size: "42", Colour: "Slate" },
        price: { current: jod(89_000) },
        stockStatus: "low-stock",
      },
      {
        id: "var-trail-runner-43",
        sku: "NL-TR-43",
        title: "43 / Slate",
        selections: { Size: "43", Colour: "Slate" },
        price: { current: jod(89_000) },
        stockStatus: "out-of-stock",
      },
    ],
    defaultVariantId: "var-trail-runner-42",
    priceRange: { min: jod(89_000), max: jod(89_000) },
    rating: { average: 4.8, count: 64 },
    tags: ["trail", "grip"],
    publishedAt: "2026-01-20",
  },
  {
    id: "prod-adjustable-dumbbell",
    slug: "corefit-adjustable-dumbbell",
    title: { en: "CoreFit Adjustable Dumbbell", ar: "دمبل كورفت قابل للتعديل" },
    summary: {
      en: "2–24 kg dial-adjustable dumbbell, sold singly.",
      ar: "دمبل قابل للتعديل من 2 إلى 24 كغم، يُباع بالقطعة.",
    },
    description: {
      en: "Replaces a full rack for home training. Dial selection in 2 kg increments with a locking cradle.",
      ar: "يغني عن رفّ أثقال كامل للتدريب المنزلي، بتدرّج 2 كغم وقاعدة تثبيت.",
    },
    brandId: "brand-corefit",
    categoryIds: ["cat-strength"],
    sportIds: ["sport-fitness", "sport-gym"],
    media: [],
    options: [],
    variants: [
      {
        id: "var-adjustable-dumbbell-default",
        sku: "CF-AD-24",
        title: "2–24 kg",
        selections: {},
        price: { current: jod(145_000), compareAt: jod(169_000) },
        stockStatus: "in-stock",
      },
    ],
    defaultVariantId: "var-adjustable-dumbbell-default",
    priceRange: { min: jod(145_000), max: jod(145_000) },
    rating: { average: 4.5, count: 52 },
    tags: ["home-gym", "strength"],
    publishedAt: "2026-04-08",
  },
  {
    id: "prod-training-tee",
    slug: "corefit-training-tee",
    title: { en: "CoreFit Training Tee", ar: "قميص تدريب كورفت" },
    summary: {
      en: "Breathable training top for gym and field sessions.",
      ar: "قميص تدريب يسمح بالتهوية للصالة والملعب.",
    },
    description: {
      en: "Moisture-wicking knit with flatlock seams to limit chafing during long sessions.",
      ar: "نسيج طارد للعرق بخياطة مسطحة تقلّل الاحتكاك في التدريبات الطويلة.",
    },
    brandId: "brand-corefit",
    categoryIds: ["cat-apparel"],
    sportIds: ["sport-fitness", "sport-running", "sport-football"],
    media: [],
    options: [
      { key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["S", "M", "L"] },
      { key: "Colour", name: { en: "Colour", ar: "اللون" }, values: ["Black", "Sand"] },
    ],
    variants: [
      {
        id: "var-training-tee-m-black",
        sku: "CF-TT-M-BK",
        title: "M / Black",
        selections: { Size: "M", Colour: "Black" },
        price: { current: jod(19_500) },
        stockStatus: "in-stock",
      },
      {
        id: "var-training-tee-l-black",
        sku: "CF-TT-L-BK",
        title: "L / Black",
        selections: { Size: "L", Colour: "Black" },
        price: { current: jod(19_500) },
        stockStatus: "in-stock",
      },
      {
        id: "var-training-tee-m-sand",
        sku: "CF-TT-M-SD",
        title: "M / Sand",
        selections: { Size: "M", Colour: "Sand" },
        price: { current: jod(21_000) },
        stockStatus: "pre-order",
      },
    ],
    defaultVariantId: "var-training-tee-m-black",
    priceRange: { min: jod(19_500), max: jod(21_000) },
    rating: { average: 4.1, count: 17 },
    tags: ["apparel"],
    publishedAt: "2026-05-14",
  },
  {
    id: "prod-tennis-racquet",
    slug: "apex-control-tennis-racquet",
    title: { en: "Apex Control Tennis Racquet", ar: "مضرب تنس أبكس كنترول" },
    summary: {
      en: "Control-oriented frame for intermediate players.",
      ar: "إطار يركّز على التحكم للاعبين المتوسطين.",
    },
    description: {
      en: "A 300 g unstrung frame with a dense string pattern, favouring placement over raw power.",
      ar: "إطار بوزن 300 غم بدون أوتار ونمط تشبيك كثيف يفضّل الدقة على القوة.",
    },
    brandId: "brand-apex",
    categoryIds: ["cat-equipment"],
    sportIds: ["sport-tennis"],
    media: [],
    options: [{ key: "Grip", name: { en: "Grip", ar: "المقبض" }, values: ["2", "3"] }],
    variants: [
      {
        id: "var-tennis-racquet-g2",
        sku: "APX-TR-G2",
        title: "Grip 2",
        selections: { Grip: "2" },
        price: { current: jod(112_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-tennis-racquet-g3",
        sku: "APX-TR-G3",
        title: "Grip 3",
        selections: { Grip: "3" },
        price: { current: jod(112_000) },
        stockStatus: "low-stock",
      },
    ],
    defaultVariantId: "var-tennis-racquet-g2",
    priceRange: { min: jod(112_000), max: jod(112_000) },
    rating: { average: 4.2, count: 11 },
    tags: ["racquet"],
    publishedAt: "2026-06-01",
  },
  /*
   * ---------------------------------------------------------------------------
   * THE SIX BELOW EXIST TO EXERCISE THE STATES THE FIRST SIX NEVER REACH.
   *
   * A fixture where every product is in stock, discounted by nothing and rated
   * by somebody teaches the grid only its happy path, and the empty and
   * disabled treatments then ship untested. So this half deliberately carries a
   * sold-out product, a pre-order, one with no reviews at all, one on sale
   * across every variant, a product with no options at all, and two priced as a
   * range wide enough to test the "from" label.
   * ------------------------------------------------------------------------- */
  {
    id: "prod-swim-goggles",
    slug: "northline-open-water-goggles",
    title: { en: "Northline Open-Water Goggles", ar: "نظّارة نورثلاين للمياه المفتوحة" },
    summary: {
      en: "Wide-lens goggles for lane swimming and open water.",
      ar: "نظّارة بعدسة واسعة للسباحة في الممرات والمياه المفتوحة.",
    },
    description: {
      en: "An anti-fog coating on a wide curved lens, with a split strap that holds through a tumble turn.",
      ar: "طبقة مانعة للضباب على عدسة منحنية واسعة، مع شريط مزدوج يثبت عند الدوران.",
    },
    brandId: "brand-northline",
    categoryIds: ["cat-equipment"],
    sportIds: ["sport-swimming", "sport-water-sports"],
    media: [],
    options: [{ key: "Tint", name: { en: "Tint", ar: "العدسة" }, values: ["Clear", "Smoke"] }],
    variants: [
      {
        id: "var-goggles-clear",
        sku: "NL-GG-CL",
        title: "Clear",
        selections: { Tint: "Clear" },
        price: { current: jod(19_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-goggles-smoke",
        sku: "NL-GG-SM",
        title: "Smoke",
        selections: { Tint: "Smoke" },
        price: { current: jod(21_000) },
        stockStatus: "in-stock",
      },
    ],
    defaultVariantId: "var-goggles-clear",
    priceRange: { min: jod(19_000), max: jod(21_000) },
    rating: { average: 4.5, count: 26 },
    tags: ["swim", "pool"],
    publishedAt: "2026-07-14",
  },
  {
    /* SOLD OUT. Its only variant is out of stock, so the card must show the
       disabled treatment and the detail page must refuse to add to cart. */
    id: "prod-competition-barbell",
    slug: "corefit-competition-barbell",
    title: { en: "CoreFit Competition Barbell", ar: "بار كورفت للمنافسات" },
    summary: {
      en: "A 20 kg calibrated bar with needle bearings.",
      ar: "بار معاير زنة 20 كغ بمحامل إبرية.",
    },
    description: {
      en: "A calibrated 20 kg bar on a 28 mm shaft with needle bearings, knurled to the marks used for the clean and jerk.",
      ar: "بار معاير زنة 20 كغ بقطر 28 مم ومحامل إبرية، محزّز بالعلامات المعتمدة لرفعة النتر والدفع.",
    },
    brandId: "brand-corefit",
    categoryIds: ["cat-strength"],
    sportIds: ["sport-gym", "sport-fitness"],
    media: [],
    options: [],
    variants: [
      {
        id: "var-barbell-20",
        sku: "CF-BB-20",
        title: "20 kg",
        selections: {},
        price: { current: jod(285_000) },
        stockStatus: "out-of-stock",
      },
    ],
    defaultVariantId: "var-barbell-20",
    priceRange: { min: jod(285_000), max: jod(285_000) },
    rating: { average: 4.9, count: 14 },
    tags: ["olympic", "barbell"],
    publishedAt: "2026-03-02",
  },
  {
    /* PRE-ORDER, and NO REVIEWS. A line that has only just been announced has
       neither stock nor ratings, and both absences have to render as something
       deliberate rather than as a zero. */
    id: "prod-recovery-boots",
    slug: "corefit-recovery-boots",
    title: { en: "CoreFit Recovery Boots", ar: "جزمة كورفت للاستشفاء" },
    summary: {
      en: "Compression recovery for the legs, across four pressure zones.",
      ar: "استشفاء بالضغط للساقين عبر أربع مناطق.",
    },
    description: {
      en: "Sequential compression from ankle to hip across four independent chambers, on a twenty-minute programme.",
      ar: "ضغط متتابع من الكاحل إلى الورك عبر أربع حجرات مستقلة، ضمن برنامج مدته عشرون دقيقة.",
    },
    brandId: "brand-corefit",
    categoryIds: ["cat-strength"],
    sportIds: ["sport-fitness", "sport-running"],
    media: [],
    options: [{ key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["M", "L"] }],
    variants: [
      {
        id: "var-boots-m",
        sku: "CF-RB-M",
        title: "M",
        selections: { Size: "M" },
        price: { current: jod(420_000) },
        stockStatus: "pre-order",
      },
      {
        id: "var-boots-l",
        sku: "CF-RB-L",
        title: "L",
        selections: { Size: "L" },
        price: { current: jod(420_000) },
        stockStatus: "pre-order",
      },
    ],
    defaultVariantId: "var-boots-m",
    priceRange: { min: jod(420_000), max: jod(420_000) },
    rating: { average: 0, count: 0 },
    tags: ["recovery"],
    publishedAt: "2026-09-08",
  },
  {
    /* ON SALE across every variant, and one size already gone. The only
       product whose card carries a struck-through price. */
    id: "prod-training-shorts",
    slug: "corefit-training-shorts",
    title: { en: "CoreFit Training Shorts", ar: "شورت كورفت للتدريب" },
    summary: {
      en: "Four-way stretch shorts with a zipped pocket.",
      ar: "شورت مطّاط بأربعة اتجاهات مع جيب بسحّاب.",
    },
    description: {
      en: "A woven four-way stretch with a flat waistband, a zipped back pocket and a seven-inch inseam.",
      ar: "نسيج مطّاط بأربعة اتجاهات مع حزام مستوٍ وجيب خلفي بسحّاب.",
    },
    brandId: "brand-corefit",
    categoryIds: ["cat-apparel"],
    sportIds: ["sport-fitness", "sport-gym", "sport-running"],
    media: [],
    options: [{ key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["S", "M", "L", "XL"] }],
    variants: [
      {
        id: "var-shorts-s",
        sku: "CF-SH-S",
        title: "S",
        selections: { Size: "S" },
        price: { current: jod(16_000), compareAt: jod(24_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-shorts-m",
        sku: "CF-SH-M",
        title: "M",
        selections: { Size: "M" },
        price: { current: jod(16_000), compareAt: jod(24_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-shorts-l",
        sku: "CF-SH-L",
        title: "L",
        selections: { Size: "L" },
        price: { current: jod(16_000), compareAt: jod(24_000) },
        stockStatus: "low-stock",
      },
      {
        id: "var-shorts-xl",
        sku: "CF-SH-XL",
        title: "XL",
        selections: { Size: "XL" },
        price: { current: jod(16_000), compareAt: jod(24_000) },
        stockStatus: "out-of-stock",
      },
    ],
    defaultVariantId: "var-shorts-m",
    priceRange: { min: jod(16_000), max: jod(16_000) },
    rating: { average: 4.3, count: 52 },
    tags: ["sale", "training"],
    publishedAt: "2026-05-20",
  },
  {
    id: "prod-club-bib-set",
    slug: "apex-club-training-bibs",
    title: { en: "Apex Club Training Bibs", ar: "صدريات تدريب أبكس للأندية" },
    summary: {
      en: "A set of ten mesh bibs in a carry bag.",
      ar: "طقم من عشر صدريات شبكية مع حقيبة.",
    },
    description: {
      en: "Ten numbered mesh bibs worn over a training kit, sized for senior and youth squads.",
      ar: "عشر صدريات شبكية مرقّمة تُلبس فوق طقم التدريب، بمقاسات للفئات العمرية والفرق الأولى.",
    },
    brandId: "brand-apex",
    categoryIds: ["cat-apparel", "cat-equipment"],
    sportIds: ["sport-football", "sport-basketball"],
    media: [],
    options: [{ key: "Age group", name: { en: "Age group", ar: "الفئة" }, values: ["Youth", "Senior"] }],
    variants: [
      {
        id: "var-bibs-youth",
        sku: "APX-BIB-Y",
        title: "Youth",
        selections: { "Age group": "Youth" },
        price: { current: jod(45_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-bibs-senior",
        sku: "APX-BIB-S",
        title: "Senior",
        selections: { "Age group": "Senior" },
        price: { current: jod(52_000) },
        stockStatus: "low-stock",
      },
    ],
    defaultVariantId: "var-bibs-senior",
    priceRange: { min: jod(45_000), max: jod(52_000) },
    rating: { average: 4.1, count: 9 },
    tags: ["club", "team"],
    publishedAt: "2026-04-18",
  },
  {
    id: "prod-court-shoe",
    slug: "apex-court-shoe",
    title: { en: "Apex Court Shoe", ar: "حذاء أبكس للملاعب المغلقة" },
    summary: {
      en: "An indoor court shoe on a gum outsole.",
      ar: "حذاء للملاعب المغلقة بنعل مطّاطي.",
    },
    description: {
      en: "A low-profile indoor shoe on a non-marking gum outsole, with a reinforced lateral cage for cutting.",
      ar: "حذاء منخفض للملاعب المغلقة بنعل مطّاطي لا يترك أثراً، وهيكل جانبي مقوّى للتغيير السريع.",
    },
    brandId: "brand-apex",
    categoryIds: ["cat-footwear", "cat-apparel"],
    sportIds: ["sport-basketball", "sport-tennis"],
    media: [],
    options: [{ key: "Size", name: { en: "Size", ar: "المقاس" }, values: ["41", "42", "43", "44"] }],
    variants: [
      {
        id: "var-court-41",
        sku: "APX-CS-41",
        title: "41",
        selections: { Size: "41" },
        price: { current: jod(68_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-court-42",
        sku: "APX-CS-42",
        title: "42",
        selections: { Size: "42" },
        price: { current: jod(68_000) },
        stockStatus: "in-stock",
      },
      {
        id: "var-court-43",
        sku: "APX-CS-43",
        title: "43",
        selections: { Size: "43" },
        price: { current: jod(68_000) },
        stockStatus: "out-of-stock",
      },
      {
        id: "var-court-44",
        sku: "APX-CS-44",
        title: "44",
        selections: { Size: "44" },
        price: { current: jod(68_000) },
        stockStatus: "in-stock",
      },
    ],
    defaultVariantId: "var-court-42",
    priceRange: { min: jod(68_000), max: jod(68_000) },
    rating: { average: 4.4, count: 31 },
    tags: ["indoor", "court"],
    publishedAt: "2026-08-05",
  },
];
