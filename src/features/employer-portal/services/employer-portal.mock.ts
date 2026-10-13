import {
  ammanToday,
  EMPLOYER_APPLICATION_MOVES,
  EMPLOYER_KINDS,
  EMPLOYER_SIZES,
  JOB_CITIES,
  jobDraftErrors,
  sniffImageType,
  type ApplicationStatus,
  type JobDraft,
} from "@/features/careers";
import type { LocalizedText } from "@/i18n";
import { AppError, paginate } from "@/lib";
import { accountStore, nextReference, notify, touch } from "@/mocks/accounts";
import type { RawJob } from "@/mocks/careers";
import {
  applicationsOf,
  cvOf,
  downloadOf,
  fieldError,
  toEmployerAccountProfile,
  toEmployerApplication,
  toEmployerJob,
} from "@/mocks/careers/resolve";
import { simulateLatency } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { MediaImage } from "@/types";

import type { EmployerPortalService } from "./employer-portal.contract";

/**
 * The employer portal over the shared store. Everything is scoped to the
 * employer the session names: another employer's job or application is
 * `not-found`, never `forbidden`, so ids cannot be probed.
 */

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/* A body may come from any client; a missing text field is an empty one. */
const text = (value: unknown) => (typeof value === "string" ? value : "");

function requireEmployer(employerId: string) {
  const employer = accountStore().employers.find((entry) => entry.id === employerId);
  if (!employer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
  return employer;
}

function ownJobIndex(employerId: string, jobId: string): number {
  const index = accountStore().jobs.findIndex((entry) => entry.id === jobId && entry.employerId === employerId);
  if (index < 0) throw new AppError("not-found", "That job was not found.", { status: 404 });
  return index;
}

function ownApplicationIndex(employerId: string, applicationId: string): number {
  const index = accountStore().jobApplications.findIndex((entry) => entry.id === applicationId && entry.employerId === employerId);
  if (index < 0) throw new AppError("not-found", "That application was not found.", { status: 404 });
  return index;
}

const known = () => ({
  categoryIds: accountStore().jobCategories.map((entry) => entry.id),
  sportIds: mockSports.map((sport) => sport.id),
});

/** What is stored of a draft: trimmed, empty list lines dropped. */
function clean(draft: JobDraft): JobDraft {
  const lines = (items: readonly string[] | undefined) => (items ?? []).map((item) => item.trim()).filter(Boolean);
  return {
    ...draft,
    title: text(draft.title).trim().replace(/\s+/g, " "),
    description: text(draft.description).trim(),
    requirements: lines(draft.requirements),
    benefits: lines(draft.benefits),
    sportIds: [...new Set(draft.sportIds ?? [])],
    languages: [...new Set(draft.languages ?? [])],
    closesOn: draft.closesOn || undefined,
    salary: draft.salary && (draft.salary.min || draft.salary.max) ? draft.salary : undefined,
  };
}

function validate(draft: JobDraft): void {
  const errors = jobDraftErrors(draft, known());
  if (Object.keys(errors).length > 0) throw fieldError("Some fields need attention.", errors);
}

function slugFor(title: string, employerSlug: string): string {
  const latin = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  const base = `${latin || "job"}-${employerSlug}`.slice(0, 90).replace(/-+$/, "");
  const taken = new Set(accountStore().jobs.map((job) => job.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

function assertMaySubmit(employerId: string): void {
  const employer = requireEmployer(employerId);
  if (employer.verificationStatus === "suspended" || employer.verificationStatus === "rejected") {
    throw new AppError("forbidden", "Your company cannot publish jobs right now. Contact JoFit.", { status: 403 });
  }
}

function toldStaff(job: RawJob): void {
  const employer = requireEmployer(job.employerId);
  notify({
    audience: "staff",
    kind: "job-submitted",
    title: { en: `Job to review: ${job.title}`, ar: `وظيفة للمراجعة: ${job.title}` },
    body: { en: `${employer.name} submitted ${job.reference}.`, ar: `أرسلت ${employer.name} الوظيفة ${job.reference}.` },
    href: `/careers/jobs/${job.id}`,
  });
}

function replaceJob(index: number, next: RawJob): RawJob {
  accountStore().jobs[index] = next;
  touch();
  return next;
}

/** What the candidate reads in their bell for each move. */
const MOVE_COPY: Partial<Record<ApplicationStatus, { readonly title: LocalizedText; readonly body: LocalizedText }>> = {
  reviewing: {
    title: { en: "Your application is being reviewed", ar: "طلبك قيد المراجعة" },
    body: { en: "{employer} is reading your application for {job}.", ar: "تقرأ {employer} طلبك لوظيفة {job}." },
  },
  shortlisted: {
    title: { en: "You are on the shortlist", ar: "أنت ضمن القائمة المختصرة" },
    body: { en: "{employer} shortlisted you for {job}.", ar: "اختارتك {employer} ضمن القائمة المختصرة لوظيفة {job}." },
  },
  interview: {
    title: { en: "You are invited to an interview", ar: "أنت مدعو لمقابلة" },
    body: { en: "{employer} wants to meet you about {job}.", ar: "تريد {employer} مقابلتك بخصوص وظيفة {job}." },
  },
  offered: {
    title: { en: "You have a job offer", ar: "لديك عرض عمل" },
    body: { en: "{employer} made you an offer for {job}.", ar: "قدّمت لك {employer} عرضاً لوظيفة {job}." },
  },
  hired: {
    title: { en: "Congratulations — you are hired", ar: "مبروك — تم قبولك" },
    body: { en: "{employer} hired you for {job}.", ar: "قبلتك {employer} في وظيفة {job}." },
  },
  rejected: {
    title: { en: "An update on your application", ar: "تحديث على طلبك" },
    body: { en: "{employer} will not take your application for {job} forward.", ar: "لن تتابع {employer} طلبك لوظيفة {job} هذه المرة." },
  },
};

const fill = (text: LocalizedText, values: Record<string, string>): LocalizedText =>
  Object.fromEntries(
    Object.entries(text).map(([locale, value]) => [locale, (value ?? "").replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "")]),
  ) as LocalizedText;

function validLogo(logo: MediaImage): boolean {
  return (
    logo.kind === "image" &&
    typeof logo.id === "string" &&
    logo.id.length > 0 &&
    typeof logo.url === "string" &&
    /^(https?:\/\/|data:image\/)/.test(logo.url) &&
    (logo.alt === undefined || (typeof logo.alt === "string" && logo.alt.length <= 300))
  );
}

export const mockEmployerPortalService: EmployerPortalService = {
  async getDashboard(employerId) {
    await simulateLatency();
    const employer = requireEmployer(employerId);
    const store = accountStore();
    const jobs = store.jobs.filter((job) => job.employerId === employerId);
    const applications = store.jobApplications
      .filter((entry) => entry.employerId === employerId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return {
      employer: toEmployerAccountProfile(employer),
      counts: {
        openJobs: jobs.filter((job) => job.status === "open").length,
        pendingJobs: jobs.filter((job) => job.status === "pending").length,
        draftJobs: jobs.filter((job) => job.status === "draft" || job.status === "rejected").length,
        newApplications: applications.filter((entry) => entry.status === "submitted" && !entry.seenByEmployerAt).length,
        totalApplications: applications.length,
      },
      recentApplications: applications.slice(0, 5).map(toEmployerApplication),
    };
  },

  async getProfile(employerId) {
    await simulateLatency();
    return toEmployerAccountProfile(requireEmployer(employerId));
  },

  async updateProfile(employerId, input) {
    await simulateLatency();
    const employer = requireEmployer(employerId);
    const name = text(input.name).trim().replace(/\s+/g, " ");
    const contactName = text(input.contactName).trim().replace(/\s+/g, " ");
    const email = text(input.email).trim().toLowerCase();
    const phone = text(input.phone).trim() || undefined;
    const website = text(input.website).trim() || undefined;
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Your company's name.";
    if (!EMPLOYER_KINDS.includes(input.kind)) errors.kind = "Choose what kind of business it is.";
    if (!JOB_CITIES.includes(input.cityId)) errors.cityId = "Choose the city.";
    if (text(input.about).length > 3000) errors.about = "At most 3000 characters.";
    if (input.size !== undefined && !EMPLOYER_SIZES.includes(input.size)) errors.size = "Choose the team size.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "An email address candidates can write to.";
    if (phone && !/^\+?[\d\s]{8,}$/.test(phone)) errors.phone = "A phone number, digits only.";
    if (website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(website)) errors.website = "A full address, starting with https://";
    if (contactName.length < 3 || !contactName.includes(" ")) errors.contactName = "The first and last name of the person we talk to.";
    if (input.logo && !validLogo(input.logo)) errors.logo = "Upload the logo again.";
    if (Object.keys(errors).length > 0) throw fieldError("Some fields need attention.", errors);

    const store = accountStore();
    const index = store.employers.findIndex((entry) => entry.id === employerId);
    const next = {
      ...employer,
      name,
      kind: input.kind,
      cityId: input.cityId,
      about: text(input.about).trim(),
      website,
      size: input.size,
      email,
      phone,
      contactName,
      logo: input.logo === null ? undefined : input.logo === undefined ? employer.logo : input.logo,
      updatedAt: new Date().toISOString(),
    };
    store.employers[index] = next;
    const account = store.employerAccounts.find((entry) => entry.employerId === employerId);
    if (account) store.employerAccounts[store.employerAccounts.indexOf(account)] = { ...account, name: contactName };
    touch();
    return toEmployerAccountProfile(next);
  },

  async uploadLogo(employerId, file) {
    await simulateLatency();
    const employer = requireEmployer(employerId);
    if (!(file instanceof Blob) || file.size === 0) throw fieldError("Choose an image.", { logo: "Choose an image." });
    if (file.size > LOGO_MAX_BYTES) throw fieldError("The logo is larger than 2 MB.", { logo: "The logo is larger than 2 MB." });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) throw fieldError("Upload the logo as PNG, JPEG or WebP.", { logo: "Upload the logo as PNG, JPEG or WebP." });
    return {
      kind: "image",
      id: `media-${crypto.randomUUID()}`,
      url: `data:${type};base64,${Buffer.from(bytes).toString("base64")}`,
      alt: employer.name,
    };
  },

  async listJobs(employerId, query) {
    await simulateLatency();
    requireEmployer(employerId);
    const term = query.search?.trim().toLowerCase();
    const rows = accountStore()
      .jobs.filter((job) => job.employerId === employerId)
      .filter((job) => !query.statuses?.length || query.statuses.includes(job.status))
      .filter((job) => !term || `${job.title} ${job.reference}`.toLowerCase().includes(term))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toEmployerJob);
    return paginate(rows, query);
  },

  async getJob(employerId, jobId) {
    await simulateLatency();
    const job = accountStore().jobs.find((entry) => entry.id === jobId && entry.employerId === employerId);
    return job ? toEmployerJob(job) : null;
  },

  async createJob(employerId, draft, submit) {
    await simulateLatency();
    const employer = requireEmployer(employerId);
    const next = clean(draft);
    validate(next);
    if (submit) assertMaySubmit(employerId);
    const now = new Date().toISOString();
    const reference = nextReference("JB-2");
    const job: RawJob = {
      ...next,
      id: `job-${reference.slice(3)}`,
      slug: slugFor(next.title, employer.slug),
      reference,
      employerId,
      status: submit ? "pending" : "draft",
      featured: false,
      createdAt: now,
      updatedAt: now,
    };
    accountStore().jobs.unshift(job);
    if (submit) toldStaff(job);
    touch();
    return toEmployerJob(job);
  },

  async updateJob(employerId, jobId, draft) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const current = accountStore().jobs[index]!;
    const next = clean(draft);
    validate(next);
    /* What the public reads was approved; a change to it is reviewed again. */
    const status = current.status === "open" ? "pending" : current.status;
    const job = replaceJob(index, {
      ...current,
      ...next,
      status,
      moderationNote: status === "pending" ? undefined : current.moderationNote,
      updatedAt: new Date().toISOString(),
    });
    if (current.status === "open") toldStaff(job);
    return toEmployerJob(job);
  },

  async submitJob(employerId, jobId) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const current = accountStore().jobs[index]!;
    if (current.status !== "draft" && current.status !== "rejected") {
      throw new AppError("conflict", "Only a draft or a job that needs changes can be sent for review.", { status: 409 });
    }
    assertMaySubmit(employerId);
    validate(current);
    const job = replaceJob(index, { ...current, status: "pending", moderationNote: undefined, updatedAt: new Date().toISOString() });
    toldStaff(job);
    return toEmployerJob(job);
  },

  async withdrawJob(employerId, jobId) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const current = accountStore().jobs[index]!;
    if (current.status !== "pending") throw new AppError("conflict", "Only a job waiting for review can be taken back.", { status: 409 });
    return toEmployerJob(replaceJob(index, { ...current, status: "draft", updatedAt: new Date().toISOString() }));
  },

  async closeJob(employerId, jobId) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const current = accountStore().jobs[index]!;
    if (current.status !== "open") throw new AppError("conflict", "Only an open job can be closed.", { status: 409 });
    return toEmployerJob(replaceJob(index, { ...current, status: "closed", updatedAt: new Date().toISOString() }));
  },

  async reopenJob(employerId, jobId) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const current = accountStore().jobs[index]!;
    if (current.status !== "closed") throw new AppError("conflict", "Only a closed job can be reopened.", { status: 409 });
    if (current.closesOn && current.closesOn < ammanToday()) {
      throw new AppError("conflict", "Move the closing date to a future day first.", {
        status: 409,
        details: { fieldErrors: { closesOn: "A closing date from today onwards." } },
      });
    }
    assertMaySubmit(employerId);
    const job = replaceJob(index, { ...current, status: "pending", updatedAt: new Date().toISOString() });
    toldStaff(job);
    return toEmployerJob(job);
  },

  async deleteJob(employerId, jobId) {
    await simulateLatency();
    const index = ownJobIndex(employerId, jobId);
    const count = applicationsOf(jobId).length;
    if (count > 0) {
      throw new AppError("conflict", `${count} people applied for this job, so it is kept. Close it instead.`, { status: 409 });
    }
    accountStore().jobs.splice(index, 1);
    touch();
  },

  async listApplications(employerId, query) {
    await simulateLatency();
    requireEmployer(employerId);
    const term = query.search?.trim().toLowerCase();
    const rows = accountStore()
      .jobApplications.filter((entry) => entry.employerId === employerId)
      .filter((entry) => !query.jobId || entry.jobId === query.jobId)
      .filter((entry) => !query.statuses?.length || query.statuses.includes(entry.status))
      .filter(
        (entry) =>
          !term || `${entry.candidate.name} ${entry.candidate.email} ${entry.reference}`.toLowerCase().includes(term),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map(toEmployerApplication);
    return paginate(rows, query);
  },

  async getApplication(employerId, applicationId) {
    await simulateLatency();
    const store = accountStore();
    const index = store.jobApplications.findIndex((entry) => entry.id === applicationId && entry.employerId === employerId);
    const entry = store.jobApplications[index];
    if (!entry) return null;
    if (!entry.seenByEmployerAt) {
      store.jobApplications[index] = { ...entry, seenByEmployerAt: new Date().toISOString() };
      touch();
    }
    return toEmployerApplication(store.jobApplications[index]!);
  },

  async moveApplication(employerId, applicationId, status, note) {
    await simulateLatency();
    const store = accountStore();
    const index = ownApplicationIndex(employerId, applicationId);
    const entry = store.jobApplications[index]!;
    if (!EMPLOYER_APPLICATION_MOVES[entry.status].includes(status)) {
      throw new AppError("conflict", `An application that is ${entry.status} cannot move to ${status}.`, { status: 409 });
    }
    const statusNote = note?.trim().slice(0, 500) || undefined;
    const now = new Date().toISOString();
    const next = {
      ...entry,
      status,
      statusNote,
      updatedAt: now,
      seenByEmployerAt: entry.seenByEmployerAt ?? now,
      history: [...entry.history, { status, at: now, by: "employer" as const }],
    };
    store.jobApplications[index] = next;

    const jobIndex = store.jobs.findIndex((job) => job.id === entry.jobId);
    const job = store.jobs[jobIndex]!;
    const employer = requireEmployer(employerId);
    const copy = MOVE_COPY[status];
    if (copy) {
      const values = { employer: employer.name, job: job.title };
      notify({
        audience: "customer",
        recipientId: entry.customerId,
        kind: "application-status",
        title: copy.title,
        body: fill(copy.body, values),
        href: "/account/applications",
      });
    }
    /* Every opening filled: the job closes itself. */
    if (status === "hired" && job.status === "open") {
      const hired = store.jobApplications.filter((row) => row.jobId === job.id && row.status === "hired").length;
      if (hired >= job.positions) store.jobs[jobIndex] = { ...job, status: "closed", updatedAt: now };
    }
    touch();
    return toEmployerApplication(next);
  },

  async saveApplicationNote(employerId, applicationId, note) {
    await simulateLatency();
    const store = accountStore();
    const index = ownApplicationIndex(employerId, applicationId);
    if (note.length > 2000) throw fieldError("At most 2000 characters.", { employerNote: "At most 2000 characters." });
    const next = { ...store.jobApplications[index]!, employerNote: note.trim() || undefined };
    store.jobApplications[index] = next;
    touch();
    return toEmployerApplication(next);
  },

  async downloadCv(employerId, applicationId) {
    const index = ownApplicationIndex(employerId, applicationId);
    return downloadOf(cvOf(accountStore().jobApplications[index]!.cvId));
  },
};
