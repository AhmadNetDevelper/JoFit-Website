import type {
  ApplicationStatus,
  EmployerKind,
  EmployerSize,
  EmployerVerificationStatus,
  EmploymentType,
  ExperienceLevel,
  JobCity,
  JobLanguage,
  JobStatus,
  SalaryRange,
  StatusStep,
  WorkMode,
} from "@/features/careers/types";
import type { LocalizedText } from "@/i18n";
import type { MediaImage, Money } from "@/types";

/*
 * THE CAREERS MARKETPLACE'S SEED — stored records, before any resolving.
 *
 * Every employer here is FICTIONAL. They are demonstration data for a board
 * that real gyms, centres and sports companies will fill themselves; none of
 * them names, or should be mistaken for, a real business. Their postings,
 * salaries included, are theirs to state — JoFit claims none of it.
 *
 * Dates are generated relative to today, so "posted three days ago" stays true.
 * The store copies these arrays on first use (`mocks/accounts/store.ts`), and
 * the admin mirrors the store through the dev bridge.
 */

export interface RawEmployer {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly kind: EmployerKind;
  readonly cityId: JobCity;
  readonly about: string;
  readonly website?: string;
  readonly size?: EmployerSize;
  readonly email: string;
  readonly phone?: string;
  readonly contactName: string;
  readonly logo?: MediaImage;
  readonly verificationStatus: EmployerVerificationStatus;
  readonly verificationNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** The sign-in of an employer: one per employer for now. */
export interface RawEmployerAccount {
  readonly employerId: string;
  readonly email: string;
  readonly name: string;
}

export interface RawJobCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface RawJob {
  readonly id: string;
  readonly slug: string;
  readonly reference: string;
  readonly employerId: string;
  readonly title: string;
  readonly categoryId: string;
  readonly sportIds: readonly string[];
  readonly cityId: JobCity;
  readonly workMode: WorkMode;
  readonly employmentType: EmploymentType;
  readonly experienceLevel: ExperienceLevel;
  readonly salary?: SalaryRange;
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly JobLanguage[];
  readonly positions: number;
  readonly closesOn?: string;
  readonly status: JobStatus;
  readonly moderationNote?: string;
  readonly featured: boolean;
  readonly postedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RawJobApplication {
  readonly id: string;
  readonly reference: string;
  readonly jobId: string;
  readonly employerId: string;
  readonly customerId: string;
  readonly candidate: { readonly name: string; readonly email: string; readonly phone?: string };
  readonly cvId: string;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string;
  readonly availableFrom?: string;
  readonly expectedSalary?: Money;
  readonly status: ApplicationStatus;
  readonly statusNote?: string;
  readonly employerNote?: string;
  /** The candidate's own reason, when they withdrew. Never overwrites `statusNote`. */
  readonly withdrawReason?: string;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly history: readonly StatusStep[];
  /** When the employer first opened it; `submitted` + unseen = "new". */
  readonly seenByEmployerAt?: string;
}

/** A CV's bytes. Private: never in a public read, never in the admin snapshot. */
export interface RawCvFile {
  readonly id: string;
  readonly customerId: string;
  readonly fileName: string;
  readonly mimeType: "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  readonly bytes: number;
  /** `data:<mime>;base64,…` — the mock keeps the file in memory. */
  readonly dataUrl: string;
  readonly uploadedAt: string;
}

/* ----------------------------------------------------------------- dates */

const DAY = 86_400_000;
const at = (daysAgo: number, hour = 10) => {
  const date = new Date(Date.now() - daysAgo * DAY);
  date.setUTCHours(hour - 3, 0, 0, 0); // Amman is UTC+3
  return date.toISOString();
};
const dateIn = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const jod = (dinars: number): Money => ({ amount: dinars * 1000, currency: "JOD" });

/* ---------------------------------------------------------- a sample CV */

/**
 * A real, one-page PDF built here, so the fixture applications have a CV that
 * opens. Built rather than pasted: the byte offsets in the cross-reference
 * table have to be right, and computing them is shorter than checking them.
 */
function samplePdf(lines: readonly string[]): string {
  const text = lines
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 11} Tf 60 ${760 - index * 22} Td (${line.replace(/[()\\]/g, "")}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

function cvFile(id: string, customerId: string, name: string, lines: readonly string[], daysAgo: number): RawCvFile {
  const pdf = samplePdf([`${name} - CV`, ...lines, "Sample CV - JoFit demonstration data"]);
  return {
    id,
    customerId,
    fileName: `${name.replace(/\s+/g, "-")}-CV.pdf`,
    mimeType: "application/pdf",
    bytes: pdf.length,
    dataUrl: `data:application/pdf;base64,${Buffer.from(pdf, "latin1").toString("base64")}`,
    uploadedAt: at(daysAgo),
  };
}

/* ------------------------------------------------------------ taxonomy */

export const seedJobCategories: readonly RawJobCategory[] = [
  { id: "jc-personal-training", slug: "personal-training", name: { en: "Personal training", ar: "التدريب الشخصي" } },
  { id: "jc-group-fitness", slug: "group-fitness", name: { en: "Group fitness", ar: "اللياقة الجماعية" } },
  { id: "jc-sports-coaching", slug: "sports-coaching", name: { en: "Sports coaching", ar: "التدريب الرياضي" } },
  { id: "jc-physiotherapy", slug: "physiotherapy", name: { en: "Physiotherapy & rehab", ar: "العلاج الطبيعي والتأهيل" } },
  { id: "jc-nutrition", slug: "nutrition", name: { en: "Nutrition", ar: "التغذية" } },
  { id: "jc-aquatics", slug: "aquatics", name: { en: "Aquatics & lifeguarding", ar: "السباحة والإنقاذ" } },
  { id: "jc-front-desk", slug: "front-desk", name: { en: "Front desk & membership", ar: "الاستقبال والعضويات" } },
  { id: "jc-management", slug: "management", name: { en: "Management & operations", ar: "الإدارة والتشغيل" } },
  { id: "jc-sales-marketing", slug: "sales-marketing", name: { en: "Sales & marketing", ar: "المبيعات والتسويق" } },
  { id: "jc-facilities", slug: "facilities", name: { en: "Facilities & maintenance", ar: "المرافق والصيانة" } },
];

/* ------------------------------------------------------------ employers */

export const seedEmployers: readonly RawEmployer[] = [
  {
    id: "emp-summit",
    slug: "summit-performance-gym",
    name: "Summit Performance Gym",
    kind: "gym",
    cityId: "amman",
    about:
      "A strength and conditioning gym in Khalda with a free-weights floor, two turf lanes and a small-group studio. We coach members from their first session to their first competition, and we hire coaches who want to keep learning.",
    website: "https://summit-gym.example",
    size: "11-50",
    email: "hr@summit-gym.test",
    phone: "+962 6 500 1100",
    contactName: "Rana Haddad",
    verificationStatus: "verified",
    createdAt: at(120),
    updatedAt: at(20),
  },
  {
    id: "emp-ofoq",
    slug: "al-ofoq-sports-club",
    name: "نادي الأفق الرياضي",
    kind: "club",
    cityId: "irbid",
    about:
      "نادٍ رياضي عائلي في إربد يضم ملاعب كرة قدم وكرة سلة وصالة لياقة ومسبحاً داخلياً. نبحث دائماً عن مدرّبين يحبّون العمل مع الأطفال والناشئين، ونوفّر لهم التدريب والتطوير المستمر.",
    size: "51-200",
    email: "jobs@ofoq-club.test",
    phone: "+962 2 720 3300",
    contactName: "خالد العمري",
    verificationStatus: "verified",
    createdAt: at(200),
    updatedAt: at(30),
  },
  {
    id: "emp-aqaba-aquatics",
    slug: "aqaba-aquatic-centre",
    name: "Aqaba Aquatic Centre",
    kind: "sports-centre",
    cityId: "aqaba",
    about:
      "A 25-metre indoor pool, a learn-to-swim programme for children and adults, and open-water sessions on the Red Sea coast. Lifeguards and swim instructors work in rotating shifts.",
    website: "https://aqaba-aquatics.example",
    size: "11-50",
    email: "careers@aqaba-aquatics.test",
    phone: "+962 3 201 4400",
    contactName: "Mazen Qasem",
    verificationStatus: "verified",
    createdAt: at(90),
    updatedAt: at(12),
  },
  {
    id: "emp-coremotion",
    slug: "coremotion-physio-clinic",
    name: "CoreMotion Physio Clinic",
    kind: "clinic",
    cityId: "amman",
    about:
      "Sports physiotherapy and return-to-play rehabilitation in Abdoun. We work alongside coaches and gyms across Amman, and every therapist here keeps a caseload of athletes.",
    website: "https://coremotion.example",
    size: "1-10",
    email: "hr@coremotion.test",
    phone: "+962 6 592 7700",
    contactName: "Dr. Lina Saadeh",
    verificationStatus: "verified",
    createdAt: at(150),
    updatedAt: at(40),
  },
  {
    id: "emp-levant",
    slug: "levant-sportswear",
    name: "Levant Sportswear Co.",
    kind: "sports-company",
    cityId: "amman",
    about:
      "We design and distribute training apparel and team kits for clubs and schools in Jordan. Our team runs design, sourcing, retail and B2B sales from one office.",
    size: "51-200",
    email: "talent@levant-sportswear.test",
    phone: "+962 6 400 8800",
    contactName: "Sara Nimri",
    verificationStatus: "verified",
    createdAt: at(300),
    updatedAt: at(8),
  },
  {
    id: "emp-young-stars",
    slug: "young-stars-football-academy",
    name: "أكاديمية النجوم الصاعدة لكرة القدم",
    kind: "academy",
    cityId: "madaba",
    about:
      "أكاديمية لكرة القدم للفئات العمرية من ٦ إلى ١٦ سنة، بتدريبات بعد المدرسة وفي عطل نهاية الأسبوع. نؤمن بأن المدرّب الجيد يصنع لاعباً جيداً وإنساناً أفضل.",
    size: "11-50",
    email: "coach@youngstars.test",
    phone: "+962 5 324 1200",
    contactName: "محمد الشوابكة",
    verificationStatus: "verified",
    createdAt: at(60),
    updatedAt: at(15),
  },
  {
    id: "emp-zarqa-strength",
    slug: "zarqa-strength-house",
    name: "بيت القوة - الزرقاء",
    kind: "gym",
    cityId: "zarqa",
    about: "صالة رياضية جديدة للقوة ورفع الأثقال في الزرقاء الجديدة، تفتح أبوابها الشهر القادم.",
    size: "1-10",
    email: "info@zarqa-strength.test",
    phone: "+962 5 390 5500",
    contactName: "أحمد الزعبي",
    verificationStatus: "pending",
    createdAt: at(2),
    updatedAt: at(2),
  },
];

export const seedEmployerAccounts: readonly RawEmployerAccount[] = seedEmployers.map((employer) => ({
  employerId: employer.id,
  email: employer.email,
  name: employer.contactName,
}));

/* ----------------------------------------------------------------- jobs */

const job = (
  fields: Omit<RawJob, "createdAt" | "updatedAt" | "featured" | "showSalary" | "positions" | "languages"> &
    Partial<Pick<RawJob, "featured" | "showSalary" | "positions" | "languages">> & { readonly daysAgo: number },
): RawJob => {
  const { daysAgo, ...rest } = fields;
  return {
    featured: false,
    showSalary: false,
    positions: 1,
    languages: ["ar", "en"],
    ...rest,
    createdAt: at(daysAgo + 1),
    updatedAt: at(daysAgo),
    postedAt: rest.status === "open" || rest.status === "closed" ? (rest.postedAt ?? at(daysAgo)) : rest.postedAt,
  };
};

export const seedJobs: readonly RawJob[] = [
  job({
    id: "job-summit-pt",
    slug: "personal-trainer-summit-performance-gym",
    reference: "JB-10001",
    employerId: "emp-summit",
    title: "Personal Trainer — strength & conditioning",
    categoryId: "jc-personal-training",
    sportIds: ["sport-gym", "sport-fitness"],
    cityId: "amman",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "mid",
    salary: { min: jod(550), max: jod(800), period: "month" },
    showSalary: true,
    description:
      "You will run one-to-one and small-group sessions on our strength floor, write programmes for members with goals from general fitness to powerlifting meets, and keep their progress on record. Shifts are split between mornings and evenings, five days a week.",
    requirements: [
      "A recognised personal-training certification (NCSF, NASM, ACE or equivalent)",
      "Two years or more coaching adults on a gym floor",
      "Confident teaching the squat, hinge, press and pull patterns",
      "Arabic and conversational English",
    ],
    benefits: ["Commission on personal-training packages", "Paid CPD course every year", "Free membership for a family member"],
    positions: 2,
    closesOn: dateIn(24),
    status: "open",
    featured: true,
    daysAgo: 3,
  }),
  job({
    id: "job-summit-front",
    slug: "front-desk-membership-summit-performance-gym",
    reference: "JB-10002",
    employerId: "emp-summit",
    title: "Front Desk & Membership Advisor",
    categoryId: "jc-front-desk",
    sportIds: [],
    cityId: "amman",
    workMode: "on-site",
    employmentType: "part-time",
    experienceLevel: "entry",
    description:
      "The first person every member meets. You will check members in, sell and renew memberships, book assessments with the coaches and keep the reception tidy. Evening and weekend shifts.",
    requirements: ["Friendly and organised", "Basic computer skills", "Available at least three evenings a week"],
    benefits: ["Free membership", "Sales bonus"],
    status: "open",
    daysAgo: 9,
  }),
  job({
    id: "job-summit-coach-draft",
    slug: "group-coach-summit-performance-gym",
    reference: "JB-10003",
    employerId: "emp-summit",
    title: "Group Class Coach (HIIT & conditioning)",
    categoryId: "jc-group-fitness",
    sportIds: ["sport-fitness"],
    cityId: "amman",
    workMode: "on-site",
    employmentType: "freelance",
    experienceLevel: "mid",
    description: "Lead four to six group conditioning classes a week in our studio.",
    requirements: ["Group fitness certification", "A music-driven class you can show us"],
    benefits: [],
    status: "draft",
    daysAgo: 1,
  }),
  job({
    id: "job-ofoq-football",
    slug: "youth-football-coach-al-ofoq",
    reference: "JB-10004",
    employerId: "emp-ofoq",
    title: "مدرّب كرة قدم للناشئين (تحت ١٢ سنة)",
    categoryId: "jc-sports-coaching",
    sportIds: ["sport-football"],
    cityId: "irbid",
    workMode: "on-site",
    employmentType: "part-time",
    experienceLevel: "mid",
    salary: { min: jod(8), max: jod(12), period: "hour" },
    showSalary: true,
    description:
      "تدريب فريقين من الناشئين تحت ١٢ سنة، ثلاث حصص أسبوعياً بعد الظهر ومباراة يوم الجمعة. ستعمل مع مدير الفئات العمرية على خطة موسمية وتقييم دوري لكل لاعب.",
    requirements: [
      "رخصة تدريب من الاتحاد الأردني لكرة القدم (C أو أعلى)",
      "خبرة لا تقل عن سنتين مع الأطفال",
      "شهادة إسعافات أولية سارية",
    ],
    benefits: ["تأمين صحي", "دورات تطوير مدفوعة", "زي رياضي كامل"],
    positions: 2,
    closesOn: dateIn(12),
    status: "open",
    featured: true,
    languages: ["ar"],
    daysAgo: 5,
  }),
  job({
    id: "job-ofoq-lifeguard",
    slug: "lifeguard-al-ofoq",
    reference: "JB-10005",
    employerId: "emp-ofoq",
    title: "منقذ سباحة — المسبح الداخلي",
    categoryId: "jc-aquatics",
    sportIds: ["sport-swimming"],
    cityId: "irbid",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "entry",
    salary: { min: jod(380), max: jod(450), period: "month" },
    showSalary: true,
    description: "مراقبة المسبح الداخلي خلال ساعات العمل، وتطبيق قواعد السلامة، والمساعدة في حصص تعليم السباحة.",
    requirements: ["شهادة منقذ سباحة معتمدة", "لياقة بدنية عالية", "الاستعداد للعمل بنظام الورديات"],
    benefits: ["تأمين صحي", "وجبة يومية"],
    status: "open",
    languages: ["ar"],
    daysAgo: 14,
  }),
  job({
    id: "job-aqaba-swim",
    slug: "swim-instructor-aqaba-aquatic-centre",
    reference: "JB-10006",
    employerId: "emp-aqaba-aquatics",
    title: "Swim Instructor — children & adults",
    categoryId: "jc-aquatics",
    sportIds: ["sport-swimming", "sport-water-sports"],
    cityId: "aqaba",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "mid",
    description:
      "Teach our learn-to-swim levels from first splash to stroke correction, run two adult technique classes a week, and assist with open-water sessions in season.",
    requirements: ["Swim teaching qualification", "Lifeguard certificate", "At least one year teaching children"],
    benefits: ["Housing allowance for candidates relocating to Aqaba", "Transport to open-water sessions"],
    positions: 3,
    closesOn: dateIn(30),
    status: "open",
    daysAgo: 7,
  }),
  job({
    id: "job-coremotion-physio",
    slug: "sports-physiotherapist-coremotion",
    reference: "JB-10007",
    employerId: "emp-coremotion",
    title: "Sports Physiotherapist",
    categoryId: "jc-physiotherapy",
    sportIds: ["sport-running", "sport-football", "sport-basketball"],
    cityId: "amman",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "senior",
    description:
      "Assess and treat athletes from injury to return-to-play, write rehabilitation plans with their coaches, and cover pitch-side at two partner clubs on match days.",
    requirements: [
      "Bachelor's in physiotherapy and a valid Jordanian practising licence",
      "Four years or more in musculoskeletal or sports physiotherapy",
      "Experience writing return-to-play criteria",
    ],
    benefits: ["Competitive salary", "Conference budget", "Flexible schedule on non-match days"],
    status: "open",
    featured: true,
    daysAgo: 2,
  }),
  job({
    id: "job-coremotion-nutrition",
    slug: "sports-nutritionist-coremotion",
    reference: "JB-10008",
    employerId: "emp-coremotion",
    title: "Sports Nutritionist (part-time)",
    categoryId: "jc-nutrition",
    sportIds: [],
    cityId: "amman",
    workMode: "hybrid",
    employmentType: "part-time",
    experienceLevel: "mid",
    description: "Two clinic days a week plus remote follow-ups: nutrition plans for athletes in rehab and for our partner teams.",
    requirements: ["Degree in nutrition or dietetics", "Experience with athletes"],
    benefits: ["Work from home three days a week"],
    status: "closed",
    daysAgo: 45,
  }),
  job({
    id: "job-levant-sales",
    slug: "b2b-sales-executive-levant-sportswear",
    reference: "JB-10009",
    employerId: "emp-levant",
    title: "B2B Sales Executive — team kits",
    categoryId: "jc-sales-marketing",
    sportIds: ["sport-football", "sport-basketball"],
    cityId: "amman",
    workMode: "hybrid",
    employmentType: "full-time",
    experienceLevel: "mid",
    salary: { min: jod(600), max: jod(900), period: "month" },
    showSalary: true,
    description:
      "Own relationships with clubs, schools and academies across Jordan: quote team kits, follow orders through production, and grow the account book. Half the week is on the road.",
    requirements: ["Two years in B2B sales", "A driving licence", "Arabic and English"],
    benefits: ["Company car", "Quarterly commission", "Staff discount"],
    closesOn: dateIn(18),
    status: "open",
    daysAgo: 4,
  }),
  job({
    id: "job-levant-marketing",
    slug: "social-media-coordinator-levant-sportswear",
    reference: "JB-10010",
    employerId: "emp-levant",
    title: "Social Media Coordinator",
    categoryId: "jc-sales-marketing",
    sportIds: [],
    cityId: "amman",
    workMode: "remote",
    employmentType: "contract",
    experienceLevel: "entry",
    description: "A six-month contract to plan and publish our social content in Arabic and English, working with the design team.",
    requirements: ["A portfolio of social accounts you have run", "Excellent written Arabic and English"],
    benefits: ["Fully remote"],
    status: "rejected",
    moderationNote: "Please state the contract length and the working hours in the description, then submit again.",
    daysAgo: 6,
  }),
  job({
    id: "job-young-stars-coach",
    slug: "football-coach-young-stars-academy",
    reference: "JB-10011",
    employerId: "emp-young-stars",
    title: "مدرّب كرة قدم — الفئات العمرية ١٢–١٦",
    categoryId: "jc-sports-coaching",
    sportIds: ["sport-football"],
    cityId: "madaba",
    workMode: "on-site",
    employmentType: "part-time",
    experienceLevel: "mid",
    description:
      "قيادة التدريبات الفنية والبدنية للفئة ١٢–١٦ سنة، أربع حصص أسبوعياً، والمشاركة في بطولات الأكاديميات. نفضّل من لديه خبرة لعب سابقة.",
    requirements: ["رخصة تدريب C على الأقل", "خبرة سنة مع الناشئين"],
    benefits: ["مكافأة عن كل بطولة", "تطوير مهني"],
    closesOn: dateIn(20),
    status: "open",
    languages: ["ar"],
    daysAgo: 1,
  }),
  job({
    id: "job-young-stars-intern",
    slug: "assistant-coach-internship-young-stars",
    reference: "JB-10012",
    employerId: "emp-young-stars",
    title: "تدريب صيفي: مساعد مدرّب",
    categoryId: "jc-sports-coaching",
    sportIds: ["sport-football"],
    cityId: "madaba",
    workMode: "on-site",
    employmentType: "internship",
    experienceLevel: "entry",
    description: "فرصة لطلاب علوم الرياضة للتدريب العملي مع مدرّبي الأكاديمية لمدة شهرين.",
    requirements: ["طالب في علوم الرياضة أو تخصص قريب"],
    benefits: ["شهادة خبرة", "إمكانية التعيين بعد التدريب"],
    status: "pending",
    languages: ["ar"],
    daysAgo: 0,
  }),
  job({
    id: "job-zarqa-coach",
    slug: "strength-coach-zarqa-strength-house",
    reference: "JB-10013",
    employerId: "emp-zarqa-strength",
    title: "مدرّب قوة ورفع أثقال",
    categoryId: "jc-personal-training",
    sportIds: ["sport-gym"],
    cityId: "zarqa",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "mid",
    description: "تدريب الأعضاء على رفع الأثقال الأولمبي والقوة البدنية، وإعداد البرامج الفردية.",
    requirements: ["شهادة مدرّب شخصي معتمدة", "خبرة في رفع الأثقال"],
    benefits: [],
    status: "pending",
    languages: ["ar"],
    daysAgo: 1,
  }),
  job({
    id: "job-aqaba-facilities",
    slug: "pool-technician-aqaba-aquatic-centre",
    reference: "JB-10014",
    employerId: "emp-aqaba-aquatics",
    title: "Pool Plant Technician",
    categoryId: "jc-facilities",
    sportIds: [],
    cityId: "aqaba",
    workMode: "on-site",
    employmentType: "full-time",
    experienceLevel: "mid",
    description: "Run and maintain the pool's filtration, dosing and heating plant, and log water tests three times a day.",
    requirements: ["Vocational certificate in mechanics or electrics", "Pool plant experience preferred"],
    benefits: ["Overtime paid", "Housing allowance"],
    status: "open",
    daysAgo: 11,
  }),
];

/* --------------------------------------------------------- applications */

export const seedCvFiles: readonly RawCvFile[] = [
  cvFile("cv-hussein", "cust-1", "Hussein Ayoub", ["NCSF Certified Personal Trainer", "3 years coaching at a gym in Amman"], 6),
  cvFile("cv-noor", "cust-2", "Noor Khalil", ["Swim teacher and lifeguard", "2 years teaching children"], 8),
  cvFile("cv-yazan", "cust-4", "Yazan Mousa", ["Football coaching licence C", "Former club player"], 4),
];

const step = (status: ApplicationStatus, daysAgo: number, by: StatusStep["by"]): StatusStep => ({ status, at: at(daysAgo, 12), by });

export const seedJobApplications: readonly RawJobApplication[] = [
  {
    id: "ja-1",
    reference: "JA-20001",
    jobId: "job-summit-pt",
    employerId: "emp-summit",
    customerId: "cust-1",
    candidate: { name: "Hussein Ayoub", email: "hussein@example.test", phone: "+962790000001" },
    cvId: "cv-hussein",
    coverLetter:
      "I have coached strength and conditioning for three years and hold the NCSF personal trainer certification. I would love to build programmes for your members and grow with a team that keeps learning.",
    yearsExperience: 3,
    certifications: "NCSF-CPT, First Aid",
    availableFrom: dateIn(14),
    expectedSalary: jod(700),
    status: "shortlisted",
    submittedAt: at(2, 11),
    updatedAt: at(1, 12),
    history: [step("submitted", 2, "candidate"), step("reviewing", 1, "employer"), step("shortlisted", 1, "employer")],
    seenByEmployerAt: at(1, 9),
  },
  {
    id: "ja-2",
    reference: "JA-20002",
    jobId: "job-aqaba-swim",
    employerId: "emp-aqaba-aquatics",
    customerId: "cust-2",
    candidate: { name: "Noor Khalil", email: "noor@example.test", phone: "+962790000002" },
    cvId: "cv-noor",
    coverLetter:
      "I teach children's swimming levels one to four and hold a current lifeguard certificate. I am ready to relocate to Aqaba for the season and beyond.",
    yearsExperience: 2,
    certifications: "Lifeguard, Swim Teacher Level 2",
    status: "submitted",
    submittedAt: at(1, 16),
    updatedAt: at(1, 16),
    history: [step("submitted", 1, "candidate")],
  },
  {
    id: "ja-3",
    reference: "JA-20003",
    jobId: "job-ofoq-football",
    employerId: "emp-ofoq",
    customerId: "cust-4",
    candidate: { name: "Yazan Mousa", email: "yazan@example.test", phone: "+962790000004" },
    cvId: "cv-yazan",
    coverLetter: "لعبت كرة القدم في نادٍ محلي ثماني سنوات وأحمل رخصة تدريب C، وأعمل حالياً مع فريق مدرسي للناشئين.",
    yearsExperience: 2,
    certifications: "رخصة تدريب C",
    status: "interview",
    statusNote: "المقابلة يوم الأحد الساعة الرابعة عصراً في النادي.",
    submittedAt: at(4, 10),
    updatedAt: at(2, 13),
    history: [step("submitted", 4, "candidate"), step("reviewing", 3, "employer"), step("shortlisted", 3, "employer"), step("interview", 2, "employer")],
    seenByEmployerAt: at(3, 9),
  },
  {
    id: "ja-4",
    reference: "JA-20004",
    jobId: "job-coremotion-nutrition",
    employerId: "emp-coremotion",
    customerId: "cust-1",
    candidate: { name: "Hussein Ayoub", email: "hussein@example.test", phone: "+962790000001" },
    cvId: "cv-hussein",
    coverLetter: "I completed a sports nutrition course last year and support my clients' meal planning today.",
    yearsExperience: 1,
    status: "rejected",
    statusNote: "Thank you — we needed a registered dietitian for this role.",
    submittedAt: at(40, 10),
    updatedAt: at(35, 10),
    history: [step("submitted", 40, "candidate"), step("reviewing", 38, "employer"), step("rejected", 35, "employer")],
    seenByEmployerAt: at(38, 9),
  },
];

/* ---------------------------------------------------------------- cities */

/** The main city of each governorate, in both languages. */
export const cityNames: Readonly<Record<JobCity, LocalizedText>> = {
  amman: { en: "Amman", ar: "عمّان" },
  irbid: { en: "Irbid", ar: "إربد" },
  zarqa: { en: "Zarqa", ar: "الزرقاء" },
  aqaba: { en: "Aqaba", ar: "العقبة" },
  salt: { en: "Salt", ar: "السلط" },
  madaba: { en: "Madaba", ar: "مادبا" },
  jerash: { en: "Jerash", ar: "جرش" },
  ajloun: { en: "Ajloun", ar: "عجلون" },
  karak: { en: "Karak", ar: "الكرك" },
  mafraq: { en: "Mafraq", ar: "المفرق" },
  maan: { en: "Ma'an", ar: "معان" },
  tafilah: { en: "Tafilah", ar: "الطفيلة" },
};
