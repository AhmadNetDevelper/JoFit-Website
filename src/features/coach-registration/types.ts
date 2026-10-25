/**
 * A coach opening their own account — `POST /v1/auth/register-coach`.
 *
 * The form is modelled on Mudarrib's "اشترك كمدرب" page, which the live API
 * copies field for field (see `docs/mudarrib-coach-registration.md`): personal
 * details, then four optional repeatable blocks (education, certificates,
 * experience, skills), then the photo. The pickers are fed by the API's
 * reference tables, which staff manage in the admin under Reference data.
 */

/** One row of a reference table, already in the reader's language. */
export interface RegistrationOption {
  readonly id: string;
  readonly name: string;
}

/** Everything the form's pickers need, loaded once per render. */
export interface CoachRegistrationOptions {
  readonly countries: readonly RegistrationOption[];
  readonly jobStatuses: readonly RegistrationOption[];
  readonly academicDegrees: readonly RegistrationOption[];
  readonly universityMajors: readonly RegistrationOption[];
  readonly jobTypes: readonly RegistrationOption[];
  /** The live API keeps the skill list in its generic `Course` table. */
  readonly skills: readonly RegistrationOption[];
  /** `GET /v1/sports`: a coach page needs at least one. */
  readonly sports: readonly RegistrationOption[];
  /** `GET /v1/coach-locations`: the city a coach is based in. */
  readonly locations: readonly RegistrationOption[];
}

/** `User.GenderId`: 1 male, 2 female. */
export type GenderId = 1 | 2;

/** Dates are `YYYY-MM-DD`, as a date input gives them. */
export interface EducationEntry {
  readonly schoolName: string;
  readonly academicDegreeId: string;
  readonly universityMajorId: string;
  readonly startDate: string;
  /** Absent while `current`. */
  readonly endDate?: string;
  readonly current: boolean;
}

export interface CertificateEntry {
  readonly name: string;
  readonly organization: string;
  readonly issuedDate: string;
  readonly expiryDate?: string;
  readonly credentialId: string;
  readonly credentialUrl?: string;
  readonly file?: File;
}

export interface ExperienceEntry {
  /** The job title. Sent as the API's `address`, which is Mudarrib's العنوان. */
  readonly title: string;
  readonly jobTypeId: string;
  readonly companyName: string;
  /** Sent as `companyAddress` — Mudarrib's الموقع. */
  readonly location: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly current: boolean;
}

export interface SkillEntry {
  readonly skillId: string;
  /** 0–100. */
  readonly level: number;
}

export interface CoachRegistration {
  readonly userName: string;
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  /** Dialling code and number joined, e.g. `+962791234567`. */
  readonly phoneNumber: string;
  readonly birthDate?: string;
  readonly genderId: GenderId;
  readonly countryId: string;
  readonly cityId: string;
  readonly jobStatusId?: string;
  readonly profileImage?: File;
  /** The public coach page. Every part may be filled in later from the coach area. */
  readonly profile: {
    readonly slug: string;
    readonly name: { readonly en: string; readonly ar: string };
    readonly headline: { readonly en: string; readonly ar: string };
    readonly sportIds: readonly string[];
    readonly locationId: string;
    /** `ar` and/or `en`: the languages the coach works in. */
    readonly languages: readonly ("ar" | "en")[];
    readonly bio?: { readonly en: string; readonly ar: string };
  };
  readonly educations: readonly EducationEntry[];
  readonly certificates: readonly CertificateEntry[];
  readonly experiences: readonly ExperienceEntry[];
  readonly skills: readonly SkillEntry[];
}

/** The API's limits, so the form and the server action agree with it. */
export const COACH_REGISTRATION_LIMITS = {
  userNameMin: 3,
  passwordMin: 6,
  phoneMin: 6,
  nameMax: 200,
  /** `Profile.Headline.*` and `Profile.Bio.*` are each capped at 200. */
  profileTextMax: 200,
  schoolNameMax: 100,
  certificateTextMax: 100,
  credentialUrlMax: 500,
  experienceTitleMax: 300,
  companyMax: 100,
  maxSkills: 10,
  maxRows: 10,
  /** Per uploaded file, and for every file of one submission together. */
  fileMaxBytes: 3 * 1024 * 1024,
  filesTotalMaxBytes: 10 * 1024 * 1024,
} as const;

/**
 * Dialling codes offered beside the phone number: the Arab League countries,
 * the region JoFit serves. ISO codes, so the country name is localized by
 * `Intl.DisplayNames` rather than kept in a second list.
 */
export const DIAL_CODES: readonly { readonly region: string; readonly code: string }[] = [
  { region: "JO", code: "+962" },
  { region: "SA", code: "+966" },
  { region: "AE", code: "+971" },
  { region: "KW", code: "+965" },
  { region: "QA", code: "+974" },
  { region: "BH", code: "+973" },
  { region: "OM", code: "+968" },
  { region: "IQ", code: "+964" },
  { region: "SY", code: "+963" },
  { region: "LB", code: "+961" },
  { region: "PS", code: "+970" },
  { region: "EG", code: "+20" },
  { region: "LY", code: "+218" },
  { region: "TN", code: "+216" },
  { region: "DZ", code: "+213" },
  { region: "MA", code: "+212" },
  { region: "MR", code: "+222" },
  { region: "SD", code: "+249" },
  { region: "YE", code: "+967" },
  { region: "SO", code: "+252" },
  { region: "DJ", code: "+253" },
  { region: "KM", code: "+269" },
];
