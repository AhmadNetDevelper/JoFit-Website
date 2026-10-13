import {
  COACH_REGISTRATION_LIMITS as LIMITS,
  type CertificateEntry,
  type CoachRegistration,
  type EducationEntry,
  type ExperienceEntry,
  type GenderId,
  type SkillEntry,
} from "@/features/coach-registration";

/**
 * READING THE COACH REGISTRATION FORM — shared by the browser and the server.
 *
 * The form posts with `noValidate`: the browser's own "Please fill out this
 * field" bubbles speak the BROWSER's language, so an Arabic page would answer
 * in English. Instead the form runs this before sending (no round trip, so no
 * re-upload of a chosen file just to learn a box is empty), and the Server
 * Action runs it again, because a request can come from anywhere.
 *
 * Field names: the account fields by their own name (`email`), and a row's as
 * `<group>.<rowKey>.<field>` (`education.r3.startDate`). The row key is the
 * browser's, so a row removed from the middle leaves no hole: rows are read in
 * document order and numbered as they are sent.
 */
export const ERROR_KEYS = [
  "fix",
  "firstName",
  "lastName",
  "userName",
  "email",
  "phone",
  "password",
  "gender",
  "country",
  "city",
  "birthDate",
  "tooLong",
  "school",
  "degree",
  "major",
  "start",
  "endBeforeStart",
  "certName",
  "certOrg",
  "issued",
  "expiryBeforeIssued",
  "credentialId",
  "url",
  "certFileType",
  "photoType",
  "fileSize",
  "filesTotal",
  "expTitle",
  "jobType",
  "company",
  "location",
  "skill",
  "skillDuplicate",
  "level",
  "consent",
] as const;

export type ErrorKey = (typeof ERROR_KEYS)[number];
export type ErrorMessages = Readonly<Record<ErrorKey, string>>;

export const ROW_GROUPS = ["education", "certificate", "experience", "skill"] as const;
export type RowGroup = (typeof ROW_GROUPS)[number];

/** The browser's row keys per group, in the order the rows were sent. */
export type RowKeys = Readonly<Record<RowGroup, readonly string[]>>;

export interface ParsedCoachForm {
  /** Set when there are no field errors. */
  readonly registration?: CoachRegistration;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly rowKeys: RowKeys;
  /** The hidden honeypot was filled: a bot. */
  readonly isBot: boolean;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** ASP.NET Identity's default username alphabet, minus `@` and `+`. */
const USER_NAME = /^[A-Za-z0-9._-]+$/;

function fileOf(value: FormDataEntryValue | null): File | undefined {
  /* An empty file input still posts a nameless, zero-byte File. */
  return typeof value === "object" && value !== null && value.size > 0 ? value : undefined;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** `ahmad.k` → `ahmad-k`: the coach page's address, from the username. */
export function slugFromUserName(userName: string): string {
  return userName.toLowerCase().replace(/[._]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function parseCoachForm(formData: FormData, m: ErrorMessages): ParsedCoachForm {
  const errors: Record<string, string> = {};
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const fail = (key: string, message: string) => {
    errors[key] ??= message;
  };
  const tooLong = (key: string, value: string, max: number) => {
    if (value.length > max) fail(key, m.tooLong.replace("{max}", String(max)));
  };

  /* ── rows, by the browser's keys, in document order ── */
  const rows: Record<RowGroup, Map<string, Record<string, FormDataEntryValue>>> = {
    education: new Map(),
    certificate: new Map(),
    experience: new Map(),
    skill: new Map(),
  };
  for (const [name, value] of formData.entries()) {
    const match = /^(education|certificate|experience|skill)\.([\w-]+)\.(\w+)$/.exec(name);
    if (!match) continue;
    const group = rows[match[1] as RowGroup];
    const row = group.get(match[2]) ?? {};
    row[match[3]] = value;
    group.set(match[2], row);
  }
  const rowKeys: RowKeys = {
    education: [...rows.education.keys()].slice(0, LIMITS.maxRows),
    certificate: [...rows.certificate.keys()].slice(0, LIMITS.maxRows),
    experience: [...rows.experience.keys()].slice(0, LIMITS.maxRows),
    skill: [...rows.skill.keys()].slice(0, LIMITS.maxSkills),
  };
  const field = (row: Record<string, FormDataEntryValue>, key: string) =>
    typeof row[key] === "string" ? (row[key] as string).trim() : "";

  /* ── personal information ── */
  const firstName = text("firstName").replace(/\s+/g, " ");
  const lastName = text("lastName").replace(/\s+/g, " ");
  if (!firstName) fail("firstName", m.firstName);
  if (!lastName) fail("lastName", m.lastName);
  const fullName = `${firstName} ${lastName}`;
  tooLong("lastName", fullName, LIMITS.nameMax);

  const userName = text("userName");
  if (userName.length < LIMITS.userNameMin || userName.length > 64 || !USER_NAME.test(userName)) {
    fail("userName", m.userName);
  }

  const email = text("email").toLowerCase();
  if (!EMAIL.test(email) || email.length > 256) fail("email", m.email);

  const dialCode = text("dialCode");
  /* A local number is often typed with its trunk zero (079…); the dialling code replaces it. */
  const digits = text("phone").replace(/[\s()-]/g, "").replace(/^0/, "");
  if (!/^\+\d{1,4}$/.test(dialCode) || !/^\d{6,14}$/.test(digits)) fail("phone", m.phone);

  const password = String(formData.get("password") ?? "");
  if (password.length < LIMITS.passwordMin || password.length > 256) fail("password", m.password);

  const birthDate = text("birthDate");
  if (birthDate && (!DATE.test(birthDate) || birthDate >= today() || birthDate < "1900-01-01")) {
    fail("birthDate", m.birthDate);
  }

  const gender = text("genderId");
  if (gender !== "1" && gender !== "2") fail("genderId", m.gender);
  const countryId = text("countryId");
  if (!/^\d+$/.test(countryId)) fail("countryId", m.country);
  const cityId = text("cityId");
  if (!/^\d+$/.test(cityId)) fail("cityId", m.city);
  const jobStatusId = text("jobStatusId");

  /* ── the coach page ── */
  const profileText: Record<string, string> = {};
  for (const key of ["profileNameAr", "profileNameEn", "headlineAr", "headlineEn", "bioAr", "bioEn"]) {
    profileText[key] = text(key);
    tooLong(key, profileText[key], key.startsWith("profileName") ? LIMITS.nameMax : LIMITS.profileTextMax);
  }

  /* ── files ── */
  let filesTotal = 0;
  const checkFile = (key: string, file: File | undefined, allowPdf: boolean) => {
    if (!file) return;
    filesTotal += file.size;
    const typeOk = file.type.startsWith("image/") || (allowPdf && file.type === "application/pdf");
    if (!typeOk) fail(key, allowPdf ? m.certFileType : m.photoType);
    else if (file.size > LIMITS.fileMaxBytes) fail(key, m.fileSize);
  };
  const profileImage = fileOf(formData.get("profileImage"));
  checkFile("profileImage", profileImage, false);

  /* ── education ── */
  const educations: EducationEntry[] = rowKeys.education.map((key) => {
    const row = rows.education.get(key)!;
    const name = (part: string) => `education.${key}.${part}`;
    const entry = {
      schoolName: field(row, "schoolName"),
      academicDegreeId: field(row, "academicDegreeId"),
      universityMajorId: field(row, "universityMajorId"),
      startDate: field(row, "startDate"),
      endDate: field(row, "endDate") || undefined,
      current: row.current === "on",
    };
    if (!entry.schoolName) fail(name("schoolName"), m.school);
    tooLong(name("schoolName"), entry.schoolName, LIMITS.schoolNameMax);
    if (!entry.academicDegreeId) fail(name("academicDegreeId"), m.degree);
    if (!entry.universityMajorId) fail(name("universityMajorId"), m.major);
    if (!DATE.test(entry.startDate)) fail(name("startDate"), m.start);
    if (entry.current) entry.endDate = undefined;
    else if (entry.endDate && (!DATE.test(entry.endDate) || entry.endDate < entry.startDate)) {
      fail(name("endDate"), m.endBeforeStart);
    }
    return entry;
  });

  /* ── certificates ── */
  const certificates: CertificateEntry[] = rowKeys.certificate.map((key) => {
    const row = rows.certificate.get(key)!;
    const name = (part: string) => `certificate.${key}.${part}`;
    const entry = {
      name: field(row, "name"),
      organization: field(row, "organization"),
      issuedDate: field(row, "issuedDate"),
      expiryDate: field(row, "expiryDate") || undefined,
      credentialId: field(row, "credentialId"),
      credentialUrl: field(row, "credentialUrl") || undefined,
      file: fileOf(row.file ?? null),
    };
    if (!entry.name) fail(name("name"), m.certName);
    tooLong(name("name"), entry.name, LIMITS.certificateTextMax);
    if (!entry.organization) fail(name("organization"), m.certOrg);
    tooLong(name("organization"), entry.organization, LIMITS.certificateTextMax);
    if (!DATE.test(entry.issuedDate)) fail(name("issuedDate"), m.issued);
    if (entry.expiryDate && (!DATE.test(entry.expiryDate) || entry.expiryDate < entry.issuedDate)) {
      fail(name("expiryDate"), m.expiryBeforeIssued);
    }
    if (!entry.credentialId) fail(name("credentialId"), m.credentialId);
    tooLong(name("credentialId"), entry.credentialId, LIMITS.certificateTextMax);
    if (entry.credentialUrl && (!isHttpUrl(entry.credentialUrl) || entry.credentialUrl.length > LIMITS.credentialUrlMax)) {
      fail(name("credentialUrl"), m.url);
    }
    checkFile(name("file"), entry.file, true);
    return entry;
  });

  /* ── experience ── */
  const experiences: ExperienceEntry[] = rowKeys.experience.map((key) => {
    const row = rows.experience.get(key)!;
    const name = (part: string) => `experience.${key}.${part}`;
    const entry = {
      title: field(row, "title"),
      jobTypeId: field(row, "jobTypeId"),
      companyName: field(row, "companyName"),
      location: field(row, "location"),
      startDate: field(row, "startDate"),
      endDate: field(row, "endDate") || undefined,
      current: row.current === "on",
    };
    if (!entry.title) fail(name("title"), m.expTitle);
    tooLong(name("title"), entry.title, LIMITS.experienceTitleMax);
    if (!entry.jobTypeId) fail(name("jobTypeId"), m.jobType);
    if (!entry.companyName) fail(name("companyName"), m.company);
    tooLong(name("companyName"), entry.companyName, LIMITS.companyMax);
    if (!entry.location) fail(name("location"), m.location);
    tooLong(name("location"), entry.location, LIMITS.companyMax);
    if (!DATE.test(entry.startDate)) fail(name("startDate"), m.start);
    if (entry.current) entry.endDate = undefined;
    else if (entry.endDate && (!DATE.test(entry.endDate) || entry.endDate < entry.startDate)) {
      fail(name("endDate"), m.endBeforeStart);
    }
    return entry;
  });

  /* ── skills ── */
  const seenSkills = new Set<string>();
  const skills: SkillEntry[] = rowKeys.skill.map((key) => {
    const row = rows.skill.get(key)!;
    const name = (part: string) => `skill.${key}.${part}`;
    const skillId = field(row, "skillId");
    const levelText = field(row, "level");
    const level = Number(levelText);
    if (!skillId) fail(name("skillId"), m.skill);
    else if (seenSkills.has(skillId)) fail(name("skillId"), m.skillDuplicate);
    seenSkills.add(skillId);
    if (levelText === "" || !Number.isInteger(level) || level < 0 || level > 100) fail(name("level"), m.level);
    return { skillId, level };
  });

  if (filesTotal > LIMITS.filesTotalMaxBytes) fail("profileImage", m.filesTotal);
  if (formData.get("consent") !== "on") fail("consent", m.consent);

  const isBot = text("website") !== "";
  if (Object.keys(errors).length > 0) return { fieldErrors: errors, rowKeys, isBot };

  /* A text given in one language only stands in for the other. */
  const both = (en: string, ar: string) => (en || ar ? { en: en || ar, ar: ar || en } : undefined);

  return {
    fieldErrors: {},
    rowKeys,
    isBot,
    registration: {
      userName,
      email,
      password,
      fullName,
      phoneNumber: `${dialCode}${digits}`,
      birthDate: birthDate || undefined,
      genderId: Number(gender) as GenderId,
      countryId,
      cityId,
      jobStatusId: jobStatusId || undefined,
      profileImage,
      profile: {
        slug: slugFromUserName(userName),
        /* The coach page needs a name in both languages; the full name stands in for a missing one. */
        name: both(profileText.profileNameEn, profileText.profileNameAr) ?? { en: fullName, ar: fullName },
        headline: both(profileText.headlineEn, profileText.headlineAr),
        bio: both(profileText.bioEn, profileText.bioAr),
      },
      educations,
      certificates,
      experiences,
      skills,
    },
  };
}
