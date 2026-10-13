import type { Certification, CoachAvailabilitySlot, CoachSessionMode } from "@/features/coaches";
import type { LocalizedText } from "@/i18n";
import type { Media, MediaImage, Money, RatingSummary } from "@/types";

/**
 * Coaches author their own profiles, so `headline` and `bio` are localized:
 * a bilingual storefront must be able to show an Arabic profile.
 *
 * Everything else a profile displays is an ID, not a display string — the
 * specialisation, the language, the city. Free text there meant `/ar/coaches`
 * showed "Amman" and "Strength & Conditioning" in English next to Arabic prose,
 * and it meant a filter compared a URL parameter against a label a coach could
 * retype at any time. The adapter resolves each id to one language, in the same
 * place it resolves the headline.
 *
 * OPEN BUSINESS DECISION: whether coaches are required to supply both languages
 * for the free-text fields, and who translates when they do not.
 */
export interface RawCoachPackage {
  readonly id: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: CoachSessionMode;
  readonly price: Money;
  readonly compareAtPrice?: Money;
}

export interface RawCoach {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly headline: LocalizedText;
  readonly bio: LocalizedText;
  readonly sportIds: readonly string[];
  /** Ids into `mockSpecialisations`. */
  readonly specializations: readonly string[];
  readonly certifications: readonly Certification[];
  readonly yearsOfExperience: number;
  /** BCP-47 codes, keys of `LANGUAGE_NAMES`. */
  readonly languages: readonly string[];
  readonly location: RawCoachLocation;
  readonly isRemoteAvailable: boolean;
  readonly sessionRate?: Money;
  readonly packages: readonly RawCoachPackage[];
  readonly completedSessions: number;
  readonly responseTimeHours: number;
  readonly avatar?: MediaImage;
  readonly gallery: readonly Media[];
  readonly rating: RatingSummary;
  readonly publishedAt: string;
}

const jod = (amount: number): Money => ({ amount, currency: "JOD" });

/** A venue, before the adapter picks a language for it. */
export interface RawCoachLocation {
  readonly id: string;
  readonly name: LocalizedText;
  readonly city: LocalizedText;
  readonly countryCode: string;
}

const amman: RawCoachLocation = {
  id: "loc-amman",
  name: { en: "Amman Hub", ar: "\u0645\u0631\u0643\u0632 \u0639\u0645\u0651\u0627\u0646" },
  city: { en: "Amman", ar: "\u0639\u0645\u0651\u0627\u0646" },
  countryCode: "JO",
};
const irbid: RawCoachLocation = {
  id: "loc-irbid",
  name: { en: "Irbid Centre", ar: "\u0645\u0631\u0643\u0632 \u0625\u0631\u0628\u062f" },
  city: { en: "Irbid", ar: "\u0625\u0631\u0628\u062f" },
  countryCode: "JO",
};
const zarqa: RawCoachLocation = {
  id: "loc-zarqa",
  name: { en: "Zarqa Club", ar: "\u0646\u0627\u062f\u064a \u0627\u0644\u0632\u0631\u0642\u0627\u0621" },
  city: { en: "Zarqa", ar: "\u0627\u0644\u0632\u0631\u0642\u0627\u0621" },
  countryCode: "JO",
};
const aqaba: RawCoachLocation = {
  id: "loc-aqaba",
  name: { en: "Aqaba Marina", ar: "\u0645\u0631\u0633\u0649 \u0627\u0644\u0639\u0642\u0628\u0629" },
  city: { en: "Aqaba", ar: "\u0627\u0644\u0639\u0642\u0628\u0629" },
  countryCode: "JO",
};

/**
 * Languages a coach works in, as BCP-47 codes. The site's own two are not the
 * only ones that appear here, so this is a wider list than `LOCALES`.
 */
export const LANGUAGE_NAMES: Readonly<Record<string, LocalizedText>> = {
  ar: { en: "Arabic", ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  en: { en: "English", ar: "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" },
  fr: { en: "French", ar: "\u0627\u0644\u0641\u0631\u0646\u0633\u064a\u0629" },
  tr: { en: "Turkish", ar: "\u0627\u0644\u062a\u0631\u0643\u064a\u0629" },
};

const photo = (
  slug: string,
  alt: string,
  width: number,
  height: number,
): MediaImage => ({
  kind: "image",
  id: `img-${slug}`,
  url: `/images/coaches/${slug}.jpg`,
  alt,
  width,
  height,
});

/**
 * Package templates.
 *
 * Every coach sells the same three SHAPES — a single session, a block of eight
 * at a reduced rate, and something remote — because that is the vocabulary the
 * booking step teaches a visitor once and then reuses on every profile. Only
 * the price and the minutes differ per coach, so the copy that explains each
 * shape is written once here rather than ten times below.
 */
function singleSession(price: number, minutes = 60): RawCoachPackage {
  return {
    id: "pkg-single",
    name: { en: "Single session", ar: "جلسة واحدة" },
    description: {
      en: "One session, face to face. Start here if you want to try the coach before committing.",
      ar: "جلسة واحدة وجهاً لوجه. ابدأ من هنا إذا أردت تجربة المدرّب قبل الالتزام.",
    },
    durationMinutes: minutes,
    sessionCount: 1,
    mode: "in-person",
    price: jod(price),
  };
}

function eightPack(price: number, minutes = 60): RawCoachPackage {
  return {
    id: "pkg-block",
    name: { en: "Block of 8 sessions", ar: "باقة 8 جلسات" },
    description: {
      en: "Eight sessions over roughly two months. You book the first now and set the rest with the coach.",
      ar: "ثماني جلسات على مدى شهرين تقريباً. تحجز الأولى الآن وتحدّد البقية مع المدرّب.",
    },
    durationMinutes: minutes,
    sessionCount: 8,
    mode: "in-person",
    price: jod(price),
    compareAtPrice: jod(Math.round((price / 8) * 1.25) * 8),
  };
}

function onlineSession(price: number, minutes = 45): RawCoachPackage {
  return {
    id: "pkg-online",
    name: { en: "Online review", ar: "مراجعة عن بُعد" },
    description: {
      en: "A video call to go through your plan, your video or your numbers. No travel either way.",
      ar: "مكالمة فيديو لمراجعة خطتك أو فيديو أدائك أو أرقامك. بلا تنقّل من الطرفين.",
    },
    durationMinutes: minutes,
    sessionCount: 1,
    mode: "online",
    price: jod(price),
  };
}

/**
 * THE SPECIALISATION VOCABULARY.
 *
 * Ids, not display strings. A coach's tags used to be free English text, which
 * meant the Arabic page showed English chips and the filter compared a URL
 * parameter against a label that a coach could retype at any time. Ten ids and
 * one lookup fix both: the label is translated where every other label is, and
 * `?specialization=spec-mobility` keeps meaning the same thing after someone
 * rewords the chip.
 */
export interface RawSpecialisation {
  readonly id: string;
  readonly name: LocalizedText;
}

export const mockSpecialisations: readonly RawSpecialisation[] = [
  { id: "spec-strength", name: { en: "Strength & conditioning", ar: "\u0627\u0644\u0642\u0648\u0629 \u0648\u0627\u0644\u0644\u064a\u0627\u0642\u0629" } },
  { id: "spec-hypertrophy", name: { en: "Muscle building", ar: "\u0628\u0646\u0627\u0621 \u0627\u0644\u0639\u0636\u0644\u0627\u062a" } },
  { id: "spec-powerlifting", name: { en: "Powerlifting", ar: "\u0631\u0641\u0639 \u0627\u0644\u0623\u062b\u0642\u0627\u0644" } },
  { id: "spec-endurance", name: { en: "Endurance", ar: "\u0627\u0644\u062a\u062d\u0645\u0651\u0644" } },
  { id: "spec-rehab", name: { en: "Rehabilitation", ar: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0623\u0647\u064a\u0644" } },
  { id: "spec-mobility", name: { en: "Mobility", ar: "\u0627\u0644\u0645\u0631\u0648\u0646\u0629 \u0648\u0627\u0644\u062d\u0631\u0643\u0629" } },
  { id: "spec-technique", name: { en: "Technique", ar: "\u0627\u0644\u062a\u0643\u0646\u064a\u0643" } },
  { id: "spec-youth", name: { en: "Youth coaching", ar: "\u062a\u062f\u0631\u064a\u0628 \u0627\u0644\u0646\u0627\u0634\u0626\u064a\u0646" } },
  { id: "spec-beginner", name: { en: "Beginners", ar: "\u0627\u0644\u0645\u0628\u062a\u062f\u0626\u0648\u0646" } },
  { id: "spec-nutrition", name: { en: "Nutrition", ar: "\u0627\u0644\u062a\u063a\u0630\u064a\u0629" } },
];

export const mockCoaches: readonly RawCoach[] = [
  {
    id: "coach-layla",
    slug: "layla-haddad",
    name: { en: "Layla Haddad", ar: "ليلى حداد" },
    headline: {
      en: "Strength & conditioning for field sports",
      ar: "القوة واللياقة لرياضات الملاعب",
    },
    bio: {
      en: "Works with club and academy players on force production, change of direction and return to play. Sessions run at the Amman hub with a full free-weights floor, and every block starts with a movement screen so the plan is built on what your body actually does rather than on a template.",
      ar: "تعمل مع لاعبي الأندية والأكاديميات على إنتاج القوة وتغيير الاتجاه والعودة للملاعب. تُقام الجلسات في مركز عمّان المزوّد بصالة أوزان حرّة كاملة، وتبدأ كل باقة بفحص حركي حتى تُبنى الخطة على ما يفعله جسمك فعلاً لا على قالب جاهز.",
    },
    sportIds: ["sport-football", "sport-fitness"],
    specializations: ["spec-strength", "spec-rehab"],
    certifications: [
      { id: "cert-layla-1", name: "Certified Strength and Conditioning Specialist", issuedBy: "NSCA", issuedAt: "2021-06-01" },
      { id: "cert-layla-2", name: "Sports First Aid", issuedBy: "Jordan Red Crescent", issuedAt: "2024-02-10" },
    ],
    yearsOfExperience: 9,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: true,
    sessionRate: jod(35_000),
    packages: [singleSession(35_000), eightPack(224_000), onlineSession(20_000)],
    completedSessions: 640,
    responseTimeHours: 2,
    avatar: photo("coach-layla", "Layla Haddad coaching a session", 700, 600),
    gallery: [],
    rating: { average: 4.9, count: 47, distribution: { 1: 0, 2: 0, 3: 1, 4: 5, 5: 41 } },
    publishedAt: "2026-01-15",
  },
  {
    id: "coach-omar",
    slug: "omar-nasser",
    name: { en: "Omar Nasser", ar: "عمر ناصر" },
    headline: {
      en: "Basketball skills and shooting mechanics",
      ar: "مهارات كرة السلة وميكانيكا التصويب",
    },
    bio: {
      en: "Former national-league guard focused on individual skill development for ages 12 and up. Sessions are filmed, so you leave with the clip and the two things to fix before the next one.",
      ar: "لاعب سابق في الدوري الوطني يركّز على تطوير المهارات الفردية لمن هم فوق 12 سنة. تُصوَّر الجلسات، فتخرج ومعك المقطع وأهم نقطتين تحتاج إصلاحهما قبل الجلسة التالية.",
    },
    sportIds: ["sport-basketball"],
    specializations: ["spec-technique", "spec-youth"],
    certifications: [{ id: "cert-omar-1", name: "Level 2 Basketball Coach", issuedBy: "FIBA", issuedAt: "2020-09-12" }],
    yearsOfExperience: 6,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: false,
    sessionRate: jod(28_000),
    packages: [singleSession(28_000, 75), eightPack(179_000, 75)],
    completedSessions: 310,
    responseTimeHours: 6,
    avatar: photo("coach-omar", "Omar Nasser coaching a session", 500, 350),
    gallery: [],
    rating: { average: 4.6, count: 23, distribution: { 1: 0, 2: 1, 3: 1, 4: 5, 5: 16 } },
    publishedAt: "2026-02-20",
  },
  {
    id: "coach-rania",
    slug: "rania-suleiman",
    name: { en: "Rania Suleiman", ar: "رانيا سليمان" },
    headline: {
      en: "Endurance running and race preparation",
      ar: "جري التحمّل والتحضير للسباقات",
    },
    bio: {
      en: "Coaches road and trail runners from a first 10K through a marathon. Plans are written week by week around your real schedule, and the online review is where most runners start.",
      ar: "تدرّب عدّائي الطرق والجبال من أول 10 كم حتى الماراثون. تُكتب الخطط أسبوعاً بأسبوع حول جدولك الحقيقي، ومعظم العدّائين يبدؤون بالمراجعة عن بُعد.",
    },
    sportIds: ["sport-running", "sport-outdoor"],
    specializations: ["spec-endurance", "spec-technique"],
    certifications: [{ id: "cert-rania-1", name: "Endurance Coach Level 3", issuedBy: "World Athletics", issuedAt: "2019-03-05" }],
    yearsOfExperience: 12,
    languages: ["ar", "en", "fr"],
    location: irbid,
    isRemoteAvailable: true,
    sessionRate: jod(30_000),
    packages: [onlineSession(18_000, 50), singleSession(30_000), eightPack(192_000)],
    completedSessions: 980,
    responseTimeHours: 3,
    avatar: photo("coach-rania", "Rania Suleiman coaching a session", 435, 465),
    gallery: [],
    rating: { average: 4.8, count: 61, distribution: { 1: 0, 2: 1, 3: 2, 4: 6, 5: 52 } },
    publishedAt: "2026-03-30",
  },
  {
    id: "coach-karim",
    slug: "karim-dabbas",
    name: { en: "Karim Dabbas", ar: "كريم دبّاس" },
    headline: {
      en: "Powerlifting and barbell technique",
      ar: "رفع الأثقال وتكنيك البار",
    },
    bio: {
      en: "Competitive lifter coaching the squat, bench and deadlift. Every session ends with the next week's numbers written down, so you never turn up wondering what to load.",
      ar: "رافع أثقال منافس يدرّب السكوات والبنش والدِدلِفت. تنتهي كل جلسة بأرقام الأسبوع القادم مكتوبة، فلا تأتي أبداً وأنت تتساءل كم تضع على البار.",
    },
    sportIds: ["sport-gym", "sport-fitness"],
    specializations: ["spec-powerlifting", "spec-technique"],
    certifications: [
      { id: "cert-karim-1", name: "International Powerlifting Coach", issuedBy: "IPF", issuedAt: "2022-04-18" },
    ],
    yearsOfExperience: 8,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: true,
    sessionRate: jod(32_000),
    packages: [singleSession(32_000), eightPack(205_000), onlineSession(19_000)],
    completedSessions: 520,
    responseTimeHours: 1,
    avatar: photo("coach-karim", "Karim Dabbas at the gym", 950, 700),
    gallery: [],
    rating: { average: 4.9, count: 38, distribution: { 1: 0, 2: 0, 3: 0, 4: 4, 5: 34 } },
    publishedAt: "2026-04-02",
  },
  {
    id: "coach-noor",
    slug: "noor-abu-ghazaleh",
    name: { en: "Noor Abu Ghazaleh", ar: "نور أبو غزالة" },
    headline: {
      en: "Postnatal training and safe return to lifting",
      ar: "تدريب ما بعد الولادة والعودة الآمنة للرفع",
    },
    bio: {
      en: "Rebuilds strength after pregnancy at a pace set by how you recover, not by a calendar. Works with the core, the pelvic floor and the loads that come after them.",
      ar: "تعيد بناء القوة بعد الحمل بإيقاع تحدّده استجابة جسمك لا التقويم. تعمل على العضلات المركزية وقاع الحوض والأحمال التي تأتي بعدهما.",
    },
    sportIds: ["sport-fitness", "sport-gym"],
    specializations: ["spec-rehab", "spec-mobility"],
    certifications: [
      { id: "cert-noor-1", name: "Pre & Postnatal Coaching Certification", issuedBy: "GGS", issuedAt: "2023-01-22" },
      { id: "cert-noor-2", name: "Corrective Exercise Specialist", issuedBy: "NASM", issuedAt: "2021-11-04" },
    ],
    yearsOfExperience: 7,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: true,
    sessionRate: jod(30_000),
    packages: [singleSession(30_000), eightPack(192_000), onlineSession(17_000)],
    completedSessions: 415,
    responseTimeHours: 4,
    avatar: photo("coach-noor", "Noor Abu Ghazaleh training", 500, 350),
    gallery: [],
    rating: { average: 5, count: 29, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 29 } },
    publishedAt: "2026-04-28",
  },
  {
    id: "coach-tareq",
    slug: "tareq-al-masri",
    name: { en: "Tareq Al-Masri", ar: "طارق المصري" },
    headline: {
      en: "Boxing and combat conditioning",
      ar: "الملاكمة ولياقة رياضات القتال",
    },
    bio: {
      en: "Pads, footwork and the engine behind them. Beginners spend the first month on stance and breathing before anyone throws anything hard.",
      ar: "الباد والحركة والمحرّك الذي يشغّلهما. يقضي المبتدئون الشهر الأول على الوقفة والتنفّس قبل أن يسدّد أحد ضربة قوية.",
    },
    sportIds: ["sport-martial-arts", "sport-fitness"],
    specializations: ["spec-strength", "spec-beginner"],
    certifications: [{ id: "cert-tareq-1", name: "Amateur Boxing Coach Level 2", issuedBy: "AIBA", issuedAt: "2021-07-30" }],
    yearsOfExperience: 11,
    languages: ["ar", "en"],
    location: zarqa,
    isRemoteAvailable: false,
    sessionRate: jod(25_000),
    packages: [singleSession(25_000), eightPack(160_000)],
    completedSessions: 720,
    responseTimeHours: 8,
    avatar: photo("coach-tareq", "Tareq Al-Masri coaching", 500, 300),
    gallery: [],
    rating: { average: 4.7, count: 34, distribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 26 } },
    publishedAt: "2026-05-11",
  },
  {
    id: "coach-dina",
    slug: "dina-khoury",
    name: { en: "Dina Khoury", ar: "دينا خوري" },
    headline: {
      en: "Mobility, flexibility and desk-job backs",
      ar: "المرونة والحركة وآلام الظهر لأصحاب المكاتب",
    },
    bio: {
      en: "Short, frequent sessions for people whose shoulders and hips have spent nine hours in a chair. Most of the work is repeatable at home, which is the point.",
      ar: "جلسات قصيرة ومتكرّرة لمن قضت أكتافهم وأوراكهم تسع ساعات على الكرسي. معظم التمارين قابلة للتكرار في البيت، وهذا هو المقصود.",
    },
    sportIds: ["sport-fitness"],
    specializations: ["spec-mobility", "spec-rehab"],
    certifications: [
      { id: "cert-dina-1", name: "Functional Range Conditioning", issuedBy: "FRC", issuedAt: "2022-09-15" },
    ],
    yearsOfExperience: 5,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: true,
    sessionRate: jod(22_000),
    packages: [onlineSession(14_000, 40), singleSession(22_000, 45), eightPack(141_000, 45)],
    completedSessions: 290,
    responseTimeHours: 2,
    avatar: photo("coach-dina", "Dina Khoury leading a mobility session", 500, 430),
    gallery: [],
    rating: { average: 4.8, count: 52, distribution: { 1: 0, 2: 0, 3: 2, 4: 7, 5: 43 } },
    publishedAt: "2026-05-26",
  },
  {
    id: "coach-yousef",
    slug: "yousef-barakat",
    name: { en: "Yousef Barakat", ar: "يوسف بركات" },
    headline: {
      en: "Hypertrophy and body-composition coaching",
      ar: "تضخيم العضلات وإعادة تكوين الجسم",
    },
    bio: {
      en: "Training and eating, handled together, because changing one without the other stalls. Fortnightly check-ins on measurements and lifts rather than on the scale alone.",
      ar: "التدريب والتغذية معاً، لأن تغيير أحدهما دون الآخر يتوقّف سريعاً. متابعة كل أسبوعين للقياسات والأرقام لا للميزان وحده.",
    },
    sportIds: ["sport-gym", "sport-fitness"],
    specializations: ["spec-hypertrophy", "spec-nutrition"],
    certifications: [
      { id: "cert-yousef-1", name: "Certified Personal Trainer", issuedBy: "ACE", issuedAt: "2020-03-08" },
      { id: "cert-yousef-2", name: "Precision Nutrition Level 1", issuedBy: "PN", issuedAt: "2023-06-19" },
    ],
    yearsOfExperience: 10,
    languages: ["ar", "en", "tr"],
    location: amman,
    isRemoteAvailable: true,
    sessionRate: jod(33_000),
    packages: [singleSession(33_000), eightPack(211_000), onlineSession(21_000, 50)],
    completedSessions: 860,
    responseTimeHours: 3,
    avatar: photo("coach-yousef", "Yousef Barakat at the gym", 950, 700),
    gallery: [],
    rating: { average: 4.7, count: 71, distribution: { 1: 1, 2: 1, 3: 3, 4: 12, 5: 54 } },
    publishedAt: "2026-06-08",
  },
  {
    id: "coach-hala",
    slug: "hala-zoubi",
    name: { en: "Hala Zoubi", ar: "هالة الزعبي" },
    headline: {
      en: "Swimming technique for adults who never learned",
      ar: "تقنية السباحة للكبار الذين لم يتعلّموها",
    },
    bio: {
      en: "Adult beginners and nervous swimmers, one lane at a time. Sessions run in a heated indoor pool and nobody is asked to put their face in the water on day one.",
      ar: "مبتدئون كبار وسبّاحون متوتّرون، حارة واحدة في كل مرّة. تُقام الجلسات في مسبح داخلي مُدفّأ، ولا يُطلب من أحد وضع وجهه في الماء في اليوم الأول.",
    },
    sportIds: ["sport-swimming", "sport-water-sports"],
    specializations: ["spec-technique", "spec-beginner"],
    certifications: [{ id: "cert-hala-1", name: "Swimming Teacher Level 2", issuedBy: "Swim England", issuedAt: "2022-02-14" }],
    yearsOfExperience: 6,
    languages: ["ar", "en"],
    location: irbid,
    isRemoteAvailable: false,
    sessionRate: jod(27_000),
    packages: [singleSession(27_000, 45), eightPack(173_000, 45)],
    completedSessions: 380,
    responseTimeHours: 12,
    avatar: photo("coach-hala", "Hala Zoubi coaching", 500, 350),
    gallery: [],
    rating: { average: 4.9, count: 44, distribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 40 } },
    publishedAt: "2026-06-21",
  },
  {
    id: "coach-sami",
    slug: "sami-tarawneh",
    name: { en: "Sami Tarawneh", ar: "سامي الطراونة" },
    headline: {
      en: "Cycling power and long-ride pacing",
      ar: "قوة الدرّاجة وتوزيع الجهد في الرحلات الطويلة",
    },
    bio: {
      en: "Road and gravel, with training built around a power meter. The climb out of Aqaba is the test ride, and most riders take it twice — once before, once after.",
      ar: "طرق وحصى، بتدريب مبني على قياس القدرة. صعود العقبة هو رحلة الاختبار، ويقطعها معظم الدرّاجين مرّتين — مرّة قبل ومرّة بعد.",
    },
    sportIds: ["sport-cycling", "sport-outdoor"],
    specializations: ["spec-endurance", "spec-strength"],
    certifications: [{ id: "cert-sami-1", name: "Cycling Coach Level 2", issuedBy: "UCI", issuedAt: "2021-05-09" }],
    yearsOfExperience: 14,
    languages: ["ar", "en"],
    location: aqaba,
    isRemoteAvailable: true,
    sessionRate: jod(29_000),
    packages: [onlineSession(16_000), singleSession(29_000, 90), eightPack(186_000, 90)],
    completedSessions: 540,
    responseTimeHours: 5,
    avatar: photo("coach-sami", "Sami Tarawneh coaching", 500, 300),
    gallery: [],
    rating: { average: 4.6, count: 27, distribution: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 20 } },
    publishedAt: "2026-07-03",
  },
];

/* ------------------------------------------------------------------------- */
/* AVAILABILITY                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Slots are GENERATED rather than listed.
 *
 * A hand-written fixture pins its dates to the day it was typed, so the page it
 * feeds goes empty a fortnight later and every screenshot afterwards shows "no
 * slots". Generating from the requested range keeps the booking flow alive
 * forever, which is what a fixture is for.
 *
 * It is still DETERMINISTIC: the same coach and the same date always produce
 * the same slots, so the server render and the browser agree and a slot id in a
 * form post still resolves on the next request. The hash below is the only
 * randomness there is.
 */
function hash(value: string): number {
  let acc = 2_166_136_261;
  for (let i = 0; i < value.length; i += 1) {
    acc ^= value.charCodeAt(i);
    acc = Math.imul(acc, 16_777_619);
  }
  return acc >>> 0;
}

/** Hours a coach publishes, keyed by coach id. Morning people and evening people. */
const PUBLISHED_HOURS: Readonly<Record<string, readonly number[]>> = {
  "coach-layla": [7, 9, 11, 17, 19],
  "coach-omar": [16, 18, 20],
  "coach-rania": [6, 7, 17, 18],
  "coach-karim": [10, 12, 18, 20],
  "coach-noor": [9, 10, 11, 16],
  "coach-tareq": [17, 19, 21],
  "coach-dina": [8, 12, 14, 18],
  "coach-yousef": [9, 11, 17, 19, 21],
  "coach-hala": [8, 10, 16, 18],
  "coach-sami": [6, 8, 16],
};

/** Jordan is UTC+3 all year — no daylight saving since 2022. */
const OFFSET = "+03:00";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The published slots for one coach across a date range, inclusive of both ends.
 *
 * Fridays are left empty on purpose: a calendar with no closed days does not
 * look like a real one, and the empty-day state in the picker needs something
 * to render.
 */
export function buildCoachSlots(coachId: string, from: string, to: string): CoachAvailabilitySlot[] {
  const hours = PUBLISHED_HOURS[coachId];
  if (!hours) return [];

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const slots: CoachAvailabilitySlot[] = [];

  for (let time = start.getTime(); time <= end.getTime(); time += 86_400_000) {
    const day = new Date(time);
    const date = day.toISOString().slice(0, 10);
    if (day.getUTCDay() === 5) continue; // Friday: nobody publishes.

    for (const hour of hours) {
      const seed = hash(`${coachId}:${date}:${hour}`);
      // Roughly a fifth of published hours are withdrawn rather than booked.
      if (seed % 5 === 0) continue;
      const durationMinutes = seed % 3 === 0 ? 45 : 60;
      const endMinutes = hour * 60 + durationMinutes;

      slots.push({
        id: `slot-${coachId}-${date}-${pad(hour)}`,
        startsAt: `${date}T${pad(hour)}:00:00${OFFSET}`,
        endsAt: `${date}T${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}:00${OFFSET}`,
        // A profile with nothing taken reads as a coach nobody books.
        isBooked: seed % 7 === 0,
      });
    }
  }

  return slots;
}
