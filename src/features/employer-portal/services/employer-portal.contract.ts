import type {
  ApplicationStatus,
  EmployerAccountProfile,
  EmployerApplication,
  EmployerApplicationListQuery,
  EmployerDashboard,
  EmployerJob,
  EmployerJobListQuery,
  EmployerProfileInput,
  JobDraft,
} from "@/features/careers";
import type { Locale } from "@/i18n";
import type { DownloadedFile } from "@/services";
import type { MediaImage, Paginated } from "@/types";

/**
 * THE EMPLOYER PORTAL — a sports business managing its own jobs and the
 * people who applied. Every call is made for the employer the SESSION names;
 * a job or an application of another employer answers `not-found`.
 *
 * Jobs follow the graph in `features/careers/types.ts`. Nothing an employer
 * writes is public until JoFit staff approve it, and a change to an open job
 * sends it back for review.
 */
export interface EmployerPortalService {
  getDashboard(employerId: string, locale: Locale): Promise<EmployerDashboard>;

  getProfile(employerId: string): Promise<EmployerAccountProfile>;
  updateProfile(employerId: string, input: EmployerProfileInput): Promise<EmployerAccountProfile>;
  /** The company logo: PNG, JPEG or WebP, at most 2 MB. Save it with `updateProfile`. */
  uploadLogo(employerId: string, file: File): Promise<MediaImage>;

  listJobs(employerId: string, query: EmployerJobListQuery): Promise<Paginated<EmployerJob>>;
  getJob(employerId: string, jobId: string): Promise<EmployerJob | null>;
  /** Saved as a draft, or straight to review with `submit`. */
  createJob(employerId: string, draft: JobDraft, submit: boolean): Promise<EmployerJob>;
  /** An open job goes back to review. */
  updateJob(employerId: string, jobId: string, draft: JobDraft): Promise<EmployerJob>;
  /** draft | rejected → pending. Refused while the company is suspended or rejected. */
  submitJob(employerId: string, jobId: string): Promise<EmployerJob>;
  /** pending → draft. */
  withdrawJob(employerId: string, jobId: string): Promise<EmployerJob>;
  /** open → closed. */
  closeJob(employerId: string, jobId: string): Promise<EmployerJob>;
  /** closed → pending (reviewed again). Refused when the closing date has passed. */
  reopenJob(employerId: string, jobId: string): Promise<EmployerJob>;
  /** Only a job nobody applied to. */
  deleteJob(employerId: string, jobId: string): Promise<void>;

  listApplications(employerId: string, query: EmployerApplicationListQuery): Promise<Paginated<EmployerApplication>>;
  /** Opening one marks it seen. */
  getApplication(employerId: string, applicationId: string): Promise<EmployerApplication | null>;
  /** Along `EMPLOYER_APPLICATION_MOVES`; the candidate is told, with the note if one is given. */
  moveApplication(employerId: string, applicationId: string, status: ApplicationStatus, note?: string): Promise<EmployerApplication>;
  /** A private note; the candidate never sees it. */
  saveApplicationNote(employerId: string, applicationId: string, note: string): Promise<EmployerApplication>;
  downloadCv(employerId: string, applicationId: string): Promise<DownloadedFile>;
}
