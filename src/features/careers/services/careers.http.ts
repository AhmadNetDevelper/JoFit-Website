import { cacheTags, fetchSitemapEntries, httpClient, orNull } from "@/services";
import { listParams } from "@/services/http/query";
import type { CurrencyCode, MediaImage, Money, PageMeta, Paginated, SitemapEntry } from "@/types";

import type {
  CandidateApplication,
  CandidateApplicationJobRef,
  CareersStats,
  CvFile,
  EmployerKind,
  EmployerProfile,
  EmployerSize,
  EmployerSummary,
  EmploymentType,
  ExperienceLevel,
  JobCategory,
  JobCity,
  JobLanguage,
  JobListResult,
  JobPosting,
  JobSummary,
  SalaryPeriod,
  SalaryRange,
  StatusStep,
  WorkMode,
} from "../types";
import type { CareersService } from "./careers.contract";

const enc = encodeURIComponent;
const me = { auth: true } as const;

/* ------------------------------------------------------------ live shapes */

/** `MoneyDto2` — `currency` is optional on the wire. */
interface LiveMoney {
  readonly amount: number;
  readonly currency?: string;
}

/** `MediaImageDto2`. */
interface LiveMediaImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

/** `CityDto` — the one careers id that is a string live (the city key), not an int64. */
interface LiveCity {
  readonly id: string;
  readonly name: string;
}

/** `JobCategoryRefDto` / `JobSportRefDto`. */
interface LiveRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

/** `SalaryDto`. */
interface LiveSalary {
  readonly min: LiveMoney | null;
  readonly max: LiveMoney | null;
  readonly period: string;
}

/** `EmployerRefDto` — no `city`, no `openJobCount`. */
interface LiveEmployerRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly kind: string;
  readonly logo: LiveMediaImage | null;
}

/** `JobPostingDto` — the board's list items are full postings too. */
interface LiveJobPosting {
  readonly id: number;
  readonly reference: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly string[];
  readonly positions: number;
  readonly employmentType: string;
  readonly workMode: string;
  readonly experienceLevel: string;
  readonly salary: LiveSalary | null;
  readonly category: LiveRef | null;
  readonly city: LiveCity | null;
  readonly sports: readonly LiveRef[];
  readonly employer: LiveEmployerRef;
  readonly closesOn: string | null;
  readonly postedAt: string | null;
  readonly featured: boolean;
  readonly acceptingApplications: boolean;
}

/**
 * `FacetItem`. The spec only types `facets.categories` this way; the other
 * four facet arrays are untyped (`items: {}`) and are read as the same shape.
 */
interface LiveFacetItem {
  readonly value: string;
  readonly label: string | null;
  readonly count: number;
}

/** `JobListResultDto` — unlike the other paged results, a required nested `meta` and no flat page fields. */
interface LiveJobListResult {
  readonly items: readonly LiveJobPosting[];
  readonly meta: PageMeta;
  readonly facets: {
    readonly categories: readonly LiveFacetItem[];
    readonly cities: readonly LiveFacetItem[];
    readonly employmentTypes: readonly LiveFacetItem[];
    readonly workModes: readonly LiveFacetItem[];
    readonly experienceLevels: readonly LiveFacetItem[];
  };
}

/** `PublicJobCategoryDto`. */
interface LiveJobCategory {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly openJobCount: number;
}

/** `EmployerSummaryDto`. */
interface LiveEmployerSummary {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly kind: string;
  readonly city: LiveCity | null;
  readonly logo: LiveMediaImage | null;
  readonly openJobCount: number;
}

/**
 * `EmployerProfileDto` — no `email`/`phone`. Its `openJobs` is not read: the
 * employer page lists them through `listJobs({ employerSlug })`.
 */
interface LiveEmployerProfile extends LiveEmployerSummary {
  readonly about: string | null;
  readonly website: string | null;
  readonly size: string | null;
}

/** `CareersStatsDto` — `employers`, not `employersHiring`, plus a `cities` count the page doesn't show. */
interface LiveCareersStats {
  readonly openJobs: number;
  readonly employers: number;
  readonly categories: number;
  readonly cities: number;
}

/** `PagedResultOfEmployerSummaryDto` — flat, with an OPTIONAL nested `meta` (when present, already `PageMeta`-shaped). */
interface LiveEmployersPage {
  readonly items: readonly LiveEmployerSummary[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  readonly meta?: PageMeta;
}

/** `CvFileDto`. */
interface LiveCvFile {
  readonly id: number;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: number;
}

/** `ApplicationJobRef` — flat; no nested `employer`, no `city`, no `employmentType`. */
interface LiveApplicationJobRef {
  readonly id: number;
  readonly reference: string;
  readonly title: string;
  readonly slug: string;
  readonly employerName: string;
}

/** `HistoryDto`. */
interface LiveHistoryStep {
  readonly status: string;
  readonly at: string;
  readonly by: string;
}

/** `CandidateApplicationDto` — no `updatedAt` field at all. */
interface LiveCandidateApplication {
  readonly id: number;
  readonly reference: string;
  readonly job: LiveApplicationJobRef;
  readonly status: string;
  readonly statusNote?: string | null;
  readonly withdrawReason?: string | null;
  readonly history: readonly LiveHistoryStep[];
  readonly canWithdraw: boolean;
  readonly cv: LiveCvFile | null;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string | null;
  readonly availableFrom?: string | null;
  readonly expectedSalary?: LiveMoney | null;
  readonly submittedAt: string;
}

/* -------------------------------------------------------------- mappers */

function toMoney(dto: LiveMoney): Money {
  return { amount: dto.amount, currency: (dto.currency ?? "JOD") as CurrencyCode };
}

function toMediaImage(dto: LiveMediaImage | null): MediaImage | undefined {
  if (!dto) return undefined;
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

function toCity(dto: LiveCity | null): EmployerSummary["city"] {
  return dto ? { id: dto.id as JobCity, name: dto.name } : undefined;
}

function toRef(dto: LiveRef): { id: string; slug: string; name: string } {
  return { id: String(dto.id), slug: dto.slug, name: dto.name };
}

function toSalary(dto: LiveSalary | null): SalaryRange | undefined {
  if (!dto) return undefined;
  return {
    min: dto.min ? toMoney(dto.min) : undefined,
    max: dto.max ? toMoney(dto.max) : undefined,
    period: dto.period as SalaryPeriod,
  };
}

function toJobSummary(dto: LiveJobPosting): JobSummary {
  return {
    id: String(dto.id),
    slug: dto.slug,
    reference: dto.reference,
    title: dto.title,
    employer: {
      id: String(dto.employer.id),
      slug: dto.employer.slug,
      name: dto.employer.name,
      kind: dto.employer.kind as EmployerKind,
      logo: toMediaImage(dto.employer.logo),
    },
    category: dto.category ? toRef(dto.category) : undefined,
    city: toCity(dto.city),
    employmentType: dto.employmentType as EmploymentType,
    workMode: dto.workMode as WorkMode,
    experienceLevel: dto.experienceLevel as ExperienceLevel,
    salary: toSalary(dto.salary),
    postedAt: dto.postedAt ?? undefined,
    closesOn: dto.closesOn ?? undefined,
    featured: dto.featured,
  };
}

function toJobPosting(dto: LiveJobPosting): JobPosting {
  return {
    // The employer stays the summary's: `EmployerRefDto` has no city or open-job count.
    ...toJobSummary(dto),
    description: dto.description,
    requirements: dto.requirements,
    benefits: dto.benefits,
    sports: dto.sports.map(toRef),
    languages: dto.languages as readonly JobLanguage[],
    positions: dto.positions,
    acceptingApplications: dto.acceptingApplications,
  };
}

function toJobListResult(dto: LiveJobListResult): JobListResult {
  const { facets } = dto;
  return {
    items: dto.items.map(toJobSummary),
    meta: dto.meta,
    facets: {
      // A null label falls back to the facet's own value (a slug or city key).
      categories: facets.categories.map((facet) => ({ value: facet.value, label: facet.label ?? facet.value, count: facet.count })),
      cities: facets.cities.map((facet) => ({ value: facet.value as JobCity, label: facet.label ?? facet.value, count: facet.count })),
      employmentTypes: facets.employmentTypes.map((facet) => ({ value: facet.value as EmploymentType, count: facet.count })),
      workModes: facets.workModes.map((facet) => ({ value: facet.value as WorkMode, count: facet.count })),
      experienceLevels: facets.experienceLevels.map((facet) => ({ value: facet.value as ExperienceLevel, count: facet.count })),
    },
  };
}

function toEmployerSummary(dto: LiveEmployerSummary): EmployerSummary {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    kind: dto.kind as EmployerKind,
    city: toCity(dto.city),
    logo: toMediaImage(dto.logo),
    openJobCount: dto.openJobCount,
  };
}

function toEmployerProfile(dto: LiveEmployerProfile): EmployerProfile {
  return {
    ...toEmployerSummary(dto),
    about: dto.about ?? "",
    website: dto.website ?? undefined,
    size: (dto.size ?? undefined) as EmployerSize | undefined,
    // email/phone: no live source on `EmployerProfileDto` (see `EmployerProfile.email`).
  };
}

function toEmployersPage(dto: LiveEmployersPage): Paginated<EmployerSummary> {
  return {
    items: dto.items.map(toEmployerSummary),
    // The wrapper is flat live; `meta` is only sometimes included, even
    // though (per the live schema) it already matches `PageMeta` exactly when
    // it is — built from the flat fields whenever it's missing.
    meta:
      dto.meta ??
      {
        page: dto.page,
        pageSize: dto.pageSize,
        totalItems: dto.totalCount,
        totalPages: dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(dto.pageSize, 1))),
        hasNextPage: dto.hasNextPage ?? dto.page * dto.pageSize < dto.totalCount,
        hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
      },
  };
}

function toCvFile(dto: LiveCvFile): CvFile {
  return {
    id: String(dto.id),
    fileName: dto.fileName,
    mimeType: dto.mimeType as CvFile["mimeType"],
    bytes: dto.bytes,
  };
}

function toJobRef(dto: LiveApplicationJobRef): CandidateApplicationJobRef {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    // Live gives only the employer's name, no id/slug/logo/kind to fill the
    // rest of `JobSummary["employer"]` with.
    employer: { name: dto.employerName },
    // city/employmentType: no live source on `ApplicationJobRef` at all.
  };
}

function toCandidateApplication(dto: LiveCandidateApplication): CandidateApplication {
  return {
    id: String(dto.id),
    reference: dto.reference,
    job: toJobRef(dto.job),
    status: dto.status as CandidateApplication["status"],
    statusNote: dto.statusNote ?? undefined,
    withdrawReason: dto.withdrawReason ?? undefined,
    cv: dto.cv ? toCvFile(dto.cv) : undefined,
    coverLetter: dto.coverLetter,
    yearsExperience: dto.yearsExperience,
    certifications: dto.certifications ?? undefined,
    availableFrom: dto.availableFrom ?? undefined,
    expectedSalary: dto.expectedSalary ? toMoney(dto.expectedSalary) : undefined,
    submittedAt: dto.submittedAt,
    // No live `updatedAt` — defaulted to `submittedAt` (see `CandidateApplication` in ../types).
    updatedAt: dto.submittedAt,
    history: dto.history.map(
      (step): StatusStep => ({
        status: step.status as StatusStep["status"],
        at: step.at,
        by: step.by as StatusStep["by"],
      }),
    ),
    canWithdraw: dto.canWithdraw,
  };
}

/**
 * The board over `/v1/careers/*` (public, cached a minute and expired with the
 * `jobs` tag), and the candidate over `/v1/me/cv` and `/v1/me/job-applications`
 * (the customer is the bearer's; `customerId` is ignored here).
 *
 * The wire parameter for response language is `language`, not `locale` — see
 * `listParams`. `listJobs`/`listEmployers` already go through `listParams` and
 * get this for free; the other Careers-tag reads build their query by hand
 * and are fixed individually below. The MeCareers (candidate) endpoints take
 * no query parameters at all — confirmed against the live spec — so no
 * `language`/`locale` is sent on those; the API resolves it from the token.
 */
export const httpCareersService: CareersService = {
  listJobs: async (query) => {
    const dto = await httpClient.get<LiveJobListResult>("/v1/careers/jobs", {
      query: {
        ...listParams(query),
        categorySlugs: query.categorySlugs,
        cityIds: query.cityIds,
        employmentTypes: query.employmentTypes,
        workModes: query.workModes,
        experienceLevels: query.experienceLevels,
        sportSlugs: query.sportSlugs,
        employerSlug: query.employerSlug,
      },
      revalidate: 60,
      tags: [cacheTags.jobs],
    });
    return toJobListResult(dto);
  },

  getJobBySlug: (slug, locale) =>
    orNull(
      httpClient.get<LiveJobPosting>(`/v1/careers/jobs/${enc(slug)}`, {
        query: { language: locale },
        revalidate: 60,
        tags: [cacheTags.jobs],
      }),
    ).then((dto) => (dto ? toJobPosting(dto) : null)),

  listCategories: async (locale) => {
    const dtos = await httpClient.get<LiveJobCategory[]>("/v1/careers/categories", {
      query: { language: locale },
      revalidate: 300,
      tags: [cacheTags.jobs],
    });
    return dtos.map((dto): JobCategory => ({ id: String(dto.id), slug: dto.slug, name: dto.name, openJobCount: dto.openJobCount }));
  },

  /* `CityDto2` ids are already the string city keys — this one matches as is. */
  listCities: (locale) =>
    httpClient.get<{ id: JobCity; name: string }[]>("/v1/careers/cities", { query: { language: locale }, revalidate: 3600 }),

  listEmployers: async (query) => {
    const dto = await httpClient.get<LiveEmployersPage>("/v1/careers/employers", {
      query: listParams(query),
      revalidate: 60,
      tags: [cacheTags.jobs],
    });
    return toEmployersPage(dto);
  },

  getEmployerBySlug: (slug, locale) =>
    orNull(
      httpClient.get<LiveEmployerProfile>(`/v1/careers/employers/${enc(slug)}`, {
        query: { language: locale },
        revalidate: 60,
        tags: [cacheTags.jobs],
      }),
    ).then((dto) => (dto ? toEmployerProfile(dto) : null)),

  getStats: async () => {
    const dto = await httpClient.get<LiveCareersStats>("/v1/careers/stats", { revalidate: 60, tags: [cacheTags.jobs] });
    // The spec doesn't say whether live `employers` counts only those hiring
    // or every verified employer; it is the only employer figure there is.
    return { openJobs: dto.openJobs, employersHiring: dto.employers, categories: dto.categories } satisfies CareersStats;
  },

  /* The careers sitemap area answers job slugs; employer pages come from the
     public directory, which only ever lists verified employers. */
  listSitemapEntries: async () => {
    const [jobs, employers] = await Promise.all([
      fetchSitemapEntries("careers", (slug) => `/careers/jobs/${slug}`),
      httpCareersService.listEmployers({ locale: "ar", page: 1, pageSize: 100 }),
    ]);
    return [
      ...jobs,
      ...employers.items.map((employer): SitemapEntry => ({ path: `/careers/employers/${employer.slug}` })),
    ];
  },

  uploadCv: async (_customerId, file) => {
    const form = new FormData();
    form.append("file", file, file.name);
    // `Purpose` is required by the live multipart schema but its value isn't
    // documented anywhere; "candidate-cv" is a guess pending backend
    // confirmation, chosen to parallel employer-portal.http.ts's
    // "employer-logo" for its own upload.
    form.append("purpose", "candidate-cv");
    const dto = await httpClient.post<LiveCvFile>("/v1/me/cv", form, { ...me, timeoutMs: 120_000 });
    return toCvFile(dto);
  },

  apply: async (_customerId, input, _locale) =>
    toCandidateApplication(
      await httpClient.post<LiveCandidateApplication>(
        "/v1/me/job-applications",
        // `ApplicationRequest.jobId`/`cvId` are int64: sent as JSON numbers, not quoted strings.
        { ...input, jobId: Number(input.jobId), cvId: Number(input.cvId) },
        me,
      ),
    ),

  listMyApplications: async () =>
    (await httpClient.get<LiveCandidateApplication[]>("/v1/me/job-applications", me)).map(toCandidateApplication),

  findMyApplication: (_customerId, jobId) =>
    orNull(httpClient.get<LiveCandidateApplication>(`/v1/me/job-applications/by-job/${enc(jobId)}`, me)).then((dto) =>
      dto ? toCandidateApplication(dto) : null,
    ),

  withdrawApplication: async (_customerId, applicationId, reason, _locale) =>
    toCandidateApplication(
      await httpClient.post<LiveCandidateApplication>(`/v1/me/job-applications/${enc(applicationId)}/withdraw`, { reason }, me),
    ),

  downloadMyCv: (_customerId, applicationId) => httpClient.download(`/v1/me/job-applications/${enc(applicationId)}/cv`),
};
