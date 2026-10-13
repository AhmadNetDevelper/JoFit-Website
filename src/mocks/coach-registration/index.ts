import type { LocalizedText } from "@/i18n";

/**
 * Reference tables for the coach registration form, standing in for the live
 * API's `Country`, `City`, `AcademicDegree`, `UniversityMajor`, `JobStatus`,
 * `JobType` and `Course` tables. Seeded from Mudarrib's lists (the page the
 * API copies) with its duplicates and its typo removed: تونس and العقبة appear
 * once, and "تخطيط وتنظيم الفعاليات" is one skill.
 */
export interface RawOption {
  readonly id: string;
  readonly name: LocalizedText;
}

const options = (rows: readonly (readonly [en: string, ar: string])[]): RawOption[] =>
  rows.map(([en, ar], index) => ({ id: String(index + 1), name: { en, ar } }));

export const mockCountries: readonly RawOption[] = options([
  ["Jordan", "الأردن"],
  ["Saudi Arabia", "السعودية"],
  ["United Arab Emirates", "الإمارات"],
  ["Kuwait", "الكويت"],
  ["Qatar", "قطر"],
  ["Bahrain", "البحرين"],
  ["Oman", "عُمان"],
  ["Iraq", "العراق"],
  ["Syria", "سوريا"],
  ["Lebanon", "لبنان"],
  ["Palestine", "فلسطين"],
  ["Egypt", "مصر"],
  ["Libya", "ليبيا"],
  ["Tunisia", "تونس"],
  ["Algeria", "الجزائر"],
  ["Morocco", "المغرب"],
  ["Sudan", "السودان"],
  ["Yemen", "اليمن"],
  ["Mauritania", "موريتانيا"],
  ["Somalia", "الصومال"],
]);

/** Keyed by country id. Jordan in full; elsewhere the largest cities. */
const cityRows: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  "1": [
    ["Amman", "عمّان"],
    ["Zarqa", "الزرقاء"],
    ["Irbid", "إربد"],
    ["Aqaba", "العقبة"],
    ["Balqa", "البلقاء"],
    ["Madaba", "مادبا"],
    ["Mafraq", "المفرق"],
    ["Jerash", "جرش"],
    ["Ajloun", "عجلون"],
    ["Karak", "الكرك"],
    ["Tafilah", "الطفيلة"],
    ["Ma'an", "معان"],
  ],
  "2": [["Riyadh", "الرياض"], ["Jeddah", "جدة"], ["Dammam", "الدمام"], ["Mecca", "مكة المكرمة"], ["Medina", "المدينة المنورة"]],
  "3": [["Abu Dhabi", "أبوظبي"], ["Dubai", "دبي"], ["Sharjah", "الشارقة"], ["Al Ain", "العين"]],
  "4": [["Kuwait City", "مدينة الكويت"], ["Hawalli", "حولي"], ["Al Ahmadi", "الأحمدي"]],
  "5": [["Doha", "الدوحة"], ["Al Rayyan", "الريان"], ["Al Wakrah", "الوكرة"]],
  "6": [["Manama", "المنامة"], ["Muharraq", "المحرق"], ["Riffa", "الرفاع"]],
  "7": [["Muscat", "مسقط"], ["Salalah", "صلالة"], ["Sohar", "صحار"]],
  "8": [["Baghdad", "بغداد"], ["Basra", "البصرة"], ["Erbil", "أربيل"], ["Mosul", "الموصل"]],
  "9": [["Damascus", "دمشق"], ["Aleppo", "حلب"], ["Homs", "حمص"], ["Latakia", "اللاذقية"]],
  "10": [["Beirut", "بيروت"], ["Tripoli", "طرابلس"], ["Sidon", "صيدا"]],
  "11": [["Ramallah", "رام الله"], ["Gaza", "غزة"], ["Nablus", "نابلس"], ["Hebron", "الخليل"]],
  "12": [["Cairo", "القاهرة"], ["Alexandria", "الإسكندرية"], ["Giza", "الجيزة"]],
  "13": [["Tripoli", "طرابلس"], ["Benghazi", "بنغازي"], ["Misrata", "مصراتة"]],
  "14": [["Tunis", "تونس العاصمة"], ["Sfax", "صفاقس"], ["Sousse", "سوسة"]],
  "15": [["Algiers", "الجزائر العاصمة"], ["Oran", "وهران"], ["Constantine", "قسنطينة"]],
  "16": [["Rabat", "الرباط"], ["Casablanca", "الدار البيضاء"], ["Marrakesh", "مراكش"]],
  "17": [["Khartoum", "الخرطوم"], ["Omdurman", "أم درمان"], ["Port Sudan", "بورتسودان"]],
  "18": [["Sana'a", "صنعاء"], ["Aden", "عدن"], ["Taiz", "تعز"]],
  "19": [["Nouakchott", "نواكشوط"], ["Nouadhibou", "نواذيبو"]],
  "20": [["Mogadishu", "مقديشو"], ["Hargeisa", "هرجيسا"]],
};

/** City ids are unique across countries, as they are in the live table. */
export const mockCitiesByCountry: Readonly<Record<string, readonly RawOption[]>> = Object.fromEntries(
  Object.entries(cityRows).map(([countryId, rows]) => [
    countryId,
    rows.map(([en, ar], index) => ({ id: `${countryId}${String(index + 1).padStart(2, "0")}`, name: { en, ar } })),
  ]),
);

export const mockJobStatuses: readonly RawOption[] = options([
  ["Part-time", "دوام جزئي"],
  ["Full-time", "دوام كامل"],
  ["Freelance", "عمل مستقل"],
  ["Available for work", "جاهز للعمل"],
]);

export const mockAcademicDegrees: readonly RawOption[] = options([
  ["Diploma", "دبلوم"],
  ["Bachelor's", "بكالوريوس"],
  ["Master's", "ماجستير"],
  ["Doctorate", "دكتوراه"],
]);

export const mockUniversityMajors: readonly RawOption[] = options([
  ["Physical education", "التربية الرياضية"],
  ["Sports rehabilitation", "التأهيل الرياضي"],
  ["Sports science", "علوم الرياضة"],
  ["Kinesiology and sports training", "علوم الحركة والتدريب الرياضي"],
  ["Sports management and coaching", "الإدارة والتدريب الرياضي"],
  ["Other", "أخرى"],
]);

export const mockJobTypes: readonly RawOption[] = options([
  ["Full-time", "دوام كامل"],
  ["Part-time", "دوام جزئي"],
  ["Self-employed", "حسابي الخاص"],
]);

export const mockSkills: readonly RawOption[] = options([
  ["Biomechanics", "الميكانيكا الحيوية"],
  ["Exercise physiology", "فسيولوجيا التمارين"],
  ["Strength and conditioning", "القوة والتكييف"],
  ["Sports nutrition", "التغذية الرياضية"],
  ["Injury prevention and rehabilitation", "الوقاية من الإصابات وإعادة التأهيل"],
  ["Performance analysis", "تحليل الأداء"],
  ["Functional movement screening", "فحص الحركة الوظيفية"],
  ["Tactical planning", "التخطيط التكتيكي"],
  ["Sport-specific technique coaching", "تدريب تقنيات رياضية متخصصة"],
  ["Team management", "إدارة الفريق"],
  ["Athlete motivation and development", "التحفيز وتطوير الرياضيين"],
  ["Training programme design (individual and group)", "تصميم البرامج التدريبية (فردية وجماعية)"],
  ["Communicating with athletes", "التواصل مع الرياضيين"],
  ["Teaching movement patterns", "تعليم أنماط الحركة"],
  ["Adapting for special populations", "التكيف مع الفئات الخاصة"],
  ["Skill acquisition strategies", "استراتيجيات اكتساب المهارات"],
  ["Warm-up and cool-down design", "تصميم الإحماء والتهدئة"],
  ["Behaviour management (especially children and juniors)", "إدارة السلوك (خاصة للأطفال والناشئين)"],
  ["Building mental toughness", "تنمية الصلابة الذهنية"],
  ["Injury assessment", "تقييم الإصابات"],
  ["Sports massage techniques", "تقنيات التدليك الرياضي"],
  ["Recovery methods (ice baths, compression, etc.)", "أساليب الاستشفاء (حمامات الثلج، الضغط، إلخ)"],
  ["Flexibility and mobility programmes", "برامج المرونة والحركة"],
  ["Posture correction", "تصحيح الوضعية"],
  ["Understanding medical referral", "فهم الإحالة الطبية"],
  ["First aid and CPR", "الإسعافات الأولية والإنعاش القلبي الرئوي"],
  ["Event planning and organisation", "تخطيط وتنظيم الفعاليات"],
  ["Sport psychology", "المعرفة بعلم النفس الرياضي"],
  ["Pre- and postnatal training", "التدريب قبل وبعد الولادة"],
  ["Data collection and interpretation", "جمع البيانات وتفسيرها"],
  ["Tracking technology and measuring devices", "استخدام تقنيات التتبع وأجهزة القياس"],
  ["Performance monitoring tools", "استخدام أدوات متابعة الأداء"],
  ["Budget management", "إدارة الميزانية"],
  ["Marketing and promotion strategies", "استراتيجيات التسويق والترويج"],
  ["Social media management", "إدارة وسائل التواصل الاجتماعي"],
  ["Branding and public relations", "بناء العلامة التجارية والعلاقات العامة"],
  ["Sports facility management", "إدارة المنشآت الرياضية"],
  ["Legal and ethical compliance", "الامتثال القانوني والأخلاقي"],
  ["Risk management in sports settings", "إدارة المخاطر في البيئات الرياضية"],
  ["Leadership", "القيادة"],
  ["Teamwork", "العمل الجماعي"],
  ["Emotional intelligence", "الذكاء العاطفي"],
  ["Conflict resolution", "حل النزاعات"],
  ["Time management", "إدارة الوقت"],
  ["Cultural competence in diverse teams", "الكفاءة الثقافية في الفرق المتنوعة"],
]);
