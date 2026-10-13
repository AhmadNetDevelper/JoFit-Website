import Link from "next/link";

import { buttonClasses, inputClasses, Reveal } from "@/components/ui";
import { careersService, JOB_STATUSES, type JobStatus } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, buildQueryString, readNumberParam, readParam, readParams, resolveSearchParams } from "@/lib";

import { EmptyNote } from "../../_components/portal/portal-shell";
import { employerFrame } from "../_components/employer-frame";
import { EmployerShell } from "../_components/employer-shell";
import { ago } from "../_components/format";
import { BriefcaseIcon, CalendarIcon, ClockIcon, SearchIcon, UsersIcon } from "../_components/icons";
import { JobActions } from "../_components/job-actions";
import { FilterBar, FilterPill, Pager, readNotice } from "../_components/list-controls";
import { JobStatusChip } from "../_components/status-chip";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/jobs">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/employer/jobs", title: getTranslator(locale)("employer.tabJobs"), noIndex: true });
}

const PAGE_SIZE = 8;

const NOTICES = {
  draft: "employer.noticeDraft",
  submitted: "employer.noticeSubmitted",
  withdrawn: "employer.noticeWithdrawn",
  closed: "employer.noticeClosed",
  reopened: "employer.noticeReopened",
  deleted: "employer.noticeDeleted",
} as const;

/**
 * EVERY JOB THE COMPANY HAS WRITTEN, whatever state it is in.
 *
 * Filtered by status (with the count each filter would show) and searched by
 * title or reference; both live in the URL. Each row carries what a hiring
 * manager scans for — who applied, when it closes, when it last changed — and
 * exactly the moves its status allows.
 */
export default async function EmployerJobsPage({ params, searchParams }: PageProps<"/[locale]/employer/jobs">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const { employerId, blocked, t, f, shell } = await employerFrame(locale, "/employer/jobs");

  const statuses = readParams(search, "status").filter((value): value is JobStatus =>
    (JOB_STATUSES as readonly string[]).includes(value),
  );
  const q = readParam(search, "q")?.trim() || undefined;
  const page = Math.max(1, Math.trunc(readNumberParam(search, "page") ?? 1));

  const [result, categories, cities, ...counts] = await Promise.all([
    employerPortalService.listJobs(employerId, { locale, statuses, search: q, page, pageSize: PAGE_SIZE }),
    careersService.listCategories(locale),
    careersService.listCities(locale),
    employerPortalService.listJobs(employerId, { locale, search: q, pageSize: 1 }),
    ...JOB_STATUSES.map((status) => employerPortalService.listJobs(employerId, { locale, statuses: [status], search: q, pageSize: 1 })),
  ]);
  const [all, ...byStatus] = counts.map((entry) => entry.meta.totalItems);
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const cityName = new Map(cities.map((city) => [city.id, city.name]));

  const base = localePath(locale, "/employer/jobs");
  const hrefFor = (changes: { statuses?: readonly JobStatus[]; page?: number }) =>
    `${base}${buildQueryString({
      q,
      status: [...(changes.statuses ?? statuses)],
      page: changes.page && changes.page > 1 ? changes.page : undefined,
    })}`;
  /* Where a row's action comes back to: this list, as it is filtered now. */
  const returnTo = `/employer/jobs${buildQueryString({ q, status: [...statuses], page: page > 1 ? page : undefined })}`;

  const noticeKey = readNotice(readParam(search, "notice"), NOTICES);
  const reference = readParam(search, "ref") ?? "";
  const notice = noticeKey && /^JB-\d+$/.test(reference) ? t(noticeKey, { reference }) : undefined;
  const filtered = statuses.length > 0 || Boolean(q);

  return (
    <EmployerShell
      {...shell}
      active="/employer/jobs"
      title={t("employer.tabJobs")}
      lead={t("employer.jobsLead")}
      notice={notice}
      actions={
        <Link href={localePath(locale, "/employer/jobs/new")} className={buttonClasses({ variant: "gold" })}>
          {t("employer.postJob")}
        </Link>
      }
    >
      <FilterBar>
        <form action={base} method="get" className="flex flex-wrap items-center gap-3" role="search">
          {statuses.map((status) => (
            <input key={status} type="hidden" name="status" value={status} />
          ))}
          <label htmlFor="jobs-search" className="sr-only">
            {t("employer.searchJobs")}
          </label>
          <div className="relative min-w-0 flex-1 basis-64">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
              <SearchIcon size={17} />
            </span>
            <input
              id="jobs-search"
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("employer.searchJobs")}
              dir="auto"
              className={inputClasses("rounded-full ps-12")}
            />
          </div>
          <button type="submit" className={buttonClasses({ size: "lg", className: "h-12" })}>
            {t("employer.search")}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5" role="group" aria-label={t("employer.filterStatus")}>
          <FilterPill href={hrefFor({ statuses: [] })} active={statuses.length === 0} label={t("employer.filterAll")} count={f.number(all ?? 0)} />
          {JOB_STATUSES.map((status, index) => (
            <FilterPill
              key={status}
              href={hrefFor({ statuses: [status] })}
              active={statuses.length === 1 && statuses[0] === status}
              label={t(`careers.jobStatus.${status}`)}
              count={f.number(byStatus[index] ?? 0)}
            />
          ))}
        </div>
      </FilterBar>

      {result.items.length === 0 ? (
        filtered ? (
          <EmptyNote text={t("employer.jobsEmpty")} href={base} action={t("employer.clearFilters")} icon="jobs" />
        ) : (
          <EmptyNote text={t("employer.jobsNone")} href={localePath(locale, "/employer/jobs/new")} action={t("employer.postJob")} icon="jobs" />
        )
      ) : (
        <Reveal stagger as="ul" className="grid gap-5">
          {result.items.map((job) => (
            <li key={job.id}>
              <article
                aria-labelledby={`job-${job.id}`}
                className="rounded-3xl border border-line bg-surface p-5 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-primary/25 hover:shadow-lift sm:p-7"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-body">
                  <span dir="ltr" className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-semibold text-ink ring-1 ring-line">
                    {job.reference}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-primary">
                      <BriefcaseIcon size={14} />
                    </span>
                    {categoryName.get(job.categoryId) ?? job.categoryId}
                  </span>
                  <span aria-hidden="true" className="text-body/40">
                    ·
                  </span>
                  <span>{cityName.get(job.cityId) ?? job.cityId}</span>
                  <span aria-hidden="true" className="text-body/40">
                    ·
                  </span>
                  <span>{t(`careers.type.${job.employmentType}`)}</span>
                  <span className="ms-auto">
                    <JobStatusChip t={t} status={job.status} />
                  </span>
                </div>
                <h2 id={`job-${job.id}`} className="mt-3 text-[1.2rem] leading-snug sm:text-[1.3rem]">
                  <Link href={localePath(locale, `/employer/jobs/${job.id}`)} dir="auto" className="text-ink transition-colors hover:text-primary-dark">
                    {job.title}
                  </Link>
                </h2>

                {job.status === "rejected" && job.moderationNote ? (
                  <p className="mt-3 rounded-2xl border border-danger/25 bg-danger-05 px-4 py-3 text-[14px] leading-relaxed text-ink">
                    <span className="font-semibold text-danger">{t("employer.bannerNote")}: </span>
                    <span dir="auto">{job.moderationNote}</span>
                  </p>
                ) : null}

                <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line text-[14px] sm:grid-cols-3">
                  <div className="bg-surface px-4 py-3.5">
                    <dt className="flex items-center gap-1.5 text-[12.5px] text-body">
                      <span className="text-primary">
                        <UsersIcon size={14} />
                      </span>
                      {t("employer.factApplicants")}
                    </dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {job.applicationCount > 0 ? (
                        <Link
                          href={localePath(locale, `/employer/applications${buildQueryString({ job: job.id })}`)}
                          className="text-primary-dark underline-offset-4 hover:underline"
                        >
                          {t("employer.applicantsNewOfTotal", { new: f.number(job.newApplicationCount), total: f.number(job.applicationCount) })}
                        </Link>
                      ) : (
                        t("employer.applicantsNewOfTotal", { new: f.number(0), total: f.number(0) })
                      )}
                    </dd>
                  </div>
                  <div className="bg-surface px-4 py-3.5">
                    <dt className="flex items-center gap-1.5 text-[12.5px] text-body">
                      <span className="text-primary">
                        <CalendarIcon size={14} />
                      </span>
                      {t("employer.factCloses")}
                    </dt>
                    <dd className="mt-1 font-semibold text-ink">{job.closesOn ? f.date(job.closesOn) : t("employer.noClosingDate")}</dd>
                  </div>
                  <div className="bg-surface px-4 py-3.5">
                    <dt className="flex items-center gap-1.5 text-[12.5px] text-body">
                      <span className="text-primary">
                        <ClockIcon size={14} />
                      </span>
                      {t("employer.factUpdated")}
                    </dt>
                    <dd className="mt-1 font-semibold text-ink">{ago(job.updatedAt, locale)}</dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <JobActions
                    job={job}
                    locale={locale}
                    returnTo={returnTo}
                    blocked={blocked}
                    editHref={localePath(locale, `/employer/jobs/${job.id}`)}
                    previewHref={job.status === "open" ? localePath(locale, `/careers/jobs/${job.slug}`) : undefined}
                  />
                </div>
              </article>
            </li>
          ))}
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
