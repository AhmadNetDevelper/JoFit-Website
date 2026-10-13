import { acceptsApplications, EMPLOYER_APPLICATION_MOVES, WITHDRAWABLE } from "@/features/careers/rules";
import type {
  CandidateApplication,
  CvFile,
  EmployerAccountProfile,
  EmployerApplication,
  EmployerJob,
  EmployerProfile,
  EmployerSummary,
  JobPosting,
  JobSummary,
} from "@/features/careers/types";
import { resolveText, type Locale } from "@/i18n";
import { AppError } from "@/lib";
import { accountStore } from "@/mocks/accounts";
import { mockSports } from "@/mocks/sports";
import type { DownloadedFile } from "@/services";

import { cityNames, type RawCvFile, type RawEmployer, type RawJob, type RawJobApplication } from "./index";

/*
 * Stored careers records → what each audience sees. Shared by the public
 * board, the candidate's pages and the employer portal, so all three read a
 * job the same way. Mock only: the API does this in its own responses.
 */

export const city = (id: RawJob["cityId"], locale: Locale) => ({ id, name: resolveText(cityNames[id], locale) });

export function employerOf(id: string): RawEmployer | undefined {
  return accountStore().employers.find((entry) => entry.id === id);
}

export function openJobsOf(employerId: string): RawJob[] {
  const employer = employerOf(employerId);
  return accountStore().jobs.filter(
    (job) => job.employerId === employerId && acceptsApplications(job, employer?.verificationStatus === "verified"),
  );
}

/** Public: open, from a verified employer, not past its closing date. */
export function isPublic(job: RawJob): boolean {
  return acceptsApplications(job, employerOf(job.employerId)?.verificationStatus === "verified");
}

export function toEmployerSummary(employer: RawEmployer, locale: Locale): EmployerSummary {
  return {
    id: employer.id,
    slug: employer.slug,
    name: employer.name,
    kind: employer.kind,
    city: city(employer.cityId, locale),
    logo: employer.logo,
    openJobCount: openJobsOf(employer.id).length,
  };
}

export function toEmployerProfile(employer: RawEmployer, locale: Locale): EmployerProfile {
  return {
    ...toEmployerSummary(employer, locale),
    about: employer.about,
    website: employer.website,
    size: employer.size,
    email: employer.email,
    phone: employer.phone,
  };
}

export function toEmployerAccountProfile(employer: RawEmployer): EmployerAccountProfile {
  return {
    id: employer.id,
    slug: employer.slug,
    name: employer.name,
    kind: employer.kind,
    cityId: employer.cityId,
    about: employer.about,
    website: employer.website,
    size: employer.size,
    email: employer.email,
    phone: employer.phone,
    contactName: employer.contactName,
    logo: employer.logo,
    verificationStatus: employer.verificationStatus,
    verificationNote: employer.verificationNote,
    createdAt: employer.createdAt,
  };
}

function categoryOf(id: string, locale: Locale) {
  const category = accountStore().jobCategories.find((entry) => entry.id === id);
  return { id, slug: category?.slug ?? id, name: category ? resolveText(category.name, locale) : id };
}

export function toJobSummary(job: RawJob, locale: Locale): JobSummary {
  const employer = employerOf(job.employerId)!;
  return {
    id: job.id,
    slug: job.slug,
    reference: job.reference,
    title: job.title,
    employer: { id: employer.id, slug: employer.slug, name: employer.name, logo: employer.logo, kind: employer.kind },
    category: categoryOf(job.categoryId, locale),
    city: city(job.cityId, locale),
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    salary: job.showSalary ? job.salary : undefined,
    postedAt: job.postedAt ?? job.createdAt,
    closesOn: job.closesOn,
    featured: job.featured,
  };
}

export function toJobPosting(job: RawJob, locale: Locale): JobPosting {
  const employer = employerOf(job.employerId)!;
  return {
    ...toJobSummary(job, locale),
    employer: toEmployerSummary(employer, locale),
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    sports: job.sportIds.flatMap((id) => {
      const sport = mockSports.find((entry) => entry.id === id);
      return sport ? [{ id: sport.id, slug: sport.slug, name: resolveText(sport.name, locale) }] : [];
    }),
    languages: job.languages,
    positions: job.positions,
    acceptingApplications: isPublic(job),
  };
}

export function applicationsOf(jobId: string): RawJobApplication[] {
  return accountStore().jobApplications.filter((entry) => entry.jobId === jobId);
}

export function toEmployerJob(job: RawJob): EmployerJob {
  const applications = applicationsOf(job.id);
  return {
    id: job.id,
    slug: job.slug,
    reference: job.reference,
    title: job.title,
    categoryId: job.categoryId,
    sportIds: job.sportIds,
    cityId: job.cityId,
    workMode: job.workMode,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    salary: job.salary,
    showSalary: job.showSalary,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    languages: job.languages,
    positions: job.positions,
    closesOn: job.closesOn,
    status: job.status,
    moderationNote: job.moderationNote,
    featured: job.featured,
    postedAt: job.postedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    applicationCount: applications.length,
    newApplicationCount: applications.filter((entry) => entry.status === "submitted" && !entry.seenByEmployerAt).length,
    hiredCount: applications.filter((entry) => entry.status === "hired").length,
  };
}

export function cvOf(id: string): RawCvFile {
  const file = accountStore().cvFiles.get(id);
  if (!file) throw new AppError("not-found", "That CV is no longer on file.", { status: 404 });
  return file;
}

export function toCvFile(file: RawCvFile): CvFile {
  return { id: file.id, fileName: file.fileName, mimeType: file.mimeType, bytes: file.bytes };
}

export function toCandidateApplication(entry: RawJobApplication, locale: Locale): CandidateApplication {
  const job = accountStore().jobs.find((row) => row.id === entry.jobId)!;
  const summary = toJobSummary(job, locale);
  return {
    id: entry.id,
    reference: entry.reference,
    job: {
      id: summary.id,
      slug: summary.slug,
      title: summary.title,
      employer: summary.employer,
      city: summary.city,
      employmentType: summary.employmentType,
    },
    status: entry.status,
    statusNote: entry.statusNote,
    withdrawReason: entry.withdrawReason,
    cv: toCvFile(cvOf(entry.cvId)),
    coverLetter: entry.coverLetter,
    yearsExperience: entry.yearsExperience,
    certifications: entry.certifications,
    availableFrom: entry.availableFrom,
    expectedSalary: entry.expectedSalary,
    submittedAt: entry.submittedAt,
    updatedAt: entry.updatedAt,
    history: entry.history,
    canWithdraw: WITHDRAWABLE.includes(entry.status),
  };
}

export function toEmployerApplication(entry: RawJobApplication): EmployerApplication {
  const job = accountStore().jobs.find((row) => row.id === entry.jobId)!;
  return {
    id: entry.id,
    reference: entry.reference,
    job: { id: job.id, title: job.title, reference: job.reference },
    candidate: entry.candidate,
    status: entry.status,
    statusNote: entry.statusNote,
    withdrawReason: entry.withdrawReason,
    employerNote: entry.employerNote,
    cv: toCvFile(cvOf(entry.cvId)),
    coverLetter: entry.coverLetter,
    yearsExperience: entry.yearsExperience,
    certifications: entry.certifications,
    availableFrom: entry.availableFrom,
    expectedSalary: entry.expectedSalary,
    submittedAt: entry.submittedAt,
    updatedAt: entry.updatedAt,
    history: entry.history,
    nextStatuses: EMPLOYER_APPLICATION_MOVES[entry.status],
    isNew: entry.status === "submitted" && !entry.seenByEmployerAt,
  };
}

/** The bytes of a stored CV, as a download. */
export function downloadOf(file: RawCvFile): DownloadedFile {
  const base64 = file.dataUrl.slice(file.dataUrl.indexOf(",") + 1);
  const buffer = Buffer.from(base64, "base64");
  return {
    bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
    contentType: file.mimeType,
    fileName: file.fileName,
  };
}

export function fieldError(message: string, fieldErrors: Record<string, string>): AppError {
  return new AppError("validation", message, { status: 422, details: { fieldErrors } });
}
