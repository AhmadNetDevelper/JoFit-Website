import type { CourseFormat, CourseIntake, CourseLevel } from "@/features/education";
import type { LocalizedText } from "@/i18n";
import type { Media, MediaImage, Money, Price, PublishStatus, RatingSummary } from "@/types";

/**
 * THE COURSE CATALOGUE.
 *
 * These are the REAL programmes JoFit sells. The business is the exclusive
 * official agent of the National Council on Strength & Fitness (NCSF) in
 * Jordan. On 2026-09-29 the client sent its six programmes as a folder, one per
 * programme, each with an English name, an Arabic name, a one-line description
 * and photographs: Certified Personal Trainer, Strength & Conditioning, Sports
 * Nutrition, Sports Injuries, Reformer Pilates and Olympic Weightlifting. The
 * TITLES and the SUMMARIES below are that text — the Arabic verbatim, the
 * English a translation of it — and the photos are theirs
 * (`public/images/courses`). The CPD workshops are a seventh strand from the
 * earlier brief.
 *
 * WHAT IS INVENTED, AND MUST BE CORRECTED BY THE CLIENT: every PRICE, every
 * DURATION, every RATING, the longer descriptions and module lists of the
 * first five programmes, and the names of the individual CPD workshops. The
 * client has supplied none of those. They are set to plausible values so the
 * grid can be designed against something realistic, not because anyone
 * confirmed them. Olympic Weightlifting, the newest, carries only what the
 * client wrote: its modules are the four things its description names, it has
 * no reviews, no instructors and no certificate until the client says which.
 *
 * Everything displayed is a `LocalizedText` resolved in `education.mock.ts`,
 * including the certification name and its issuer — a certificate title left as
 * free English text is exactly how an Arabic card ends up with an English chip
 * in it.
 */
export interface RawCourseCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
}

export interface RawCourseModule {
  readonly id: string;
  readonly title: LocalizedText;
  readonly durationMinutes?: number;
}

/** Localized, unlike the resolved `CourseCertification` the domain exposes. */
export interface RawCourseCertification {
  readonly name: LocalizedText;
  readonly issuedBy: LocalizedText;
}

export interface RawCourse {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly format: CourseFormat;
  readonly level: CourseLevel;
  readonly durationHours: number;
  readonly price: Price;
  readonly instructorIds: readonly string[];
  readonly modules: readonly RawCourseModule[];
  readonly certification?: RawCourseCertification;
  readonly media: readonly Media[];
  readonly rating: RatingSummary;
  readonly status: PublishStatus;
  /** Days BEFORE today the course went live; the ISO date is derived. */
  readonly publishedDaysAgo: number;
}

const jod = (amount: number): Money => ({ amount, currency: "JOD" });

/**
 * One of the client's programme photos. The alt is empty on purpose: every
 * place a course photo appears, the course's name sits right beside it, so the
 * picture is decoration to a screen reader — and an alt in one language would
 * be wrong on half the site.
 */
const photo = (name: string, width: number, height: number, extension = "jpg"): MediaImage => ({
  kind: "image",
  id: `img-course-${name}`,
  url: `/images/courses/${name}.${extension}`,
  alt: "",
  width,
  height,
});

/** The awarding body, written once. It is the whole point of the business. */
const NCSF: LocalizedText = {
  en: "National Council on Strength & Fitness (NCSF)",
  ar: "المجلس الوطني للقوة واللياقة البدنية (NCSF)",
};

export const mockCourseCategories: readonly RawCourseCategory[] = [
  {
    id: "ccat-certifications",
    slug: "certifications",
    name: { en: "NCSF certifications", ar: "الاعتمادات الدولية" },
    description: {
      en: "The council's international professional certifications, delivered in Jordan by JoFit.",
      ar: "اعتمادات المجلس المهنية الدولية، تقدّمها جوفِت في الأردن.",
    },
  },
  {
    id: "ccat-specialised",
    slug: "specialised",
    name: { en: "Specialised courses", ar: "الدورات التخصصية" },
    description: {
      en: "Focused qualifications that sit alongside the certifications.",
      ar: "مؤهلات متخصصة تسير جنبًا إلى جنب مع الاعتمادات الدولية.",
    },
  },
  {
    id: "ccat-cpd",
    slug: "cpd",
    name: { en: "CPD workshops", ar: "ورش التطوير المهني" },
    description: {
      en: "Short workshops carrying continuing education units, for professionals already qualified.",
      ar: "ورش قصيرة تمنح وحدات تعليم مستمر لمن يحمل مؤهّلًا بالفعل.",
    },
  },
];

export const mockCourses: readonly RawCourse[] = [
  /* ----------------------------------------------------------------------
     THE THREE NCSF INTERNATIONAL CERTIFICATIONS.
     Named exactly as `/specialisations` names them.
     ---------------------------------------------------------------------- */
  {
    id: "course-ncsf-cpt",
    slug: "certified-personal-trainer",
    title: { en: "Certified Personal Trainer (NCSF-CPT)", ar: "المدرب الشخصي المعتمد" },
    summary: {
      en: "A complete programme that brings together exercise science, assessment, programme design and hands-on practice, to qualify you to work in personal training.",
      ar: "برنامج متكامل يجمع بين علوم التدريب، التقييم، تصميم البرامج، والتطبيق العملي لتأهيلك للعمل في مجال التدريب الشخصي.",
    },
    description: {
      en: "The council's flagship certification, delivered in Jordan by JoFit. Movement screening and assessment, programme design across strength and conditioning, coaching practice with real clients, and the NCSF written and practical examinations.",
      ar: "الاعتماد الأبرز لدى المجلس، تقدّمه جوفِت في الأردن. يشمل فحص الحركة والتقييم، وتصميم البرامج في القوة واللياقة، والتدريب العملي مع مشتركين حقيقيين، ثم الامتحانين النظري والعملي من المجلس.",
    },
    categoryIds: ["ccat-certifications"],
    sportIds: ["sport-fitness", "sport-gym"],
    format: "hybrid",
    level: "beginner",
    durationHours: 120,
    price: { current: jod(650_000), compareAt: jod(790_000) },
    instructorIds: ["coach-layla", "coach-karim"],
    modules: [
      { id: "mod-cpt-1", title: { en: "Anatomy, physiology & movement screening", ar: "التشريح ووظائف الأعضاء وفحص الحركة" }, durationMinutes: 1_800 },
      { id: "mod-cpt-2", title: { en: "Assessment & client consultation", ar: "التقييم ومقابلة المشترك" }, durationMinutes: 1_200 },
      { id: "mod-cpt-3", title: { en: "Programme design & periodisation", ar: "تصميم البرامج والتدرّج الموسمي" }, durationMinutes: 2_100 },
      { id: "mod-cpt-4", title: { en: "Coaching practice & NCSF examination", ar: "التدريب العملي وامتحان المجلس" }, durationMinutes: 2_100 },
    ],
    certification: {
      name: { en: "NCSF Certified Personal Trainer", ar: "شهادة المدرب الشخصي المعتمد من NCSF" },
      issuedBy: NCSF,
    },
    media: [photo("personal-trainer-1", 736, 736), photo("personal-trainer-2", 736, 736)],
    rating: { average: 4.8, count: 64 },
    status: "published",
    publishedDaysAgo: 420,
  },
  {
    id: "course-ncsf-strength-conditioning",
    slug: "strength-and-conditioning-specialist",
    title: { en: "Strength & Conditioning", ar: "القوة والإعداد البدني" },
    summary: {
      en: "A programme focused on developing the components of physical performance, such as strength, speed, endurance and power, and on building training programmes around the athlete's goals.",
      ar: "برنامج يركّز على تطوير عناصر الأداء البدني، مثل القوة والسرعة والتحمل والقدرة، وبناء برامج تدريبية وفق أهداف الرياضي.",
    },
    description: {
      en: "Built for coaches already working in a club or academy. Needs analysis by sport, testing batteries, the training year, and how a plan survives a fixture list that moves.",
      ar: "مصمّمة للمدرّبين العاملين في الأندية والأكاديميات. تحليل احتياجات اللعبة، واختبارات القياس، وتوزيع السنة التدريبية، وكيف تصمد الخطة أمام روزنامة مباريات متغيّرة.",
    },
    categoryIds: ["ccat-certifications"],
    sportIds: ["sport-football", "sport-basketball", "sport-gym"],
    format: "in-person",
    level: "advanced",
    durationHours: 90,
    price: { current: jod(720_000) },
    instructorIds: ["coach-omar", "coach-tareq"],
    modules: [
      { id: "mod-scs-1", title: { en: "Needs analysis by sport", ar: "تحليل احتياجات اللعبة" }, durationMinutes: 900 },
      { id: "mod-scs-2", title: { en: "Testing, monitoring & load management", ar: "الاختبار والمتابعة وإدارة الأحمال" }, durationMinutes: 1_200 },
      { id: "mod-scs-3", title: { en: "The training year", ar: "السنة التدريبية" }, durationMinutes: 1_500 },
      { id: "mod-scs-4", title: { en: "Team delivery & NCSF examination", ar: "التطبيق مع الفريق وامتحان المجلس" }, durationMinutes: 1_800 },
    ],
    certification: {
      name: {
        en: "NCSF Strength & Conditioning Specialist",
        ar: "شهادة أخصائي الإعداد البدني من NCSF",
      },
      issuedBy: NCSF,
    },
    media: [photo("strength-conditioning-1", 736, 736)],
    rating: { average: 4.9, count: 38 },
    status: "published",
    publishedDaysAgo: 310,
  },
  {
    id: "course-ncsf-sports-nutrition",
    slug: "sports-nutrition-specialist",
    title: { en: "Sports Nutrition", ar: "التغذية الرياضية" },
    summary: {
      en: "A programme that connects nutrition with athletic performance and body composition, and gives you a practical foundation for understanding your clients' needs and supporting their goals.",
      ar: "برنامج يربط بين التغذية والأداء الرياضي وتكوين الجسم، ويمنحك أساسًا عمليًا لفهم احتياجات المتدربين ودعم أهدافهم.",
    },
    description: {
      en: "Energy systems and substrate use, hydration in a hot climate, supplement claims and how to read them, and the line between sports nutrition advice and clinical dietetics.",
      ar: "أنظمة الطاقة ومصادرها، والترطيب في المناخ الحار، وادّعاءات المكمّلات وكيف تُقرأ، والحد الفاصل بين إرشاد التغذية الرياضية والتغذية العلاجية.",
    },
    categoryIds: ["ccat-certifications"],
    sportIds: ["sport-fitness", "sport-running", "sport-gym"],
    format: "online",
    level: "intermediate",
    durationHours: 60,
    price: { current: jod(480_000) },
    instructorIds: ["coach-noor"],
    modules: [
      { id: "mod-sns-1", title: { en: "Energy systems & macronutrients", ar: "أنظمة الطاقة والعناصر الغذائية الكبرى" }, durationMinutes: 900 },
      { id: "mod-sns-2", title: { en: "Hydration & training in heat", ar: "الترطيب والتدريب في الأجواء الحارة" }, durationMinutes: 600 },
      { id: "mod-sns-3", title: { en: "Body composition & supplementation", ar: "تركيب الجسم والمكمّلات" }, durationMinutes: 900 },
      { id: "mod-sns-4", title: { en: "Scope of practice & NCSF examination", ar: "حدود الممارسة وامتحان المجلس" }, durationMinutes: 1_200 },
    ],
    certification: {
      name: { en: "NCSF Sports Nutrition Specialist", ar: "شهادة أخصائي التغذية الرياضية من NCSF" },
      issuedBy: NCSF,
    },
    media: [photo("sports-nutrition-1", 736, 676), photo("sports-nutrition-2", 736, 736)],
    rating: { average: 4.7, count: 45 },
    status: "published",
    publishedDaysAgo: 240,
  },

  /* ----------------------------------------------------------------------
     THE SPECIALISED COURSES.
     ---------------------------------------------------------------------- */
  {
    id: "course-injury-rehabilitation",
    slug: "sports-injury-prevention-and-rehabilitation",
    title: { en: "Sports Injuries", ar: "الإصابات الرياضية" },
    summary: {
      en: "Specialised training in understanding sports injuries: how they happen, how to deal with them, and the principles of rehabilitation and returning to training.",
      ar: "تدريب متخصص لفهم الإصابات الرياضية، آليات حدوثها، طرق التعامل معها، ومبادئ التأهيل والعودة إلى التدريب.",
    },
    description: {
      en: "Screening for the patterns that precede an injury, the prehabilitation work that answers them, and a staged return-to-play protocol a coach can actually run alongside a physiotherapist.",
      ar: "فحص الأنماط التي تسبق الإصابة، وتمارين الوقاية التي تعالجها، وبروتوكول عودة تدريجي إلى الملعب يستطيع المدرّب تطبيقه فعليًا بالتوازي مع أخصائي العلاج الطبيعي.",
    },
    categoryIds: ["ccat-specialised"],
    sportIds: ["sport-football", "sport-basketball", "sport-martial-arts"],
    format: "in-person",
    level: "advanced",
    durationHours: 72,
    price: { current: jod(560_000) },
    instructorIds: ["coach-rania", "coach-hala"],
    modules: [
      { id: "mod-rehab-1", title: { en: "Injury mechanisms & risk screening", ar: "آليات الإصابة وفحص عوامل الخطر" }, durationMinutes: 900 },
      { id: "mod-rehab-2", title: { en: "Prehabilitation programming", ar: "بناء برامج الوقاية" }, durationMinutes: 1_200 },
      { id: "mod-rehab-3", title: { en: "Staged return to play", ar: "العودة التدريجية إلى الملعب" }, durationMinutes: 1_200 },
      { id: "mod-rehab-4", title: { en: "Working with the medical team", ar: "العمل مع الطاقم الطبي" }, durationMinutes: 1_020 },
    ],
    certification: {
      name: {
        en: "NCSF Sports Injury Prevention & Rehabilitation",
        ar: "شهادة الوقاية وإعادة التأهيل من NCSF",
      },
      issuedBy: NCSF,
    },
    media: [
      /* The knee goes first: it is centred, so it survives the portrait crop of
         the landing tile; the helping-up shot is wide and loses its subject there. */
      photo("sports-injuries-1", 735, 490),
      photo("sports-injuries-2", 736, 414),
    ],
    rating: { average: 4.8, count: 27 },
    status: "published",
    publishedDaysAgo: 180,
  },
  {
    id: "course-pilates-instructor",
    slug: "professional-pilates-instructor",
    title: { en: "Reformer Pilates", ar: "بيلاتس ريفورمر" },
    summary: {
      en: "A programme that combines knowledge with hands-on practice to develop your skills on the Reformer, and your understanding of movement, alignment, posture and the core.",
      ar: "برنامج يجمع بين المعرفة والتطبيق العملي لتطوير مهارات استخدام الـReformer، وفهم الحركة، الـAlignment، الـPosture، والـCore.",
    },
    /* The client's description is the whole of what is known about this
       programme, so the long description is the same text; the course page
       prints it once. */
    description: {
      en: "A programme that combines knowledge with hands-on practice to develop your skills on the Reformer, and your understanding of movement, alignment, posture and the core.",
      ar: "برنامج يجمع بين المعرفة والتطبيق العملي لتطوير مهارات استخدام الـReformer، وفهم الحركة، الـAlignment، الـPosture، والـCore.",
    },
    categoryIds: ["ccat-specialised"],
    sportIds: ["sport-fitness"],
    format: "in-person",
    level: "intermediate",
    durationHours: 80,
    price: { current: jod(540_000), compareAt: jod(600_000) },
    instructorIds: ["coach-dina"],
    /* The four things the client's description names, in its order. */
    modules: [
      { id: "mod-pil-1", title: { en: "Using the Reformer", ar: "استخدام الـReformer" } },
      { id: "mod-pil-2", title: { en: "Understanding movement", ar: "فهم الحركة" } },
      { id: "mod-pil-3", title: { en: "Alignment & posture", ar: "الـAlignment والـPosture" } },
      { id: "mod-pil-4", title: { en: "The core", ar: "الـCore" } },
    ],
    certification: {
      name: { en: "NCSF Professional Pilates Instructor", ar: "شهادة مدرّب البيلاتس المحترف من NCSF" },
      issuedBy: NCSF,
    },
    media: [photo("reformer-pilates-1", 736, 851), photo("reformer-pilates-2", 736, 736), photo("reformer-pilates-3", 736, 736)],
    rating: { average: 4.6, count: 31 },
    status: "published",
    publishedDaysAgo: 150,
  },
  {
    id: "course-olympic-weightlifting",
    slug: "olympic-weightlifting",
    title: { en: "Olympic Weightlifting", ar: "رفع الأثقال الأولمبية" },
    summary: {
      en: "A practical training programme focused on correct technique, developing strength and power, and mastering the snatch and the clean and jerk, with applications that help improve performance and build a strong foundation in Olympic weightlifting.",
      ar: "برنامج تدريبي عملي يركز على التكنيك الصحيح، تطوير القوة والقدرة، وإتقان حركتي الخطف والكلين آند جيرك، مع تطبيقات تساعد على تحسين الأداء وبناء أساس قوي في رياضة رفع الأثقال الأولمبية.",
    },
    description: {
      en: "A practical training programme focused on correct technique, developing strength and power, and mastering the snatch and the clean and jerk, with applications that help improve performance and build a strong foundation in Olympic weightlifting.",
      ar: "برنامج تدريبي عملي يركز على التكنيك الصحيح، تطوير القوة والقدرة، وإتقان حركتي الخطف والكلين آند جيرك، مع تطبيقات تساعد على تحسين الأداء وبناء أساس قوي في رياضة رفع الأثقال الأولمبية.",
    },
    categoryIds: ["ccat-specialised"],
    sportIds: ["sport-gym", "sport-fitness"],
    format: "in-person",
    level: "intermediate",
    /* Placeholders like every duration and price in this file. */
    durationHours: 40,
    price: { current: jod(450_000) },
    instructorIds: [],
    /* The four things the client's description names, in its order. */
    modules: [
      { id: "mod-owl-1", title: { en: "Correct technique", ar: "التكنيك الصحيح" } },
      { id: "mod-owl-2", title: { en: "Developing strength & power", ar: "تطوير القوة والقدرة" } },
      { id: "mod-owl-3", title: { en: "The snatch", ar: "حركة الخطف" } },
      { id: "mod-owl-4", title: { en: "The clean and jerk", ar: "حركة الكلين آند جيرك" } },
    ],
    /* No certification yet: the client has not said who issues it, and the
       card says nothing rather than guessing. */
    media: [
      photo("olympic-weightlifting-1", 736, 920),
      photo("olympic-weightlifting-2", 666, 600),
      photo("olympic-weightlifting-3", 666, 600),
    ],
    rating: { average: 0, count: 0 },
    status: "published",
    publishedDaysAgo: 1,
  },

  /* ----------------------------------------------------------------------
     CPD WORKSHOPS.

     `/specialisations` lists "continuing professional development workshops
     (CEUs)" as one strand rather than naming individual workshops, so the four
     below are INVENTED titles standing in for a programme the client has not
     published. They exist because a catalogue with five items and no short
     courses does not show what CPD looks like.
     ---------------------------------------------------------------------- */
  {
    id: "course-cpd-programme-design",
    slug: "cpd-programme-design-clinic",
    title: { en: "CPD: Programme design clinic", ar: "ورشة: عيادة تصميم البرامج" },
    summary: {
      en: "One weekend rebuilding your own clients' programmes against the council's framework, with your plans reviewed in the room.",
      ar: "عطلة أسبوع واحدة لإعادة بناء برامج مشتركيك وفق إطار المجلس، مع مراجعة خططك داخل القاعة.",
    },
    description: {
      en: "Bring three live programmes. You leave with all three rewritten and a rationale you can defend to a client.",
      ar: "أحضِر ثلاثة برامج قيد التنفيذ. تخرج بها مُعاد كتابتها جميعًا، ومعها مبرّر تستطيع الدفاع عنه أمام المشترك.",
    },
    categoryIds: ["ccat-cpd"],
    sportIds: ["sport-fitness", "sport-gym"],
    format: "online",
    level: "intermediate",
    durationHours: 12,
    price: { current: jod(95_000) },
    instructorIds: ["coach-layla"],
    modules: [
      { id: "mod-cpd-pd-1", title: { en: "Reading a programme critically", ar: "قراءة البرنامج قراءة نقدية" }, durationMinutes: 360 },
      { id: "mod-cpd-pd-2", title: { en: "Rebuild & review", ar: "إعادة البناء والمراجعة" }, durationMinutes: 360 },
    ],
    certification: {
      name: { en: "NCSF continuing education units (CEUs)", ar: "وحدات التعليم المستمر من NCSF" },
      issuedBy: NCSF,
    },
    media: [],
    rating: { average: 4.5, count: 22 },
    status: "published",
    publishedDaysAgo: 95,
  },
  {
    id: "course-cpd-coaching-communication",
    slug: "cpd-coaching-communication",
    title: { en: "CPD: Coaching communication", ar: "ورشة: التواصل التدريبي" },
    summary: {
      en: "Cueing, correcting and keeping a client who is not enjoying it — the part of the job no certification examines.",
      ar: "التوجيه والتصحيح والاحتفاظ بمشترك لا يستمتع بالتدريب — الجانب الذي لا يمتحنه أي اعتماد.",
    },
    description: {
      en: "Short, practical and run in small groups, because the whole subject is how you say a thing rather than what you know.",
      ar: "ورشة قصيرة وعملية بمجموعات صغيرة، لأن الموضوع كلّه هو كيف تقول الشيء لا ماذا تعرف.",
    },
    categoryIds: ["ccat-cpd"],
    sportIds: ["sport-fitness"],
    format: "online",
    level: "beginner",
    durationHours: 8,
    price: { current: jod(75_000) },
    instructorIds: ["coach-yousef"],
    modules: [
      { id: "mod-cpd-cc-1", title: { en: "Cueing & correction", ar: "التوجيه والتصحيح" }, durationMinutes: 240 },
      { id: "mod-cpd-cc-2", title: { en: "Adherence & difficult conversations", ar: "الالتزام والمحادثات الصعبة" }, durationMinutes: 240 },
    ],
    certification: {
      name: { en: "NCSF continuing education units (CEUs)", ar: "وحدات التعليم المستمر من NCSF" },
      issuedBy: NCSF,
    },
    media: [],
    /* Deliberately unreviewed: the card's "no reviews yet" state has to be
       exercised by the fixtures or it ships untested. */
    rating: { average: 0, count: 0 },
    status: "published",
    publishedDaysAgo: 40,
  },
  {
    id: "course-cpd-youth-development",
    slug: "cpd-youth-athlete-development",
    title: { en: "CPD: Youth athlete development", ar: "ورشة: تطوير الرياضي الناشئ" },
    summary: {
      en: "Age-appropriate training for 8–16s, session design under real constraints, and safeguarding basics.",
      ar: "تدريب مناسب لأعمار 8–16 سنة، وتصميم الحصص ضمن قيود واقعية، وأساسيات حماية الناشئين.",
    },
    description: {
      en: "For club and school coaches. Long-term athlete development, what to load and what to leave alone, and the duty of care a coach of minors carries.",
      ar: "لمدرّبي الأندية والمدارس. التطوير طويل المدى للرياضي، وما يُحمَّل وما يُترك، وواجب الرعاية الذي يحمله مدرّب القاصرين.",
    },
    categoryIds: ["ccat-cpd"],
    sportIds: ["sport-football", "sport-basketball", "sport-swimming"],
    format: "hybrid",
    level: "intermediate",
    durationHours: 16,
    price: { current: jod(120_000) },
    instructorIds: ["coach-omar", "coach-sami"],
    modules: [
      { id: "mod-cpd-yd-1", title: { en: "Long-term athlete development", ar: "تطوير الرياضي طويل المدى" }, durationMinutes: 480 },
      { id: "mod-cpd-yd-2", title: { en: "Session design & constraints", ar: "تصميم الحصص والقيود" }, durationMinutes: 300 },
      { id: "mod-cpd-yd-3", title: { en: "Safeguarding & duty of care", ar: "الحماية وواجب الرعاية" }, durationMinutes: 180 },
    ],
    certification: {
      name: { en: "NCSF continuing education units (CEUs)", ar: "وحدات التعليم المستمر من NCSF" },
      issuedBy: NCSF,
    },
    media: [],
    rating: { average: 4.4, count: 18 },
    status: "published",
    publishedDaysAgo: 65,
  },
  {
    id: "course-cpd-sideline-first-aid",
    slug: "cpd-sideline-first-aid",
    title: { en: "CPD: Sideline first aid", ar: "ورشة: الإسعافات الأولية في الملعب" },
    summary: {
      en: "One day on pitch-side emergency response: primary survey, concussion recognition, bleeding control and safe removal from play.",
      ar: "يوم واحد حول الاستجابة للطوارئ في الملعب: الفحص الأولي، وكشف الارتجاج، والسيطرة على النزيف، والإخراج الآمن من الملعب.",
    },
    description: {
      en: "Practical throughout, on a pitch rather than in a classroom, and the one workshop here every coach on a touchline should hold.",
      ar: "عملية بالكامل، في الملعب لا في القاعة، وهي الورشة التي ينبغي أن يحملها كل مدرّب يقف على خط التماس.",
    },
    categoryIds: ["ccat-cpd"],
    sportIds: ["sport-football", "sport-basketball", "sport-martial-arts"],
    format: "in-person",
    level: "beginner",
    durationHours: 8,
    price: { current: jod(60_000) },
    instructorIds: ["coach-rania"],
    modules: [
      {
        id: "mod-cpd-fa-1",
        title: { en: "Primary survey & emergency action plan", ar: "الفحص الأولي وخطة الطوارئ" },
        durationMinutes: 240,
      },
      { id: "mod-cpd-fa-2", title: { en: "Concussion, bleeding & removal from play", ar: "الارتجاج والنزيف والإخراج من الملعب" }, durationMinutes: 240 },
    ],
    certification: {
      name: { en: "NCSF continuing education units (CEUs)", ar: "وحدات التعليم المستمر من NCSF" },
      issuedBy: NCSF,
    },
    media: [],
    rating: { average: 4.9, count: 12 },
    status: "published",
    publishedDaysAgo: 20,
  },
];

/* ---------------------------------------------------------------------------
 * INTAKES, GENERATED RELATIVE TO TODAY.
 *
 * Same reasoning and the same shape as `buildCoachSlots` in `mocks/coaches`: a
 * fixture that names a date names the day it was typed, and the catalogue reads
 * as abandoned a fortnight later. The seed is a hash of the course id, so the
 * spread of intakes is stable — the same course keeps the same position in the
 * calendar from one render to the next, and from the server to the browser.
 * ------------------------------------------------------------------------- */
const MS_PER_DAY = 86_400_000;

function hash(value: string): number {
  let acc = 2_166_136_261;
  for (let i = 0; i < value.length; i += 1) {
    acc ^= value.charCodeAt(i);
    acc = Math.imul(acc, 16_777_619);
  }
  return acc >>> 0;
}

function isoDaysFromToday(days: number): string {
  const today = new Date();
  const utcMidnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return new Date(utcMidnight + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The ISO date a course went live, derived from its `publishedDaysAgo`. */
export function coursePublishedAt(raw: RawCourse): string {
  return isoDaysFromToday(-raw.publishedDaysAgo);
}

/**
 * The next cohort of one course.
 *
 * The four states are all reachable and all present in this catalogue — a
 * fixture where every course is open never exercises the full or upcoming
 * treatments, and those are the ones that ship broken.
 */
export function buildCourseIntake(courseId: string): CourseIntake {
  const seed = hash(courseId);

  /* Between one and eleven weeks out. */
  const daysAhead = 7 + (seed % 70);
  const seatsTotal = 12 + (seed % 5) * 2;
  const seatsTaken = seed % (seatsTotal + 1);
  const remaining = seatsTotal - seatsTaken;

  const state =
    remaining <= 0
      ? "full"
      : daysAhead > 49
        ? "upcoming"
        : remaining <= 3
          ? "closing"
          : "open";

  return {
    startsOn: isoDaysFromToday(daysAhead),
    seatsTotal,
    seatsTaken,
    state,
  };
}
