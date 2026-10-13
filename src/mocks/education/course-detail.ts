import type { LocalizedText } from "@/i18n";

/**
 * WHAT A COURSE PAGE NEEDS AND A COURSE CARD DOES NOT.
 *
 * The catalogue fixture next door (`./index.ts`) carries what every surface
 * reads: title, price, format, rating, the syllabus headings. This file carries
 * the rest of the detail page — what the qualification lets you DO, who it was
 * written for, how the place is earned, what language it is taught in, where it
 * runs, and a line under each syllabus heading.
 *
 * It is separate for two reasons, not one:
 *
 *   - the index never reads any of it, and a fixture row that no listing
 *     touches makes the catalogue harder to read for no gain;
 *   - a course whose detail copy has not been written yet must still render.
 *     Everything here is looked up by id and every lookup is allowed to miss —
 *     `courseDetail()` answers with empty collections rather than `undefined`,
 *     and the page simply drops the block. A catalogue is always ahead of its
 *     copywriting; the page should not break while it catches up.
 *
 * WHAT IS INVENTED AND MUST BE CONFIRMED BY THE CLIENT: the outcomes, the
 * audience lines, the assessment sentences, the module descriptions and the
 * venue. The council publishes syllabi for its certifications; JoFit has not
 * supplied them, so these are plausible readings of the titles in `./index.ts`,
 * written so the page can be designed against real sentences instead of lorem.
 *
 * Everything is `LocalizedText` and is resolved in `education.mock.ts`. An
 * outcome left as free English text is exactly how an Arabic page ends up with
 * an English bullet list in the middle of it.
 */

/** BCP-47 → the language's own name, in the reader's language. */
export const COURSE_LANGUAGE_NAMES: Readonly<Record<string, LocalizedText>> = {
  ar: { en: "Arabic", ar: "العربية" },
  en: { en: "English", ar: "الإنجليزية" },
};

export interface RawCourseDetail {
  /** What the holder can do afterwards. Verbs, not topics. */
  readonly outcomes: readonly LocalizedText[];
  /** Who it was written for. Short phrases. */
  readonly audience: readonly LocalizedText[];
  /** How the place is earned. One sentence. */
  readonly assessment?: LocalizedText;
  /** BCP-47 codes, keys of `COURSE_LANGUAGE_NAMES`. */
  readonly languages: readonly string[];
  /** Absent for an online course — there is nowhere to go. */
  readonly venue?: LocalizedText;
}

const ACADEMY: LocalizedText = { en: "JoFit Academy, Amman", ar: "أكاديمية جوفِت، عمّان" };

export const mockCourseDetails: Readonly<Record<string, RawCourseDetail>> = {
  "course-ncsf-cpt": {
    outcomes: [
      {
        en: "Screen a new client's movement and say which faults you coach and which you refer on.",
        ar: "فحص حركة المشترك الجديد وتحديد ما تعالجه بالتدريب وما تُحيله إلى المختص.",
      },
      {
        en: "Write a twelve-week programme from an assessment, and change it from session notes rather than from mood.",
        ar: "كتابة برنامج لاثني عشر أسبوعًا انطلاقًا من التقييم، وتعديله وفق ملاحظات الحصص لا وفق الانطباع.",
      },
      {
        en: "Coach the main lifts with a cue ready for each common fault.",
        ar: "تدريب التمارين الأساسية مع توجيه جاهز لكل خطأ شائع.",
      },
      {
        en: "Work on a gym floor in Jordan holding a certification recognised outside it.",
        ar: "العمل في صالات الأردن بشهادة معترف بها خارجه.",
      },
    ],
    audience: [
      { en: "Gym floor staff moving into one-to-one work", ar: "العاملون في الصالات المتجهون إلى التدريب الفردي" },
      { en: "Athletes retiring into coaching", ar: "الرياضيون المعتزلون المتجهون إلى التدريب" },
      { en: "Physiotherapy and sports science graduates", ar: "خريجو العلاج الطبيعي وعلوم الرياضة" },
    ],
    assessment: {
      en: "The council's written paper, then a full session coached with a real client and marked on the gym floor.",
      ar: "امتحان المجلس التحريري، ثم حصة كاملة تُدرّبها مع مشترك حقيقي وتُقيَّم داخل الصالة.",
    },
    languages: ["ar", "en"],
    venue: ACADEMY,
  },

  "course-ncsf-strength-conditioning": {
    outcomes: [
      {
        en: "Build a needs analysis for a sport from its own demands rather than from a template.",
        ar: "بناء تحليل احتياجات اللعبة من متطلباتها هي، لا من قالب جاهز.",
      },
      {
        en: "Run a testing battery a squad will actually complete, and read what comes back.",
        ar: "تنفيذ بطارية اختبارات يُكملها الفريق فعلًا، وقراءة نتائجها.",
      },
      {
        en: "Plan a training year, then rebuild it when the fixture list moves.",
        ar: "تخطيط السنة التدريبية، وإعادة بنائها عندما تتغيّر روزنامة المباريات.",
      },
      {
        en: "Manage load across a squad instead of prescribing one session to everyone.",
        ar: "إدارة الأحمال على مستوى الفريق بدل وصف حصة واحدة للجميع.",
      },
    ],
    audience: [
      { en: "Club and academy coaches already in post", ar: "مدرّبو الأندية والأكاديميات العاملون حاليًا" },
      { en: "Assistant coaches taking on conditioning", ar: "المدرّبون المساعدون المكلّفون بالإعداد البدني" },
      { en: "Certified trainers moving to team sport", ar: "المدرّبون المعتمدون المتجهون إلى الألعاب الجماعية" },
    ],
    assessment: {
      en: "A season plan for a named squad, defended in front of the tutor, plus the council's examination.",
      ar: "خطة موسم لفريق محدّد تُناقشها أمام المدرّب، إضافة إلى امتحان المجلس.",
    },
    languages: ["ar", "en"],
    venue: ACADEMY,
  },

  "course-ncsf-sports-nutrition": {
    outcomes: [
      {
        en: "Fuel a training week around the sessions in it, not around a calorie number.",
        ar: "تغذية أسبوع التدريب وفق حصصه، لا وفق رقم سعرات.",
      },
      {
        en: "Write a hydration plan for training through a Jordanian summer.",
        ar: "وضع خطة ترطيب للتدريب في صيف الأردن.",
      },
      {
        en: "Read a supplement label and a supplement claim, and tell the two apart.",
        ar: "قراءة ملصق المكمّل وادّعائه، والتمييز بينهما.",
      },
      {
        en: "Know where sports nutrition advice stops and clinical dietetics begins.",
        ar: "معرفة أين ينتهي إرشاد التغذية الرياضية وأين تبدأ التغذية العلاجية.",
      },
    ],
    audience: [
      { en: "Personal trainers asked about food every week", ar: "المدرّبون الشخصيون الذين يُسألون عن الطعام كل أسبوع" },
      { en: "Coaches travelling with a squad", ar: "المدرّبون المسافرون مع الفرق" },
      { en: "Nutrition graduates moving into sport", ar: "خريجو التغذية المتجهون إلى المجال الرياضي" },
    ],
    assessment: {
      en: "Three case plans marked against the council's scope-of-practice framework, then the written examination.",
      ar: "ثلاث خطط لحالات تُقيَّم وفق إطار حدود الممارسة لدى المجلس، ثم الامتحان التحريري.",
    },
    languages: ["ar", "en"],
  },

  "course-injury-rehabilitation": {
    outcomes: [
      {
        en: "Screen a squad for the movement patterns that precede the common injuries.",
        ar: "فحص الفريق بحثًا عن أنماط الحركة التي تسبق الإصابات الشائعة.",
      },
      {
        en: "Programme prehabilitation work that fits inside a real training week.",
        ar: "بناء تمارين وقاية تتّسع لها فعلًا أسابيع التدريب الحقيقية.",
      },
      {
        en: "Run a staged return to play with criteria at each stage instead of a calendar.",
        ar: "تنفيذ عودة تدريجية إلى الملعب بمعايير لكل مرحلة بدل التقويم الزمني.",
      },
      {
        en: "Hand over to, and take back from, a physiotherapist without losing a week.",
        ar: "تسليم الحالة إلى أخصائي العلاج الطبيعي واستلامها منه دون خسارة أسبوع.",
      },
    ],
    audience: [
      { en: "Team coaches carrying a long injury list", ar: "مدرّبو الفرق الذين تطول قائمة إصاباتهم" },
      { en: "Strength coaches in academies", ar: "مدرّبو القوة في الأكاديميات" },
      { en: "Physiotherapists working with clubs", ar: "أخصائيو العلاج الطبيعي العاملون مع الأندية" },
    ],
    assessment: {
      en: "A return-to-play protocol written for a real case, reviewed with the medical tutor.",
      ar: "بروتوكول عودة إلى الملعب مكتوب لحالة حقيقية، يُراجَع مع المدرّب الطبي.",
    },
    languages: ["ar", "en"],
    venue: ACADEMY,
  },

  "course-pilates-instructor": {
    outcomes: [
      {
        en: "Teach on the Reformer with breath and alignment cued rather than described.",
        ar: "التدريب على الـReformer بتوجيه التنفّس والاستقامة لا بوصفهما.",
      },
      {
        en: "Run a mixed-ability class where every participant has a version of the movement.",
        ar: "إدارة حصة بمستويات متفاوتة يجد فيها كل مشارك نسخته من الحركة.",
      },
      {
        en: "Use the apparatus for the people it actually helps.",
        ar: "استخدام الأجهزة مع من تفيدهم فعلًا.",
      },
      {
        en: "Cue a room of twelve without singling anybody out.",
        ar: "توجيه قاعة من اثني عشر مشاركًا دون إحراج أحد.",
      },
    ],
    audience: [
      { en: "Group instructors adding Pilates", ar: "مدرّبو المجموعات الراغبون بإضافة البيلاتس" },
      { en: "Dancers and gymnasts moving into teaching", ar: "الراقصون ولاعبو الجمباز المتجهون إلى التدريس" },
      { en: "Personal trainers with rehabilitation clients", ar: "المدرّبون الشخصيون الذين لديهم حالات تأهيل" },
    ],
    assessment: {
      en: "A full class taught to a live group and marked on cueing, sequencing and control.",
      ar: "حصة كاملة تُدرّسها لمجموعة حقيقية وتُقيَّم على التوجيه والتسلسل والسيطرة.",
    },
    languages: ["ar", "en"],
    venue: { en: "JoFit Academy studio, Amman", ar: "استوديو أكاديمية جوفِت، عمّان" },
  },

  "course-cpd-programme-design": {
    outcomes: [
      {
        en: "Take a programme apart and name what it is actually training.",
        ar: "تفكيك البرنامج وتسمية ما يدرّبه فعلًا.",
      },
      {
        en: "Rewrite it against the council's framework in one sitting.",
        ar: "إعادة كتابته وفق إطار المجلس في جلسة واحدة.",
      },
      {
        en: "Defend every choice in it to the client paying for it.",
        ar: "الدفاع عن كل خيار فيه أمام المشترك الذي يدفع ثمنه.",
      },
    ],
    audience: [
      { en: "Certified trainers with a live client list", ar: "المدرّبون المعتمدون الذين لديهم مشتركون حاليًا" },
      { en: "Coaches collecting continuing education units", ar: "المدرّبون الذين يجمعون وحدات التعليم المستمر" },
    ],
    assessment: {
      en: "None. You leave with three rewritten programmes; the units are for attending and doing the work.",
      ar: "لا يوجد. تخرج بثلاثة برامج معاد كتابتها، والوحدات مقابل الحضور وإنجاز العمل.",
    },
    languages: ["ar", "en"],
  },

  "course-cpd-coaching-communication": {
    outcomes: [
      {
        en: "Cue a correction in one sentence instead of a paragraph.",
        ar: "توجيه التصحيح بجملة واحدة بدل فقرة كاملة.",
      },
      {
        en: "Keep a client who has stopped enjoying it, or let them go honestly.",
        ar: "الاحتفاظ بمشترك فقد متعته بالتدريب، أو إنهاء العلاقة بصراحة.",
      },
      {
        en: "Have the money conversation without apologising for the price.",
        ar: "إدارة حديث السعر دون اعتذار عنه.",
      },
    ],
    audience: [
      { en: "New trainers in their first year", ar: "المدرّبون الجدد في سنتهم الأولى" },
      { en: "Anyone who is good at the training and losing clients", ar: "كل من يُجيد التدريب ويخسر المشتركين" },
    ],
    languages: ["ar"],
  },

  "course-cpd-youth-development": {
    outcomes: [
      {
        en: "Plan a season for 8–16s that keeps them in the sport at 17.",
        ar: "تخطيط موسم لأعمار 8–16 يبقيهم في اللعبة عند السابعة عشرة.",
      },
      {
        en: "Run a session where nobody is standing in a queue.",
        ar: "إدارة حصة لا ينتظر فيها أحد في الطابور.",
      },
      {
        en: "Decide what to load at each age, and what to leave alone.",
        ar: "تحديد ما يُحمَّل في كل عمر وما يُترك.",
      },
      {
        en: "Apply a club's duty of care in an ordinary training week.",
        ar: "تطبيق واجب الرعاية في أسبوع تدريبي اعتيادي.",
      },
    ],
    audience: [
      { en: "School and club coaches", ar: "مدرّبو المدارس والأندية" },
      { en: "PE teachers running a squad", ar: "معلّمو التربية الرياضية المشرفون على فريق" },
      { en: "Volunteers on the sideline", ar: "المتطوّعون على خط التماس" },
    ],
    assessment: {
      en: "Two of your own sessions recorded and reviewed by the tutor, with written feedback.",
      ar: "حصّتان من حصصك تُسجَّلان ويراجعهما المدرّب مع ملاحظات مكتوبة.",
    },
    languages: ["ar"],
    venue: ACADEMY,
  },

  "course-cpd-sideline-first-aid": {
    outcomes: [
      {
        en: "Run a primary survey on a player who is down, in front of a crowd.",
        ar: "إجراء الفحص الأولي للاعب مصاب أمام الجمهور.",
      },
      {
        en: "Recognise a concussion and take the player off, whatever the score is.",
        ar: "كشف الارتجاج وإخراج اللاعب مهما كانت النتيجة.",
      },
      {
        en: "Control bleeding and immobilise a limb with what is in the bag.",
        ar: "السيطرة على النزيف وتثبيت الطرف بما هو موجود في الحقيبة.",
      },
      {
        en: "Write the incident up so the club has a record that stands.",
        ar: "توثيق الحادث بتقرير يصمد في سجلات النادي.",
      },
    ],
    audience: [
      { en: "Every coach who stands on a touchline", ar: "كل مدرّب يقف على خط التماس" },
      { en: "Team managers and kit staff", ar: "إداريو الفرق ومسؤولو المعدّات" },
      { en: "Referees and match officials", ar: "الحكّام وطاقم المباراة" },
    ],
    assessment: {
      en: "A practical scenario on the pitch, marked pass or repeat on the day.",
      ar: "سيناريو عملي في الملعب، يُقيَّم نجاحًا أو إعادة في اليوم نفسه.",
    },
    languages: ["ar", "en"],
    venue: { en: "JoFit Academy pitch, Amman", ar: "ملعب أكاديمية جوفِت، عمّان" },
  },
};

/**
 * A line under each syllabus heading, keyed by module id.
 *
 * Keyed rather than nested inside the course so that a module added to the
 * catalogue fixture appears in the syllabus immediately, with its heading and
 * its hours, and only the sentence is missing. The reverse — a page that throws
 * because a module has no paragraph — is the worse failure.
 */
export const mockCourseModuleSummaries: Readonly<Record<string, LocalizedText>> = {
  "mod-cpt-1": {
    en: "The systems you are training, and the screen that tells you which of them is the problem.",
    ar: "الأجهزة التي تدرّبها، والفحص الذي يدلّك على أيّها هو المشكلة.",
  },
  "mod-cpt-2": {
    en: "Taking a history, setting a goal the client believes in, and testing where they start.",
    ar: "أخذ التاريخ التدريبي، ووضع هدف يقتنع به المشترك، وقياس نقطة انطلاقه.",
  },
  "mod-cpt-3": {
    en: "Sets, progression and the training block — and what to do when week four goes wrong.",
    ar: "المجموعات والتدرّج والكتلة التدريبية، وما تفعله حين يفشل الأسبوع الرابع.",
  },
  "mod-cpt-4": {
    en: "Supervised hours with real clients, then the council's written and practical papers.",
    ar: "ساعات تدريب مُشرَف عليها مع مشتركين حقيقيين، ثم امتحانا المجلس النظري والعملي.",
  },

  "mod-scs-1": {
    en: "What the sport asks of the body, read off the match rather than off a textbook.",
    ar: "ما تطلبه اللعبة من الجسد، مقروءًا من المباراة لا من الكتاب.",
  },
  "mod-scs-2": {
    en: "Choosing tests a squad will finish, and turning the numbers into a decision.",
    ar: "اختيار فحوص يُكملها الفريق، وتحويل الأرقام إلى قرار.",
  },
  "mod-scs-3": {
    en: "Pre-season, in-season and the weeks nobody plans for.",
    ar: "ما قبل الموسم وأثناءه، والأسابيع التي لا يخطط لها أحد.",
  },
  "mod-scs-4": {
    en: "Delivering the plan to a full squad, then the council's examination.",
    ar: "تنفيذ الخطة مع الفريق كاملًا، ثم امتحان المجلس.",
  },

  "mod-sns-1": {
    en: "Where the energy for a session comes from, and what that means for the plate.",
    ar: "من أين تأتي طاقة الحصة، وماذا يعني ذلك لما في الطبق.",
  },
  "mod-sns-2": {
    en: "Fluid loss, replacement and the mistakes people make training in heat.",
    ar: "فقد السوائل وتعويضها، والأخطاء الشائعة في التدريب تحت الحر.",
  },
  "mod-sns-3": {
    en: "Changing body composition slowly, and the supplements that do and do not help.",
    ar: "تغيير تركيب الجسم ببطء، والمكمّلات التي تفيد وتلك التي لا تفيد.",
  },
  "mod-sns-4": {
    en: "The referral line, the paperwork, and the council's examination.",
    ar: "حدّ الإحالة، والتوثيق، وامتحان المجلس.",
  },

  "mod-rehab-1": {
    en: "How the common injuries actually happen, and the screens that see them coming.",
    ar: "كيف تقع الإصابات الشائعة فعلًا، والفحوص التي تتوقّعها.",
  },
  "mod-rehab-2": {
    en: "The preventative work, and where it fits in a week that is already full.",
    ar: "تمارين الوقاية، وأين تضعها في أسبوع ممتلئ أصلًا.",
  },
  "mod-rehab-3": {
    en: "Criteria for each stage, so a player returns because they are ready, not because it is Friday.",
    ar: "معايير لكل مرحلة، ليعود اللاعب لأنه جاهز لا لأن اليوم جمعة.",
  },
  "mod-rehab-4": {
    en: "Reporting, handover and staying inside your own scope of practice.",
    ar: "التقارير والتسليم والبقاء ضمن حدود ممارستك.",
  },

  "mod-cpd-pd-1": {
    en: "Your own three programmes, read out loud and pulled apart.",
    ar: "برامجك الثلاثة، تُقرأ بصوت عالٍ وتُفكَّك.",
  },
  "mod-cpd-pd-2": {
    en: "Rebuilding them in the room, with the tutor over your shoulder.",
    ar: "إعادة بنائها داخل القاعة والمدرّب إلى جانبك.",
  },

  "mod-cpd-cc-1": {
    en: "Say less. The cues that change a lift, and the ones that only fill silence.",
    ar: "قلّل الكلام. التوجيهات التي تغيّر الأداء، وتلك التي تملأ الصمت فقط.",
  },
  "mod-cpd-cc-2": {
    en: "The client who stopped booking, the one who is always late, and the price conversation.",
    ar: "المشترك الذي توقّف عن الحجز، والذي يتأخر دائمًا، وحديث السعر.",
  },

  "mod-cpd-yd-1": {
    en: "What a body can take at each age, and what specialising early costs.",
    ar: "ما يحتمله الجسد في كل عمر، وثمن التخصص المبكر.",
  },
  "mod-cpd-yd-2": {
    en: "One ball, one pitch, twenty-two children: designing around the constraint.",
    ar: "كرة واحدة وملعب واحد واثنان وعشرون طفلًا: التصميم انطلاقًا من القيد.",
  },
  "mod-cpd-yd-3": {
    en: "The policy, the reporting line, and what you do in the first five minutes.",
    ar: "السياسة، وجهة الإبلاغ، وما تفعله في الدقائق الخمس الأولى.",
  },

  "mod-cpd-fa-1": {
    en: "Danger, response, airway — rehearsed on grass until it is automatic.",
    ar: "الخطر ثم الاستجابة ثم المجرى الهوائي، تُتدرَّب على العشب حتى تصبح تلقائية.",
  },
  "mod-cpd-fa-2": {
    en: "Head knocks, heavy bleeding, and carrying a player off without making it worse.",
    ar: "ضربات الرأس والنزيف الشديد، وإخراج اللاعب دون مضاعفة الإصابة.",
  },
};

/** Never throws on a course whose detail copy has not been written yet. */
/**
 * Olympic Weightlifting arrived with one line of description and nothing else,
 * so its detail is deliberately empty — including the languages, which every
 * other course falls back to. The page leaves out what is not known.
 */
const EMPTY_DETAIL: RawCourseDetail = { outcomes: [], audience: [], languages: [] };
const UNDESCRIBED = new Set(["course-olympic-weightlifting"]);

export function courseDetail(courseId: string): RawCourseDetail {
  if (UNDESCRIBED.has(courseId)) return EMPTY_DETAIL;
  return mockCourseDetails[courseId] ?? { outcomes: [], audience: [], languages: ["ar", "en"] };
}
