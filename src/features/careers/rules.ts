import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CITIES,
  JOB_LANGUAGES,
  SALARY_PERIODS,
  WORK_MODES,
  type ApplicationInput,
  type ApplicationStatus,
  type JobDraft,
  type JobStatus,
} from "./types";

/*
 * The careers rules, written once. The mock services run them; the API must
 * enforce exactly these (docs/BACKEND-BRIEF.md §7.14). Messages are English,
 * in the style of the other services — the pages check the common cases
 * first in the reader's language.
 */

/** The moves an EMPLOYER may make from each status. */
export const EMPLOYER_APPLICATION_MOVES: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

/** The statuses from which a CANDIDATE may withdraw. */
export const WITHDRAWABLE: readonly ApplicationStatus[] = ["submitted", "reviewing", "shortlisted", "interview", "offered"];

export const FINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = ["hired", "rejected", "withdrawn"];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

/** Today in Amman, as `YYYY-MM-DD`. */
export function ammanToday(now = Date.now()): string {
  return new Date(now + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** Whether a job takes applications right now. */
export function acceptsApplications(
  job: { readonly status: JobStatus; readonly closesOn?: string },
  employerVerified: boolean,
  today = ammanToday(),
): boolean {
  return job.status === "open" && employerVerified && (!job.closesOn || job.closesOn >= today);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const lengthBetween = (value: string, min: number, max: number) => value.length >= min && value.length <= max;

/** A job draft's field errors, keyed as the form names them. Empty when valid. */
export function jobDraftErrors(
  draft: JobDraft,
  known: { readonly categoryIds: readonly string[]; readonly sportIds: readonly string[] },
  today = ammanToday(),
): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = draft.title?.trim() ?? "";
  if (!lengthBetween(title, 5, 120)) errors.title = "A job title of 5 to 120 characters.";
  if (!known.categoryIds.includes(draft.categoryId)) errors.categoryId = "Choose a category.";
  if (!Array.isArray(draft.sportIds) || draft.sportIds.some((id) => !known.sportIds.includes(id))) {
    errors.sportIds = "Choose sports from the list.";
  }
  if (!(JOB_CITIES as readonly string[]).includes(draft.cityId)) errors.cityId = "Choose the city.";
  if (!(WORK_MODES as readonly string[]).includes(draft.workMode)) errors.workMode = "Choose where the work happens.";
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(draft.employmentType)) errors.employmentType = "Choose the contract type.";
  if (!(EXPERIENCE_LEVELS as readonly string[]).includes(draft.experienceLevel)) errors.experienceLevel = "Choose the experience level.";

  if (draft.salary) {
    const { min, max, period } = draft.salary;
    if (!(SALARY_PERIODS as readonly string[]).includes(period)) errors["salary.period"] = "Per month or per hour.";
    const valid = (money: typeof min) =>
      money === undefined || (money.currency === "JOD" && Number.isInteger(money.amount) && money.amount > 0);
    if (!min && !max) errors["salary.min"] = "Give a minimum, a maximum, or both.";
    if (!valid(min)) errors["salary.min"] = "An amount in JOD above zero.";
    if (!valid(max)) errors["salary.max"] = "An amount in JOD above zero.";
    if (min && max && min.amount > max.amount) errors["salary.max"] = "The maximum is below the minimum.";
  } else if (draft.showSalary) {
    errors["salary.min"] = "Add the salary range, or choose not to show it.";
  }

  const description = draft.description?.trim() ?? "";
  if (!lengthBetween(description, 50, 5000)) errors.description = "Describe the job in 50 to 5000 characters.";
  const list = (items: readonly string[] | undefined) =>
    Array.isArray(items) && items.length <= 15 && items.every((item) => typeof item === "string" && lengthBetween(item.trim(), 2, 200));
  if (!list(draft.requirements)) errors.requirements = "Up to 15 requirements, each 2 to 200 characters.";
  if (!list(draft.benefits)) errors.benefits = "Up to 15 benefits, each 2 to 200 characters.";
  if (
    !Array.isArray(draft.languages) ||
    draft.languages.length === 0 ||
    draft.languages.some((language) => !(JOB_LANGUAGES as readonly string[]).includes(language))
  ) {
    errors.languages = "Choose at least one working language.";
  }
  if (!Number.isInteger(draft.positions) || draft.positions < 1 || draft.positions > 50) errors.positions = "Between 1 and 50 openings.";
  if (draft.closesOn !== undefined && (!DATE.test(draft.closesOn) || draft.closesOn < today)) {
    errors.closesOn = "A closing date from today onwards.";
  }
  return errors;
}

/** An application's field errors. Empty when valid. */
export function applicationErrors(input: ApplicationInput, today = ammanToday()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.cvId) errors.cv = "Attach your CV.";
  if (!lengthBetween(input.coverLetter?.trim() ?? "", 30, 3000)) errors.coverLetter = "Tell the employer why you — 30 to 3000 characters.";
  if (!Number.isInteger(input.yearsExperience) || input.yearsExperience < 0 || input.yearsExperience > 50) {
    errors.yearsExperience = "Whole years, 0 to 50.";
  }
  if (input.certifications !== undefined && input.certifications.length > 500) errors.certifications = "At most 500 characters.";
  if (input.availableFrom !== undefined && (!DATE.test(input.availableFrom) || input.availableFrom < today)) {
    errors.availableFrom = "A date from today onwards.";
  }
  if (
    input.expectedSalary !== undefined &&
    (input.expectedSalary.currency !== "JOD" || !Number.isInteger(input.expectedSalary.amount) || input.expectedSalary.amount <= 0)
  ) {
    errors.expectedSalary = "A monthly amount in JOD above zero.";
  }
  return errors;
}

/** What a CV may be, decided from its first bytes — never its name. */
export function sniffCvType(bytes: Uint8Array): "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | undefined {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf"; // %PDF
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "application/msword";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return undefined;
}

/** What a logo may be. */
export function sniffImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    return "image/webp";
  }
  return undefined;
}
