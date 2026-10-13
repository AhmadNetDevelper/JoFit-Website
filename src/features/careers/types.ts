import type { ListQuery, MediaImage, Money, Paginated } from "@/types";

/**
 * CAREERS — JoFit's job marketplace for the sports industry in Jordan.
 *
 * It is not JoFit hiring for itself. Sports businesses — gyms, sports centres,
 * clubs, academies, clinics, sports companies — open an EMPLOYER account, post
 * vacancies, and receive applications. Candidates (trainers, coaches,
 * physiotherapists, front-desk and management staff…) apply with a customer
 * account and a CV. JoFit staff verify every employer and review every job
 * before it is public; the admin is where that happens.
 *
 * Three views of the same records:
 *   - the public board (`/careers`) — resolved into the reader's language;
 *   - the candidate's applications (`/account/applications`);
 *   - the employer's portal (`/employer`) — their jobs and their applicants.
 *
 * What the employer and the candidate WRITE (a job title, a description, a
 * cover letter) is stored as written, in whichever language they wrote it, and
 * rendered with `dir="auto"`. What is chosen from a list (category, city,
 * contract type) is an id, shown in the reader's language.
 */

/* ---------------------------------------------------------------- taxonomy */

export const EMPLOYER_KINDS = ["gym", "sports-centre", "club", "academy", "clinic", "sports-company", "other"] as const;
export type EmployerKind = (typeof EMPLOYER_KINDS)[number];

export const EMPLOYER_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;
export type EmployerSize = (typeof EMPLOYER_SIZES)[number];

export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["on-site", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EXPERIENCE_LEVELS = ["entry", "mid", "senior"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/** The main city of each governorate. Names are resolved per locale by the service (`listCities`). */
export const JOB_CITIES = [
  "amman",
  "irbid",
  "zarqa",
  "aqaba",
  "salt",
  "madaba",
  "jerash",
  "ajloun",
  "karak",
  "mafraq",
  "maan",
  "tafilah",
] as const;
export type JobCity = (typeof JOB_CITIES)[number];

export const JOB_LANGUAGES = ["ar", "en"] as const;
export type JobLanguage = (typeof JOB_LANGUAGES)[number];

export const SALARY_PERIODS = ["month", "hour"] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export interface SalaryRange {
  readonly min?: Money;
  readonly max?: Money;
  readonly period: SalaryPeriod;
}

/** Staff-managed, like every taxonomy. */
export interface JobCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /** Open, public jobs filed under it. */
  readonly openJobCount: number;
}

/* ------------------------------------------------------------- lifecycles */

/**
 * A job's life:
 *   draft → pending                 the employer submits it for review
 *   pending → open | rejected       JoFit staff decide (a rejection carries a note)
 *   pending → draft                 the employer takes it back
 *   open → closed                   the employer or staff close it (or it fills)
 *   closed → pending                the employer reopens it — reviewed again
 *   rejected → pending | draft      the employer fixes it
 * Saving changes to an OPEN job sends it back to `pending`.
 */
export const JOB_STATUSES = ["draft", "pending", "open", "closed", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * An application's life:
 *   submitted → reviewing → shortlisted → interview → offered → hired
 *   any of those (not hired) → rejected         the employer
 *   any live one → withdrawn                    the candidate
 * `hired`, `rejected` and `withdrawn` are final.
 */
export const APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const EMPLOYER_VERIFICATION_STATUSES = ["pending", "verified", "rejected", "suspended"] as const;
export type EmployerVerificationStatus = (typeof EMPLOYER_VERIFICATION_STATUSES)[number];

/* ------------------------------------------------------------- public board */

/** An employer as the public board shows it. Only verified employers are public. */
export interface EmployerSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly kind: EmployerKind;
  /** Nullable on the live `EmployerSummaryDto`/`EmployerProfileDto`. */
  readonly city?: { readonly id: JobCity; readonly name: string };
  readonly logo?: MediaImage;
  readonly openJobCount: number;
}

export interface EmployerProfile extends EmployerSummary {
  /** As the employer wrote it. */
  readonly about: string;
  readonly website?: string;
  readonly size?: EmployerSize;
  /**
   * The public contact for candidates' questions. The live `EmployerProfileDto`
   * has no email (or phone) at all, so it is only ever set by the mock.
   */
  readonly email?: string;
  readonly phone?: string;
}

/** A job as a card in the list. */
export interface JobSummary {
  readonly id: string;
  readonly slug: string;
  readonly reference: string;
  /** As the employer wrote it. */
  readonly title: string;
  readonly employer: Pick<EmployerSummary, "id" | "slug" | "name" | "logo" | "kind">;
  /** `category`, `city` and `postedAt` are all nullable on the live `JobPostingDto`. */
  readonly category?: { readonly id: string; readonly slug: string; readonly name: string };
  readonly city?: { readonly id: JobCity; readonly name: string };
  readonly employmentType: EmploymentType;
  readonly workMode: WorkMode;
  readonly experienceLevel: ExperienceLevel;
  /** Only when the employer chose to publish it. */
  readonly salary?: SalaryRange;
  readonly postedAt?: string;
  /** `YYYY-MM-DD`; absent = open until closed. */
  readonly closesOn?: string;
  readonly featured: boolean;
}

/** A job's page. */
export interface JobPosting extends JobSummary {
  /**
   * The live `EmployerRefDto` on a job carries no `city` or `openJobCount`;
   * only the mock fills them.
   */
  readonly employer: JobSummary["employer"] & Partial<Pick<EmployerSummary, "city" | "openJobCount">>;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly sports: readonly { readonly id: string; readonly slug: string; readonly name: string }[];
  readonly languages: readonly JobLanguage[];
  readonly positions: number;
  /** False once it is closed, past its closing date, or filled. */
  readonly acceptingApplications: boolean;
}

export const JOB_SORT_KEYS = ["newest", "closing-soon", "salary-desc"] as const;
export type JobSortKey = (typeof JOB_SORT_KEYS)[number];

export interface JobListQuery extends ListQuery {
  readonly categorySlugs?: readonly string[];
  readonly cityIds?: readonly JobCity[];
  readonly employmentTypes?: readonly EmploymentType[];
  readonly workModes?: readonly WorkMode[];
  readonly experienceLevels?: readonly ExperienceLevel[];
  readonly sportSlugs?: readonly string[];
  readonly employerSlug?: string;
}

export interface JobListResult extends Paginated<JobSummary> {
  /** How many jobs each option would show with the other filters applied. */
  readonly facets: {
    readonly categories: readonly { readonly value: string; readonly label: string; readonly count: number }[];
    readonly cities: readonly { readonly value: JobCity; readonly label: string; readonly count: number }[];
    readonly employmentTypes: readonly { readonly value: EmploymentType; readonly count: number }[];
    readonly workModes: readonly { readonly value: WorkMode; readonly count: number }[];
    readonly experienceLevels: readonly { readonly value: ExperienceLevel; readonly count: number }[];
  };
}

export interface CareersStats {
  readonly openJobs: number;
  readonly employersHiring: number;
  readonly categories: number;
}

/* ---------------------------------------------------------------- the CV */

/** A private file: only the candidate, the employer applied to, and staff can open it. */
export interface CvFile {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType: "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  readonly bytes: number;
}

export const CV_MAX_BYTES = 5 * 1024 * 1024;

/* ----------------------------------------------------------- the candidate */

export interface ApplicationInput {
  readonly jobId: string;
  readonly cvId: string;
  /** 30–3000 characters. */
  readonly coverLetter: string;
  /** Whole years, 0–50. */
  readonly yearsExperience: number;
  /** Certifications, as the candidate lists them (≤ 500). */
  readonly certifications?: string;
  /** `YYYY-MM-DD`, today or later. */
  readonly availableFrom?: string;
  /** Monthly, JOD. */
  readonly expectedSalary?: Money;
}

export interface StatusStep {
  readonly status: ApplicationStatus;
  readonly at: string;
  readonly by: "candidate" | "employer" | "staff";
}

/**
 * The job as a submitted application names it. Widened from
 * `Pick<JobSummary, "id"|"slug"|"title"|"employer"|"city"|"employmentType">`:
 * the live `ApplicationJobRef` is flat (`id`, `reference`, `title`, `slug`,
 * `employerName`) — no nested `employer` object, no `city`, no
 * `employmentType`. Only the employer's name survives, as a partial
 * `employer`; `city`/`employmentType` have no live source here at all.
 */
export interface CandidateApplicationJobRef {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly employer: Pick<JobSummary["employer"], "name">;
  readonly city?: JobSummary["city"];
  readonly employmentType?: EmploymentType;
}

/** An application as its candidate sees it. */
export interface CandidateApplication {
  readonly id: string;
  readonly reference: string;
  readonly job: CandidateApplicationJobRef;
  readonly status: ApplicationStatus;
  /** A note the employer chose to send with the status (e.g. why it was declined). */
  readonly statusNote?: string;
  /** The candidate's own reason, when they withdrew. */
  readonly withdrawReason?: string;
  /** Nullable on the live `CandidateApplicationDto`. */
  readonly cv?: CvFile;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string;
  readonly availableFrom?: string;
  readonly expectedSalary?: Money;
  readonly submittedAt: string;
  /**
   * Live `CandidateApplicationDto` has no `updatedAt` field at all — defaulted
   * to `submittedAt` (the only timestamp the API gives) rather than widened to
   * optional, since every reader of this field just wants "the latest known
   * activity date" and `submittedAt` is the closest honest answer.
   */
  readonly updatedAt: string;
  readonly history: readonly StatusStep[];
  /** True while it can still be withdrawn. */
  readonly canWithdraw: boolean;
}

/* ------------------------------------------------------------ the employer */

export interface EmployerRegistration {
  readonly companyName: string;
  readonly kind: EmployerKind;
  readonly cityId: JobCity;
  readonly contactName: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly website?: string;
  readonly locale: "en" | "ar";
}

/** The employer's own record, editable in the portal. */
export interface EmployerAccountProfile {
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
  /** Why staff rejected or suspended it. */
  readonly verificationNote?: string;
  readonly createdAt: string;
}

export interface EmployerProfileInput {
  readonly name: string;
  readonly kind: EmployerKind;
  readonly cityId: JobCity;
  readonly about: string;
  readonly website?: string;
  readonly size?: EmployerSize;
  readonly email: string;
  readonly phone?: string;
  readonly contactName: string;
  /** `null` removes the logo; absent keeps it. */
  readonly logo?: MediaImage | null;
}

/** What an employer writes to post or change a job. */
export interface JobDraft {
  readonly title: string;
  readonly categoryId: string;
  readonly sportIds: readonly string[];
  readonly cityId: JobCity;
  readonly workMode: WorkMode;
  readonly employmentType: EmploymentType;
  readonly experienceLevel: ExperienceLevel;
  readonly salary?: SalaryRange;
  /** Publish the salary range on the job page. */
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly JobLanguage[];
  /** 1–50. */
  readonly positions: number;
  readonly closesOn?: string;
}

/** A job as its employer manages it. */
export interface EmployerJob extends JobDraft {
  readonly id: string;
  readonly slug: string;
  readonly reference: string;
  readonly status: JobStatus;
  /** Why staff rejected it. */
  readonly moderationNote?: string;
  readonly featured: boolean;
  readonly postedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly applicationCount: number;
  /** Applications still `submitted` — not yet looked at. */
  readonly newApplicationCount: number;
  /** No live source: `EmployerJobDto` has no hired count. Only the mock sets it. */
  readonly hiredCount?: number;
}

export interface EmployerJobListQuery extends ListQuery {
  readonly statuses?: readonly JobStatus[];
}

/** An application as the employer sees it. */
export interface EmployerApplication {
  readonly id: string;
  readonly reference: string;
  readonly job: { readonly id: string; readonly title: string; readonly reference: string };
  readonly candidate: { readonly name: string; readonly email: string; readonly phone?: string };
  readonly status: ApplicationStatus;
  readonly statusNote?: string;
  /** The candidate's reason, when they withdrew. */
  readonly withdrawReason?: string;
  /** Private to the employer; the candidate never sees it. */
  readonly employerNote?: string;
  /** Nullable on the live `EmployerApplicationDto`. */
  readonly cv?: CvFile;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string;
  readonly availableFrom?: string;
  readonly expectedSalary?: Money;
  readonly submittedAt: string;
  /** No live source: `EmployerApplicationDto` has no `updatedAt`. Only the mock sets it. */
  readonly updatedAt?: string;
  readonly history: readonly StatusStep[];
  /** The moves the graph allows from here. */
  readonly nextStatuses: readonly ApplicationStatus[];
  /** Still `submitted` and not yet opened by the employer. */
  readonly isNew: boolean;
}

export interface EmployerApplicationListQuery extends ListQuery {
  readonly jobId?: string;
  readonly statuses?: readonly ApplicationStatus[];
}

export interface EmployerDashboard {
  readonly employer: EmployerAccountProfile;
  readonly counts: {
    readonly openJobs: number;
    readonly pendingJobs: number;
    readonly draftJobs: number;
    readonly newApplications: number;
    readonly totalApplications: number;
  };
  readonly recentApplications: readonly EmployerApplication[];
}
