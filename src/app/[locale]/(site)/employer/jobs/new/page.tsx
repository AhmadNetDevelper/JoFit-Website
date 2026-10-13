import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { employerFrame } from "../../_components/employer-frame";
import { EmployerShell } from "../../_components/employer-shell";
import { JobEditor } from "../../_components/job-editor";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/jobs/new">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/employer/jobs/new", title: getTranslator(locale)("employer.postJob"), noIndex: true });
}

const PATH = "/employer/jobs/new";

/** Writing a new job: saved as a draft, or sent straight to JoFit for review. */
export default async function EmployerNewJobPage({ params }: PageProps<"/[locale]/employer/jobs/new">) {
  const locale = resolveLocale((await params).locale);
  const { blocked, t, shell } = await employerFrame(locale, PATH);

  return (
    <EmployerShell {...shell} active="/employer/jobs" subpage={t("employer.postJob")} title={t("employer.postJob")} lead={t("jobForm.newLead")}>
      <JobEditor locale={locale} blocked={blocked} path={PATH} />
    </EmployerShell>
  );
}
