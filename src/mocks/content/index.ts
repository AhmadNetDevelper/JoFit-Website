import type { LocalizedText } from "@/i18n";
import type { MediaImage, PublishStatus } from "@/types";

export interface RawAuthor {
  readonly id: string;
  readonly slug: string;
  /** A person's name — never translated. */
  readonly name: string;
  readonly bio?: LocalizedText;
  /** Absent from every fixture; set by staff through the admin (`../catalogue-images.ts`). */
  readonly avatar?: MediaImage;
}

export interface RawArticleCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
}

export interface RawArticleTag {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface RawArticle {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly excerpt: LocalizedText;
  readonly body: LocalizedText;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly coverImage?: MediaImage;
  readonly readingMinutes: number;
  readonly status: PublishStatus;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly relatedArticleIds: readonly string[];
}

export const mockAuthors: readonly RawAuthor[] = [
  {
    id: "author-nadia",
    slug: "nadia-khoury",
    name: "Nadia Khoury",
    bio: { en: "Sports science writer.", ar: "كاتبة في علوم الرياضة." },
  },
  {
    id: "author-basel",
    slug: "basel-odeh",
    name: "Basel Odeh",
    bio: {
      en: "Equipment reviewer and former club coach.",
      ar: "مراجع معدات ومدرّب نادٍ سابق.",
    },
  },
];

export const mockArticleCategories: readonly RawArticleCategory[] = [
  {
    id: "acat-training",
    slug: "training",
    name: { en: "Training", ar: "التدريب" },
    description: {
      en: "Programming, recovery and performance.",
      ar: "بناء البرامج والاستشفاء والأداء.",
    },
  },
  {
    id: "acat-gear",
    slug: "gear",
    name: { en: "Gear", ar: "المعدات" },
    description: { en: "Equipment guides and reviews.", ar: "أدلة ومراجعات المعدات." },
  },
];

export const mockArticleTags: readonly RawArticleTag[] = [
  { id: "tag-beginner", slug: "beginner", name: { en: "Beginner", ar: "مبتدئ" } },
  { id: "tag-buying-guide", slug: "buying-guide", name: { en: "Buying guide", ar: "دليل الشراء" } },
  { id: "tag-recovery", slug: "recovery", name: { en: "Recovery", ar: "الاستشفاء" } },
];

export const mockArticles: readonly RawArticle[] = [
  {
    id: "article-first-10k",
    slug: "building-up-to-your-first-10k",
    title: { en: "Building up to your first 10K", ar: "التحضير لأول سباق 10 كم" },
    excerpt: {
      en: "A twelve-week approach that prioritises consistency over weekly mileage jumps.",
      ar: "خطة من اثني عشر أسبوعاً تركّز على الانتظام بدل زيادة المسافات فجأة.",
    },
    body: {
      en: "Most first-time 10K plans fail on week four, not week one...",
      ar: "معظم خطط أول 10 كم تفشل في الأسبوع الرابع، لا الأول...",
    },
    authorId: "author-nadia",
    categoryIds: ["acat-training"],
    tagIds: ["tag-beginner"],
    sportIds: ["sport-running"],
    readingMinutes: 7,
    status: "published",
    publishedAt: "2026-08-12",
    relatedArticleIds: ["article-recovery-basics"],
  },
  {
    id: "article-choosing-a-football",
    slug: "choosing-a-match-football",
    title: { en: "Choosing a match football", ar: "كيف تختار كرة المباريات" },
    excerpt: {
      en: "What thermal bonding, panel count and surface texture actually change on the pitch.",
      ar: "ما الذي يغيّره اللحام الحراري وعدد القطع وملمس السطح فعلياً في الملعب.",
    },
    body: {
      en: "Ball specifications read like marketing until you know which numbers move...",
      ar: "تبدو مواصفات الكرة دعائية حتى تعرف أي الأرقام يهم فعلاً...",
    },
    authorId: "author-basel",
    categoryIds: ["acat-gear"],
    tagIds: ["tag-buying-guide"],
    sportIds: ["sport-football"],
    readingMinutes: 5,
    status: "published",
    publishedAt: "2026-07-03",
    updatedAt: "2026-08-01",
    relatedArticleIds: [],
  },
  {
    id: "article-recovery-basics",
    slug: "recovery-basics-for-amateur-athletes",
    title: { en: "Recovery basics for amateur athletes", ar: "أساسيات الاستشفاء للرياضيين الهواة" },
    excerpt: {
      en: "Sleep, protein and load management do more than any recovery gadget.",
      ar: "النوم والبروتين وإدارة الحِمل أهم من أي جهاز استشفاء.",
    },
    body: {
      en: "The recovery market is large and mostly optional...",
      ar: "سوق الاستشفاء واسع ومعظمه اختياري...",
    },
    authorId: "author-nadia",
    categoryIds: ["acat-training"],
    tagIds: ["tag-recovery"],
    sportIds: ["sport-fitness", "sport-running"],
    readingMinutes: 6,
    status: "published",
    publishedAt: "2026-06-19",
    relatedArticleIds: ["article-first-10k"],
  },
];
