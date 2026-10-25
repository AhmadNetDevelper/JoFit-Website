import { AppError, fieldErrorsOf } from "@/lib";
import { httpClient } from "@/services";

import type { CoachRegistration, RegistrationOption } from "../types";
import type { CoachRegistrationService } from "./coach-registration.contract";

/** Every `…LookupDto` of the reference tables: `{id, name}`, the name already in `language`. */
interface LookupDto {
  readonly id: number;
  readonly name: string;
}

const toOptions = (rows: readonly LookupDto[]): RegistrationOption[] =>
  rows.map((row) => ({ id: String(row.id), name: row.name }));

/*
 * `GET /v1/{Table}/all` answers the active rows of a reference table. NOTE: the
 * live spec marks these `security: [Bearer]`, and a visitor signing up has no
 * token. Called anonymously here; if the backend keeps them behind sign-in,
 * the form's pickers come back empty — raise it with the backend team.
 */
const lookup = (table: string, language: string) =>
  httpClient
    .get<LookupDto[]>(`/v1/${table}/all`, { query: { language }, revalidate: 3600 })
    .then(toOptions);

/*
 * The date input's `YYYY-MM-DD`, as the `date-time` the API binds. No `Z`: a UTC
 * value makes the API's database refuse the save (DbUpdateException, HTTP 500),
 * and a calendar date has no time zone anyway.
 */
const toDateTime = (date: string) => `${date}T00:00:00Z`;

/** `User.BirthOfDate` is a `timestamp without time zone` column, which rejects a UTC value. */
const toLocalDateTime = (date: string) => `${date}T00:00:00`;

function appendIfSet(form: FormData, key: string, value: string | undefined): void {
  if (value) form.append(key, value);
}

/**
 * The multipart body, in ASP.NET's binding shape: dotted parts for the nested
 * objects (`User.Email`, `Profile.Name.En`) and indexed keys for the lists
 * (`Educations[0].SchoolName`, a file as `Certificates[0].CertificateFile`).
 * An empty list sends no key. The same shape the admin's coach editor sends.
 */
function toForm(input: CoachRegistration): FormData {
  const form = new FormData();
  form.append("User.UserName", input.userName);
  form.append("User.Email", input.email);
  form.append("User.Password", input.password);
  form.append("User.PhoneNumber", input.phoneNumber);
  form.append("User.FullName", input.fullName);
  if (input.birthDate) form.append("User.BirthOfDate", toLocalDateTime(input.birthDate));
  form.append("User.GenderId", String(input.genderId));
  form.append("User.CountryId", input.countryId);
  form.append("User.CityId", input.cityId);
  appendIfSet(form, "User.JobStatusId", input.jobStatusId);
  if (input.profileImage) form.append("User.ProfileImage", input.profileImage, input.profileImage.name);

  const { profile } = input;
  form.append("Profile.Slug", profile.slug);
  form.append("Profile.Name.En", profile.name.en);
  form.append("Profile.Name.Ar", profile.name.ar);
  form.append("Profile.Headline.En", profile.headline.en);
  form.append("Profile.Headline.Ar", profile.headline.ar);
  form.append("Profile.LocationId", profile.locationId);
  profile.sportIds.forEach((id, index) => form.append(`Profile.SportIds[${index}]`, id));
  profile.languages.forEach((language, index) => form.append(`Profile.Languages[${index}]`, language));
  if (profile.bio) {
    form.append("Profile.Bio.En", profile.bio.en);
    form.append("Profile.Bio.Ar", profile.bio.ar);
  }

  input.educations.forEach((entry, index) => {
    const key = `Educations[${index}]`;
    form.append(`${key}.SchoolName`, entry.schoolName);
    form.append(`${key}.AcademicDegreeId`, entry.academicDegreeId);
    form.append(`${key}.UniversityMajorId`, entry.universityMajorId);
    form.append(`${key}.StartDate`, toDateTime(entry.startDate));
    if (entry.endDate && !entry.current) form.append(`${key}.EndDate`, toDateTime(entry.endDate));
    form.append(`${key}.IsStillEducation`, String(entry.current));
  });
  input.certificates.forEach((entry, index) => {
    const key = `Certificates[${index}]`;
    form.append(`${key}.CertificateName`, entry.name);
    form.append(`${key}.OrganizationName`, entry.organization);
    form.append(`${key}.IssuedDate`, toDateTime(entry.issuedDate));
    if (entry.expiryDate) form.append(`${key}.ExpiryDate`, toDateTime(entry.expiryDate));
    form.append(`${key}.CredentialId`, entry.credentialId);
    appendIfSet(form, `${key}.CredentialUrl`, entry.credentialUrl);
    if (entry.file) form.append(`${key}.CertificateFile`, entry.file, entry.file.name);
  });
  input.experiences.forEach((entry, index) => {
    const key = `Experiences[${index}]`;
    form.append(`${key}.Address`, entry.title);
    form.append(`${key}.JobTypeId`, entry.jobTypeId);
    form.append(`${key}.CompanyName`, entry.companyName);
    form.append(`${key}.CompanyAddress`, entry.location);
    form.append(`${key}.StartDate`, toDateTime(entry.startDate));
    if (entry.endDate && !entry.current) form.append(`${key}.EndDate`, toDateTime(entry.endDate));
    form.append(`${key}.IsStillWorking`, String(entry.current));
  });
  input.skills.forEach((entry, index) => {
    form.append(`Skills[${index}].CourseId`, entry.skillId);
    form.append(`Skills[${index}].PercentageScore`, String(entry.level));
  });
  return form;
}

/** The API's property names where the form calls a field something else. */
const RENAMED: Readonly<Record<string, string>> = {
  birthOfDate: "birthDate",
  certificateName: "name",
  organizationName: "organization",
  certificateFile: "file",
  address: "title",
  companyAddress: "location",
  courseId: "skillId",
  percentageScore: "level",
  isStillEducation: "current",
  isStillWorking: "current",
};

const BARE_ACCOUNT_KEYS: ReadonlySet<string> = new Set([
  "email", "userName", "phoneNumber", "fullName", "password", "slug", "sportIds", "locationId", "languages",
  "headline.en", "headline.ar",
]);

/**
 * The client files ASP.NET's keys camelCased (`user.email`,
 * `educations[0].startDate`); the contract promises the form's names
 * (`email`, `educations.0.startDate`). Bare last segments the client also
 * files are dropped — they would collide between the four lists.
 */
function toFormFieldErrors(apiErrors: Readonly<Record<string, string>>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const [key, message] of Object.entries(apiErrors)) {
    const row = /^(educations|certificates|experiences|skills)\[(\d+)\]\.(\w+)$/.exec(key);
    if (row) {
      fieldErrors[`${row[1]}.${row[2]}.${RENAMED[row[3]] ?? row[3]}`] ??= message;
      continue;
    }
    const user = /^user\.(\w+)$/.exec(key);
    if (user) {
      fieldErrors[RENAMED[user[1]] ?? user[1]] ??= message;
      continue;
    }
    const profile = /^profile\.([\w.]+)$/.exec(key);
    if (profile) {
      fieldErrors[`profile.${profile[1]}`] ??= message;
      continue;
    }
    /* The coach rules (email taken, slug taken, no sport…) answer with bare names, no `user.`/`profile.` prefix. */
    if (BARE_ACCOUNT_KEYS.has(key)) fieldErrors[RENAMED[key] ?? key] ??= message;
  }
  return fieldErrors;
}

/**
 * `POST /v1/auth/register-coach` (multipart, no sign-in) and the reference
 * tables its pickers need: `Country`, `City/by-country/{id}`, `JobStatus`,
 * `AcademicDegree`, `UniversityMajor`, `JobType` and `Course` (the skills).
 */
export const httpCoachRegistrationService: CoachRegistrationService = {
  async listOptions(locale) {
    /* One table that cannot be read leaves its picker empty instead of failing the page. */
    const load = (table: string) =>
      lookup(table, locale).catch((error: unknown) => {
        if (error instanceof AppError) return [];
        throw error;
      });
    const [countries, jobStatuses, academicDegrees, universityMajors, jobTypes, skills] = await Promise.all([
      load("Country"),
      load("JobStatus"),
      load("AcademicDegree"),
      load("UniversityMajor"),
      load("JobType"),
      load("Course"),
    ]);
    const sports = await httpClient
      .get<LookupDto[]>("/v1/sports", { query: { language: locale }, revalidate: 60 })
      .then(toOptions)
      .catch((error: unknown) => {
        if (error instanceof AppError) return [];
        throw error;
      });
    const locations = await httpClient
      .get<{ id: number; name: { en: string; ar: string } }[]>("/v1/coach-locations", { revalidate: 60 })
      .then((rows) => rows.map((row) => ({ id: String(row.id), name: locale === "ar" ? row.name.ar : row.name.en })))
      .catch((error: unknown) => {
        if (error instanceof AppError) return [];
        throw error;
      });
    return { countries, jobStatuses, academicDegrees, universityMajors, jobTypes, skills, sports, locations };
  },

  listCities: (countryId, locale) =>
    httpClient
      .get<LookupDto[]>(`/v1/City/by-country/${encodeURIComponent(countryId)}`, {
        query: { language: locale },
        revalidate: 3600,
      })
      .then(toOptions)
      .catch((error: unknown) => {
        if (error instanceof AppError) return [];
        throw error;
      }),

  async register(input) {
    try {
      /* Answers the new `UserDto`; nothing in it is needed — the coach signs in next. */
      await httpClient.post<unknown>("/v1/auth/register-coach", toForm(input), { cache: "no-store" });
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      throw new AppError(error.code, error.message, {
        status: error.status,
        details: { fieldErrors: toFormFieldErrors(fieldErrorsOf(error)) },
      });
    }
  },
};
