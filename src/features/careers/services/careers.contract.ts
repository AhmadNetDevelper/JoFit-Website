import type { Locale } from "@/i18n";
import type { DownloadedFile } from "@/services";
import type { ListQuery, Paginated, SitemapEntry } from "@/types";

import type {
  ApplicationInput,
  CandidateApplication,
  CareersStats,
  CvFile,
  EmployerProfile,
  EmployerSummary,
  JobCategory,
  JobCity,
  JobListQuery,
  JobListResult,
  JobPosting,
} from "../types";

/**
 * The careers board for everyone, and the candidate's side of it.
 *
 * The public reads show only what is public: jobs that are `open`, from a
 * VERIFIED employer, and not past their closing date; employers that are
 * verified. The candidate calls are made for the customer the SESSION names —
 * `customerId` comes from the server session, never from the page.
 */
export interface CareersService {
  listJobs(query: JobListQuery): Promise<JobListResult>;
  /** `null` unless the job is public. */
  getJobBySlug(slug: string, locale: Locale): Promise<JobPosting | null>;
  listCategories(locale: Locale): Promise<readonly JobCategory[]>;
  listCities(locale: Locale): Promise<readonly { readonly id: JobCity; readonly name: string }[]>;
  /** Verified employers, the ones with open jobs first. */
  listEmployers(query: ListQuery): Promise<Paginated<EmployerSummary>>;
  getEmployerBySlug(slug: string, locale: Locale): Promise<EmployerProfile | null>;
  getStats(): Promise<CareersStats>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;

  /**
   * Stores a CV privately and answers its id, for `apply`. PDF, DOC or DOCX
   * (decided by the file's bytes), at most 5 MB.
   */
  uploadCv(customerId: string, file: File): Promise<CvFile>;
  /**
   * Applies to a job. Rejects a job that is not taking applications (409), a
   * second live application to the same job (409), and a CV that is not the
   * customer's own.
   */
  apply(customerId: string, input: ApplicationInput, locale: Locale): Promise<CandidateApplication>;
  listMyApplications(customerId: string, locale: Locale): Promise<readonly CandidateApplication[]>;
  /** The customer's live application to this job, if any — for the job page. */
  findMyApplication(customerId: string, jobId: string, locale: Locale): Promise<CandidateApplication | null>;
  /** While it is still live; the employer is told. */
  withdrawApplication(customerId: string, applicationId: string, reason: string | undefined, locale: Locale): Promise<CandidateApplication>;
  downloadMyCv(customerId: string, applicationId: string): Promise<DownloadedFile>;
}
