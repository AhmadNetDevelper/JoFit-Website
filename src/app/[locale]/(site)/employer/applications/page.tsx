import Link from "next/link";

import { ArrowIcon, buttonClasses, inputClasses, labelClasses, Reveal, selectClasses } from "@/components/ui";
import { APPLICATION_STATUSES, isApplicationStatus, type ApplicationStatus } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import {
  buildMetadata,
  buildQueryString,
  MAX_PAGE_SIZE,
  readNumberParam,
  readParam,
  readParams,
  resolveSearchParams,
} from "@/lib";

import { EmptyNote } from "../../_components/portal/portal-shell";
import { employerFrame } from "../_components/employer-frame";
import { EmployerShell } from "../_components/employer-shell";
import { ago, experience, isNewApplication } from "../_components/format";
import { SearchIcon } from "../_components/icons";
import { FilterBar, FilterPill, Pager } from "../_components/list-controls";
import { ApplicationStatusChip, NewMarker } from "../_components/status-chip";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/applications">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    path: "/employer/applications",
    title: getTranslator(locale)("employer.tabApplications"),
    noIndex: true,
  });
}

const PAGE_SIZE = 10;

/**
 * THE APPLICANT PIPELINE.
 *
 * Everyone who applied, newest first, narrowed by job (a list of the
 * company's own jobs), by stage and by a search. The stages are quick filters
 * that say how many people stand at each one — the shape of the pipeline at a
 * glance — and the counts follow the job and the search, so they always add
 * up to what the list would show.
 */
export default async function EmployerApplicationsPage({ params, searchParams }: PageProps<"/[locale]/employer/applications">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const { employerId, t, f, shell } = await employerFrame(locale, "/employer/applications");

  const statuses = readParams(search, "status").filter(isApplicationStatus);
  const q = readParam(search, "q")?.trim() || undefined;
  const page = Math.max(1, Math.trunc(readNumberParam(search, "page") ?? 1));

  const jobs = await employerPortalService.listJobs(employerId, { locale, pageSize: MAX_PAGE_SIZE });
  const requested = readParam(search, "job");
  /* Only one of the company's own jobs can narrow the list. */
  const jobId = jobs.items.some((job) => job.id === requested) ? requested : undefined;

  const [result, all, ...byStatus] = await Promise.all([
    employerPortalService.listApplications(employerId, { locale, jobId, statuses, search: q, page, pageSize: PAGE_SIZE }),
    employerPortalService.listApplications(employerId, { locale, jobId, search: q, pageSize: 1 }),
    ...APPLICATION_STATUSES.map((status) =>
      employerPortalService.listApplications(employerId, { locale, jobId, statuses: [status], search: q, pageSize: 1 }),
    ),
  ]);

  const isNew = isNewApplication(jobs.items);

  const base = localePath(locale, "/employer/applications");
  const hrefFor = (changes: { statuses?: readonly ApplicationStatus[]; page?: number }) =>
    `${base}${buildQueryString({
      job: jobId,
      q,
      status: [...(changes.statuses ?? statuses)],
      page: changes.page && changes.page > 1 ? changes.page : undefined,
    })}`;
  const filtered = Boolean(jobId) || Boolean(q) || statuses.length > 0;

  return (
    <EmployerShell {...shell} active="/employer/applications" title={t("employer.tabApplications")} lead={t("employer.applicationsLead")}>
      <FilterBar>
        <form action={base} method="get" role="search" className="grid gap-4 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto] md:items-end">
          {statuses.map((status) => (
            <input key={status} type="hidden" name="status" value={status} />
          ))}
          <div>
            <label htmlFor="applicants-job" className={labelClasses}>
              {t("employer.filterJob")}
            </label>
            <select id="applicants-job" name="job" defaultValue={jobId ?? ""} className={selectClasses()}>
              <option value="">{t("employer.allJobs")}</option>
              {jobs.items.map((job) => (
                <option key={job.id} value={job.id}>
                  {`${job.title} · ${job.reference}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="applicants-search" className={labelClasses}>
              {t("employer.search")}
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
                <SearchIcon size={17} />
              </span>
              <input
                id="applicants-search"
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder={t("employer.searchApplicants")}
                dir="auto"
                className={inputClasses("ps-12")}
              />
            </div>
          </div>
          <button type="submit" className={buttonClasses({ size: "lg", className: "h-12" })}>
            {t("employer.show")}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5" role="group" aria-label={t("employer.filterStatus")}>
          <FilterPill
            href={hrefFor({ statuses: [] })}
            active={statuses.length === 0}
            label={t("employer.filterAll")}
            count={f.number(all.meta.totalItems)}
          />
          {APPLICATION_STATUSES.map((status, index) => (
            <FilterPill
              key={status}
              href={hrefFor({ statuses: [status] })}
              active={statuses.length === 1 && statuses[0] === status}
              label={t(`careers.appStatus.${status}`)}
              count={f.number(byStatus[index]?.meta.totalItems ?? 0)}
            />
          ))}
        </div>
      </FilterBar>

      {result.items.length === 0 ? (
        filtered ? (
          <EmptyNote text={t("employer.applicantsEmpty")} href={base} action={t("employer.clearFilters")} icon="applications" />
        ) : (
          <EmptyNote text={t("employer.applicantsNone")} icon="applications" />
        )
      ) : (
        <Reveal stagger as="ul" className="grid gap-4">
          {result.items.map((application) => {
            const fresh = isNew(application);
            return (
              <li key={application.id}>
                <Link
                  href={localePath(locale, `/employer/applications/${application.id}`)}
                  data-new={fresh ? "true" : undefined}
                  className="group relative grid items-center gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift data-[new=true]:border-accent/50 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6"
                >
                  {fresh ? <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 bg-accent" /> : null}
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-full bg-primary-05 font-heading text-[18px] font-bold text-primary-dark ring-1 ring-primary/15 max-sm:hidden"
                  >
                    {Array.from(application.candidate.name.trim())[0] ?? ""}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span dir="auto" className="font-heading text-[16.5px] font-semibold text-ink group-hover:text-primary-dark">
                        {application.candidate.name}
                      </span>
                      {fresh ? <NewMarker label={t("employer.new")} /> : null}
                      <ApplicationStatusChip t={t} status={application.status} />
                    </span>
                    <span className="mt-1.5 block text-[14px] text-ink">
                      <span dir="auto">{application.job.title}</span>
                      <span className="text-body/70">
                        {" · "}
                        <span dir="ltr" className="whitespace-nowrap">
                          {application.job.reference}
                        </span>
                      </span>
                    </span>
                    <span className="mt-1 block text-[13px] text-body">
                      {`${experience(t, application.yearsExperience, locale)} · ${t("employer.appliedWhen", { when: ago(application.submittedAt, locale) })}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 sm:justify-end">
                    <span dir="ltr" className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-semibold text-body ring-1 ring-line">
                      {application.reference}
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid size-9 place-items-center rounded-full bg-primary-05 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary"
                    >
                      <ArrowIcon size={15} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </Reveal>
      )}

      <Pager
        meta={result.meta}
        hrefFor={(target) => hrefFor({ page: target })}
        label={t("employer.pages")}
        previousLabel={t("employer.previous")}
        nextLabel={t("employer.next")}
        number={f.number}
      />
    </EmployerShell>
  );
}
