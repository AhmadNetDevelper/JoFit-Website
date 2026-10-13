import { notFound } from "next/navigation";

import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata, readParam, resolveSearchParams } from "@/lib";

import { employerFrame } from "../../_components/employer-frame";
import { EmployerShell } from "../../_components/employer-shell";
import { ago, isolate } from "../../_components/format";
import { JobEditor } from "../../_components/job-editor";
import { readNotice } from "../../_components/list-controls";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/jobs/[id]">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/employer/jobs", title: getTranslator(locale)("employer.tabJobs"), noIndex: true });
}

const NOTICES = {
  submitted: "employer.noticeSubmitted",
  withdrawn: "employer.noticeWithdrawn",
  closed: "employer.noticeClosed",
  reopened: "employer.noticeReopened",
} as const;

/**
 * One job, to change. Another company's job id answers 404 exactly like one
 * that does not exist — the service returns `null` for both.
 */
export default async function EmployerJobPage({ params, searchParams }: PageProps<"/[locale]/employer/jobs/[id]">) {
  const [{ locale: raw, id }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const path = `/employer/jobs/${id}`;
  const { employerId, blocked, t, shell } = await employerFrame(locale, path);
  const job = await employerPortalService.getJob(employerId, id);
  if (!job) notFound();

  const noticeKey = readNotice(readParam(search, "notice"), NOTICES);

  return (
    <EmployerShell
      {...shell}
      active="/employer/jobs"
      subpage={job.title}
      title={job.title}
      lead={t("jobForm.editLead", { reference: isolate(job.reference), date: ago(job.updatedAt, locale) })}
      notice={noticeKey ? t(noticeKey, { reference: job.reference }) : undefined}
    >
      <JobEditor locale={locale} job={job} blocked={blocked} path={path} />
    </EmployerShell>
  );
}
