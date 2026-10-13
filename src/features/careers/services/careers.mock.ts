import { resolveText } from "@/i18n";
import { AppError, paginate } from "@/lib";
import { accountStore, nextReference, notify, touch } from "@/mocks/accounts";
import { cityNames } from "@/mocks/careers";
import {
  cvOf,
  downloadOf,
  employerOf,
  fieldError,
  isPublic,
  openJobsOf,
  toCandidateApplication,
  toCvFile,
  toEmployerProfile,
  toEmployerSummary,
  toJobPosting,
  toJobSummary,
} from "@/mocks/careers/resolve";
import { simulateLatency } from "@/mocks/runtime";

import { applicationErrors, sniffCvType, WITHDRAWABLE } from "../rules";
import {
  CV_MAX_BYTES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CITIES,
  WORK_MODES,
  type JobListQuery,
  type JobListResult,
  type JobSummary,
} from "../types";
import type { CareersService } from "./careers.contract";

/**
 * The careers board over the shared store (`mocks/accounts`), where the
 * employer portal writes jobs and the admin — through the dev bridge — verifies
 * employers and approves jobs. What is public is decided in one place,
 * `isPublic`, and every read goes through it.
 */

const monthly = (job: JobSummary) => {
  const top = job.salary?.max ?? job.salary?.min;
  if (!top) return -1;
  return job.salary?.period === "hour" ? top.amount * 160 : top.amount;
};

function matches(query: JobListQuery, skip?: "category" | "city" | "type" | "mode" | "level") {
  const term = query.search?.trim().toLowerCase();
  const store = accountStore();
  return (job: (typeof store.jobs)[number]) => {
    if (!isPublic(job)) return false;
    const employer = employerOf(job.employerId)!;
    if (query.employerSlug && employer.slug !== query.employerSlug) return false;
    if (skip !== "category" && query.categorySlugs?.length) {
      const category = store.jobCategories.find((entry) => entry.id === job.categoryId);
      if (!category || !query.categorySlugs.includes(category.slug)) return false;
    }
    if (skip !== "city" && query.cityIds?.length && !query.cityIds.includes(job.cityId)) return false;
    if (skip !== "type" && query.employmentTypes?.length && !query.employmentTypes.includes(job.employmentType)) return false;
    if (skip !== "mode" && query.workModes?.length && !query.workModes.includes(job.workMode)) return false;
    if (skip !== "level" && query.experienceLevels?.length && !query.experienceLevels.includes(job.experienceLevel)) return false;
    if (query.sportSlugs?.length) {
      const sportIds = new Set(job.sportIds);
      if (!query.sportSlugs.some((slug) => sportIds.has(`sport-${slug}`))) return false;
    }
    if (term) {
      const haystack = [job.title, job.description, employer.name, ...job.requirements].join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  };
}

const count = <T extends string>(values: readonly T[]) => {
  const out = new Map<T, number>();
  for (const value of values) out.set(value, (out.get(value) ?? 0) + 1);
  return out;
};

export const mockCareersService: CareersService = {
  async listJobs(query) {
    await simulateLatency();
    const store = accountStore();
    const locale = query.locale;
    const rows = store.jobs.filter(matches(query)).map((job) => toJobSummary(job, locale));
    const sorted =
      query.sort === "closing-soon"
        ? [...rows].sort((a, b) => (a.closesOn ?? "9999").localeCompare(b.closesOn ?? "9999") || (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))
        : query.sort === "salary-desc"
          ? [...rows].sort((a, b) => monthly(b) - monthly(a))
          : /* newest, with featured jobs first */
            [...rows].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));

    const byCategory = count(store.jobs.filter(matches(query, "category")).map((job) => job.categoryId));
    const byCity = count(store.jobs.filter(matches(query, "city")).map((job) => job.cityId));
    const byType = count(store.jobs.filter(matches(query, "type")).map((job) => job.employmentType));
    const byMode = count(store.jobs.filter(matches(query, "mode")).map((job) => job.workMode));
    const byLevel = count(store.jobs.filter(matches(query, "level")).map((job) => job.experienceLevel));

    const result: JobListResult = {
      ...paginate(sorted, query),
      facets: {
        categories: store.jobCategories.map((category) => ({
          value: category.slug,
          label: resolveText(category.name, locale),
          count: byCategory.get(category.id) ?? 0,
        })),
        cities: JOB_CITIES.map((id) => ({ value: id, label: resolveText(cityNames[id], locale), count: byCity.get(id) ?? 0 })),
        employmentTypes: EMPLOYMENT_TYPES.map((value) => ({ value, count: byType.get(value) ?? 0 })),
        workModes: WORK_MODES.map((value) => ({ value, count: byMode.get(value) ?? 0 })),
        experienceLevels: EXPERIENCE_LEVELS.map((value) => ({ value, count: byLevel.get(value) ?? 0 })),
      },
    };
    return result;
  },

  async getJobBySlug(slug, locale) {
    await simulateLatency();
    const job = accountStore().jobs.find((entry) => entry.slug === slug);
    /* A job that closed stays readable (a candidate may have the link), but
       only if it was once public — drafts, reviews and rejections never are. */
    if (!job || !employerOf(job.employerId) || employerOf(job.employerId)!.verificationStatus !== "verified") return null;
    if (job.status !== "open" && job.status !== "closed") return null;
    return toJobPosting(job, locale);
  },

  async listCategories(locale) {
    await simulateLatency();
    const store = accountStore();
    return store.jobCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: resolveText(category.name, locale),
      openJobCount: store.jobs.filter((job) => job.categoryId === category.id && isPublic(job)).length,
    }));
  },

  async listCities(locale) {
    return JOB_CITIES.map((id) => ({ id, name: resolveText(cityNames[id], locale) }));
  },

  async listEmployers(query) {
    await simulateLatency();
    const term = query.search?.trim().toLowerCase();
    const rows = accountStore()
      .employers.filter((employer) => employer.verificationStatus === "verified")
      .filter((employer) => !term || employer.name.toLowerCase().includes(term))
      .map((employer) => toEmployerSummary(employer, query.locale))
      .sort((a, b) => b.openJobCount - a.openJobCount || a.name.localeCompare(b.name, query.locale));
    return paginate(rows, query);
  },

  async getEmployerBySlug(slug, locale) {
    await simulateLatency();
    const employer = accountStore().employers.find((entry) => entry.slug === slug);
    return employer && employer.verificationStatus === "verified" ? toEmployerProfile(employer, locale) : null;
  },

  async getStats() {
    await simulateLatency();
    const store = accountStore();
    const open = store.jobs.filter(isPublic);
    return {
      openJobs: open.length,
      employersHiring: store.employers.filter((employer) => openJobsOf(employer.id).length > 0).length,
      categories: store.jobCategories.length,
    };
  },

  async listSitemapEntries() {
    const store = accountStore();
    return [
      ...store.jobs.filter(isPublic).map((job) => ({ path: `/careers/jobs/${job.slug}`, lastModified: job.updatedAt })),
      ...store.employers
        .filter((employer) => employer.verificationStatus === "verified")
        .map((employer) => ({ path: `/careers/employers/${employer.slug}`, lastModified: employer.updatedAt })),
    ];
  },

  async uploadCv(customerId, file) {
    await simulateLatency();
    if (!(file instanceof Blob) || file.size === 0) throw fieldError("Attach your CV.", { cv: "Attach your CV." });
    if (file.size > CV_MAX_BYTES) throw fieldError("The CV is larger than 5 MB.", { cv: "The CV is larger than 5 MB." });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = sniffCvType(bytes);
    if (!mimeType) throw fieldError("Upload the CV as a PDF or a Word file.", { cv: "Upload the CV as a PDF or a Word file." });
    const id = nextReference("cv-w");
    const stored = {
      id,
      customerId,
      fileName: (file.name || "CV").slice(0, 120),
      mimeType,
      bytes: bytes.byteLength,
      dataUrl: `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`,
      uploadedAt: new Date().toISOString(),
    };
    accountStore().cvFiles.set(id, stored);
    return toCvFile(stored);
  },

  async apply(customerId, input, locale) {
    await simulateLatency();
    const store = accountStore();
    const customer = store.customers.find((entry) => entry.id === customerId);
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    const errors = applicationErrors(input);
    if (Object.keys(errors).length > 0) throw fieldError("Some fields need attention.", errors);
    const job = store.jobs.find((entry) => entry.id === input.jobId);
    if (!job || !isPublic(job)) {
      throw new AppError("conflict", "This job is no longer taking applications.", { status: 409 });
    }
    const cv = store.cvFiles.get(input.cvId);
    if (!cv || cv.customerId !== customerId) throw fieldError("Attach your CV again.", { cv: "Attach your CV again." });
    /* One application per candidate and job. Only a withdrawn one frees the
       job again — a decision the employer made (hired, not taken forward)
       stands. */
    if (store.jobApplications.some((entry) => entry.jobId === job.id && entry.customerId === customerId && entry.status !== "withdrawn")) {
      throw new AppError("conflict", "You have already applied for this job.", { status: 409 });
    }

    const now = new Date().toISOString();
    const reference = nextReference("JA-3");
    const stored = {
      id: `ja-${reference.slice(3)}`,
      reference,
      jobId: job.id,
      employerId: job.employerId,
      customerId,
      candidate: { name: customer.name, email: customer.email, phone: customer.phone },
      cvId: cv.id,
      coverLetter: input.coverLetter.trim(),
      yearsExperience: input.yearsExperience,
      certifications: input.certifications?.trim() || undefined,
      availableFrom: input.availableFrom,
      expectedSalary: input.expectedSalary,
      status: "submitted" as const,
      submittedAt: now,
      updatedAt: now,
      history: [{ status: "submitted" as const, at: now, by: "candidate" as const }],
    };
    store.jobApplications.unshift(stored);
    notify({
      audience: "employer",
      recipientId: job.employerId,
      kind: "job-application",
      title: { en: `New application: ${job.title}`, ar: `طلب توظيف جديد: ${job.title}` },
      body: { en: `${customer.name} applied.`, ar: `تقدّم ${customer.name} للوظيفة.` },
      href: `/employer/applications/${stored.id}`,
    });
    touch();
    return toCandidateApplication(stored, locale);
  },

  async listMyApplications(customerId, locale) {
    await simulateLatency();
    return accountStore()
      .jobApplications.filter((entry) => entry.customerId === customerId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((entry) => toCandidateApplication(entry, locale));
  },

  async findMyApplication(customerId, jobId, locale) {
    await simulateLatency();
    const entry = accountStore().jobApplications.find(
      (row) => row.jobId === jobId && row.customerId === customerId && row.status !== "withdrawn",
    );
    return entry ? toCandidateApplication(entry, locale) : null;
  },

  async withdrawApplication(customerId, applicationId, reason, locale) {
    await simulateLatency();
    const store = accountStore();
    const index = store.jobApplications.findIndex((entry) => entry.id === applicationId && entry.customerId === customerId);
    const entry = store.jobApplications[index];
    if (!entry) throw new AppError("not-found", "That application was not found.", { status: 404 });
    if (!WITHDRAWABLE.includes(entry.status)) {
      throw new AppError("conflict", "This application can no longer be withdrawn.", { status: 409 });
    }
    const now = new Date().toISOString();
    const note = reason?.trim().slice(0, 500) || undefined;
    const next = {
      ...entry,
      status: "withdrawn" as const,
      withdrawReason: note,
      updatedAt: now,
      history: [...entry.history, { status: "withdrawn" as const, at: now, by: "candidate" as const }],
    };
    store.jobApplications[index] = next;
    const job = store.jobs.find((row) => row.id === entry.jobId);
    notify({
      audience: "employer",
      recipientId: entry.employerId,
      kind: "application-status",
      title: { en: `Application withdrawn: ${job?.title ?? ""}`, ar: `سُحب طلب توظيف: ${job?.title ?? ""}` },
      body: { en: `${entry.candidate.name} withdrew their application.`, ar: `سحب ${entry.candidate.name} طلبه.` },
      href: `/employer/applications/${entry.id}`,
    });
    touch();
    return toCandidateApplication(next, locale);
  },

  async downloadMyCv(customerId, applicationId) {
    const entry = accountStore().jobApplications.find((row) => row.id === applicationId && row.customerId === customerId);
    if (!entry) throw new AppError("not-found", "That application was not found.", { status: 404 });
    return downloadOf(cvOf(entry.cvId));
  },
};
