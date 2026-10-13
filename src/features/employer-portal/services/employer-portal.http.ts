import type {
  ApplicationStatus,
  CvFile,
  EmployerAccountProfile,
  EmployerApplication,
  EmployerDashboard,
  EmployerJob,
  EmploymentType,
  ExperienceLevel,
  JobCity,
  JobDraft,
  JobLanguage,
  JobStatus,
  SalaryPeriod,
  StatusStep,
  WorkMode,
} from "@/features/careers";
import { httpClient, orNull, toPaginated, type LivePagedResult } from "@/services";
import { listParams } from "@/services/http/query";
import type { CurrencyCode, MediaImage, Money } from "@/types";

import type { EmployerPortalService } from "./employer-portal.contract";

const enc = encodeURIComponent;
const as = { auth: true } as const;

/** `MoneyDto2` — `currency` is optional on the wire. */
interface LiveMoney {
  readonly amount: number;
  readonly currency?: string;
}

/** `MediaImageDto`/`MediaImageDto2` — `kind` is a stray nullable string, not the domain's `"image"` tag. */
interface LiveMediaImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

function toMoney(dto: LiveMoney): Money {
  return { amount: dto.amount, currency: (dto.currency ?? "JOD") as CurrencyCode };
}

function toMediaImage(dto: LiveMediaImage): MediaImage {
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

/** `EmployerJobDto` — int64 ids, nullable optionals, an extra `isPublic`, and no hired count. */
interface LiveEmployerJob {
  readonly id: number;
  readonly reference: string;
  readonly slug: string;
  readonly title: string;
  readonly categoryId: number;
  readonly sportIds: readonly number[];
  readonly cityId: string;
  readonly employmentType: string;
  readonly workMode: string;
  readonly experienceLevel: string;
  readonly salary: { readonly min: LiveMoney | null; readonly max: LiveMoney | null; readonly period: string } | null;
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly string[];
  readonly positions: number;
  readonly closesOn: string | null;
  readonly status: string;
  readonly moderationNote: string | null;
  readonly featured: boolean;
  readonly applicationCount: number;
  readonly newApplicationCount: number;
  readonly postedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function toEmployerJob(dto: LiveEmployerJob): EmployerJob {
  return {
    id: String(dto.id),
    slug: dto.slug,
    reference: dto.reference,
    title: dto.title,
    categoryId: String(dto.categoryId),
    sportIds: dto.sportIds.map(String),
    cityId: dto.cityId as JobCity,
    workMode: dto.workMode as WorkMode,
    employmentType: dto.employmentType as EmploymentType,
    experienceLevel: dto.experienceLevel as ExperienceLevel,
    salary: dto.salary
      ? {
          min: dto.salary.min ? toMoney(dto.salary.min) : undefined,
          max: dto.salary.max ? toMoney(dto.salary.max) : undefined,
          period: dto.salary.period as SalaryPeriod,
        }
      : undefined,
    showSalary: dto.showSalary,
    description: dto.description,
    requirements: dto.requirements,
    benefits: dto.benefits,
    languages: dto.languages as readonly JobLanguage[],
    positions: dto.positions,
    closesOn: dto.closesOn ?? undefined,
    status: dto.status as JobStatus,
    moderationNote: dto.moderationNote ?? undefined,
    featured: dto.featured,
    postedAt: dto.postedAt ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    applicationCount: dto.applicationCount,
    newApplicationCount: dto.newApplicationCount,
    // hiredCount: no live source (see `EmployerJob.hiredCount`).
  };
}

/** `CvFileDto` — nullable where an application carries it. */
interface LiveCvFile {
  readonly id: number;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: number;
}

/** `EmployerApplicationDto` — int64 ids, `null` for absent optionals, no `updatedAt`. */
interface LiveEmployerApplication {
  readonly id: number;
  readonly reference: string;
  readonly job: { readonly id: number; readonly reference: string; readonly title: string };
  readonly candidate: { readonly name: string; readonly email: string; readonly phone: string | null };
  readonly status: string;
  readonly nextStatuses: readonly string[];
  readonly isNew: boolean;
  readonly statusNote: string | null;
  readonly withdrawReason: string | null;
  readonly employerNote: string | null;
  readonly history: readonly { readonly status: string; readonly at: string; readonly by: string }[];
  readonly cv: LiveCvFile | null;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications: string | null;
  readonly availableFrom: string | null;
  readonly expectedSalary: LiveMoney | null;
  readonly submittedAt: string;
}

function toEmployerApplication(dto: LiveEmployerApplication): EmployerApplication {
  return {
    id: String(dto.id),
    reference: dto.reference,
    job: { id: String(dto.job.id), title: dto.job.title, reference: dto.job.reference },
    candidate: { name: dto.candidate.name, email: dto.candidate.email, phone: dto.candidate.phone ?? undefined },
    status: dto.status as ApplicationStatus,
    statusNote: dto.statusNote ?? undefined,
    withdrawReason: dto.withdrawReason ?? undefined,
    employerNote: dto.employerNote ?? undefined,
    cv: dto.cv
      ? {
          id: String(dto.cv.id),
          fileName: dto.cv.fileName,
          mimeType: dto.cv.mimeType as CvFile["mimeType"],
          bytes: dto.cv.bytes,
        }
      : undefined,
    coverLetter: dto.coverLetter,
    yearsExperience: dto.yearsExperience,
    certifications: dto.certifications ?? undefined,
    availableFrom: dto.availableFrom ?? undefined,
    expectedSalary: dto.expectedSalary ? toMoney(dto.expectedSalary) : undefined,
    submittedAt: dto.submittedAt,
    // updatedAt: no live source (see `EmployerApplication.updatedAt`).
    history: dto.history.map(
      (step): StatusStep => ({ status: step.status as ApplicationStatus, at: step.at, by: step.by as StatusStep["by"] }),
    ),
    nextStatuses: dto.nextStatuses as readonly ApplicationStatus[],
    isNew: dto.isNew,
  };
}

/** Live `VerificationDto`, nested on the profile. */
interface LiveVerification {
  readonly status: string;
  readonly note: string | null;
}

/**
 * Live `EmployerAccountProfileDto`. `id` is `int64` (coerced to `string` on
 * read); `verification` is nested as `{status, note}` where the contract wants
 * it flattened onto the profile; `loginEmail` has no contract slot (dropped).
 */
interface LiveEmployerProfile {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly kind: EmployerAccountProfile["kind"];
  readonly cityId: EmployerAccountProfile["cityId"];
  readonly about: string | null;
  readonly website: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly contactName: string;
  readonly size?: EmployerAccountProfile["size"] | null;
  readonly logo?: LiveMediaImage | null;
  readonly verification: LiveVerification;
  readonly loginEmail?: string;
  readonly createdAt: string;
}

function toEmployerAccountProfile(raw: LiveEmployerProfile): EmployerAccountProfile {
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    kind: raw.kind,
    cityId: raw.cityId,
    about: raw.about ?? "",
    website: raw.website ?? undefined,
    size: raw.size ?? undefined,
    email: raw.email ?? "",
    phone: raw.phone ?? undefined,
    contactName: raw.contactName,
    logo: raw.logo ? toMediaImage(raw.logo) : undefined,
    // Live nests verification as `{status, note}`; the contract wants it flat.
    verificationStatus: raw.verification.status as EmployerAccountProfile["verificationStatus"],
    verificationNote: raw.verification.note ?? undefined,
    createdAt: raw.createdAt,
    // `raw.loginEmail` (the account's own sign-in address) has no contract slot — dropped.
  };
}

/** Live `CountsDto` — adds `closedJobs`, which the contract doesn't track; dropped. */
interface LiveCounts {
  readonly openJobs: number;
  readonly pendingJobs: number;
  readonly draftJobs: number;
  readonly closedJobs: number;
  readonly newApplications: number;
  readonly totalApplications: number;
}

/** Live `EmployerDashboardDto`. */
interface LiveEmployerDashboard {
  readonly profile: LiveEmployerProfile;
  readonly counts: LiveCounts;
  readonly recentApplications: readonly LiveEmployerApplication[];
}

/**
 * Request body coercion for `JobDraftRequest`: live `categoryId`/`sportIds`
 * are `int64`/`int64[]` in the JSON body, where the contract's `JobDraft`
 * carries them as strings — a quoted id would fail strict `System.Text.Json`
 * deserialization against a real `long`. Only numeric-looking ids coerce
 * cleanly; mock ids like `"sport-1"` won't, which is expected since this path
 * only matters once the live backend is issuing numeric ids.
 */
function toJobDraftRequest(draft: JobDraft) {
  return {
    ...draft,
    categoryId: Number(draft.categoryId),
    sportIds: draft.sportIds.map(Number),
  };
}

/**
 * The employer portal over `/v1/employer/*`. The employer is the bearer's;
 * the `employerId` every method takes is ignored here (the mock needs it).
 */
export const httpEmployerPortalService: EmployerPortalService = {
  getDashboard: (_employerId, locale) =>
    httpClient
      .get<LiveEmployerDashboard>("/v1/employer/dashboard", { ...as, query: { locale } })
      .then(
        (raw): EmployerDashboard => ({
          // Live field is `profile`; the contract calls it `employer`.
          employer: toEmployerAccountProfile(raw.profile),
          counts: {
            openJobs: raw.counts.openJobs,
            pendingJobs: raw.counts.pendingJobs,
            draftJobs: raw.counts.draftJobs,
            newApplications: raw.counts.newApplications,
            totalApplications: raw.counts.totalApplications,
            // `raw.counts.closedJobs` has no contract slot — dropped.
          },
          recentApplications: raw.recentApplications.map(toEmployerApplication),
        }),
      ),

  getProfile: () =>
    httpClient.get<LiveEmployerProfile>("/v1/employer/profile", as).then(toEmployerAccountProfile),
  updateProfile: (_employerId, input) =>
    httpClient.put<LiveEmployerProfile>("/v1/employer/profile", input, as).then(toEmployerAccountProfile),
  uploadLogo: (_employerId, file) => {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("purpose", "employer-logo");
    return httpClient.post<LiveMediaImage>("/v1/employer/media", form, { ...as, timeoutMs: 120_000 }).then(toMediaImage);
  },

  listJobs: (_employerId, query) =>
    httpClient
      .get<LivePagedResult<LiveEmployerJob>>("/v1/employer/jobs", { ...as, query: { ...listParams(query), statuses: query.statuses } })
      // Live wraps items in a flat `PagedResultOfEmployerJobDto` (`totalCount`,
      // no nested `meta`), not the contract's `Paginated<T>` — reshaped here.
      .then((raw) => toPaginated(raw, toEmployerJob)),
  getJob: (_employerId, jobId) =>
    orNull(httpClient.get<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}`, as)).then((dto) => (dto ? toEmployerJob(dto) : null)),
  createJob: (_employerId, draft, submit) =>
    httpClient.post<LiveEmployerJob>("/v1/employer/jobs", { ...toJobDraftRequest(draft), submit }, as).then(toEmployerJob),
  updateJob: (_employerId, jobId, draft) =>
    httpClient.put<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}`, toJobDraftRequest(draft), as).then(toEmployerJob),
  submitJob: (_employerId, jobId) =>
    httpClient.post<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}/submit`, undefined, as).then(toEmployerJob),
  withdrawJob: (_employerId, jobId) =>
    httpClient.post<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}/withdraw`, undefined, as).then(toEmployerJob),
  closeJob: (_employerId, jobId) =>
    httpClient.post<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}/close`, undefined, as).then(toEmployerJob),
  reopenJob: (_employerId, jobId) =>
    httpClient.post<LiveEmployerJob>(`/v1/employer/jobs/${enc(jobId)}/reopen`, undefined, as).then(toEmployerJob),
  deleteJob: async (_employerId, jobId) => {
    await httpClient.delete<void>(`/v1/employer/jobs/${enc(jobId)}`, as);
  },

  listApplications: (_employerId, query) =>
    httpClient
      .get<LivePagedResult<LiveEmployerApplication>>("/v1/employer/applications", {
        ...as,
        query: { ...listParams(query), jobId: query.jobId, statuses: query.statuses },
      })
      // Same flat-envelope reshape as `listJobs`.
      .then((raw) => toPaginated(raw, toEmployerApplication)),
  getApplication: (_employerId, applicationId) =>
    orNull(httpClient.get<LiveEmployerApplication>(`/v1/employer/applications/${enc(applicationId)}`, as)).then((dto) =>
      dto ? toEmployerApplication(dto) : null,
    ),
  moveApplication: (_employerId, applicationId, status, note) =>
    httpClient
      .put<LiveEmployerApplication>(`/v1/employer/applications/${enc(applicationId)}/status`, { status, note }, as)
      .then(toEmployerApplication),
  saveApplicationNote: (_employerId, applicationId, note) =>
    httpClient
      .put<LiveEmployerApplication>(`/v1/employer/applications/${enc(applicationId)}/note`, { note }, as)
      .then(toEmployerApplication),
  downloadCv: (_employerId, applicationId) => httpClient.download(`/v1/employer/applications/${enc(applicationId)}/cv`),
};
