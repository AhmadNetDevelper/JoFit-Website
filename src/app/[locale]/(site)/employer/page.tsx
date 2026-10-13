import Link from "next/link";

import { ArrowIcon, buttonClasses, Reveal, Rosette } from "@/components/ui";
import { careersService } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, MAX_PAGE_SIZE } from "@/lib";

import { EmptyNote, Panel } from "../_components/portal/portal-shell";
import { CompanyLogo } from "./_components/company-logo";
import { employerFrame } from "./_components/employer-frame";
import { EmployerShell } from "./_components/employer-shell";
import { FigureTile } from "./_components/figure-tile";
import { ago, isNewApplication } from "./_components/format";
import { BriefcaseIcon, DraftIcon, HourglassIcon, PersonPlusIcon, UsersIcon } from "./_components/icons";
import { ApplicationStatusChip, JobStatusChip, NewMarker, VerificationChip } from "./_components/status-chip";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/employer", title: getTranslator(locale)("employer.title"), noIndex: true });
}

/**
 * THE EMPLOYER'S DESK.
 *
 * The figures first, each one a way into the list it counts; the new
 * applicants take the deep green while there are any, because that is who is
 * waiting. Then the people who applied most recently — a hiring manager opens
 * this to see who is new — and the jobs that are waiting on the employer
 * rather than on JoFit: the ones sent back with a note, and the drafts never
 * sent. The company card and the "post a job" invitation sit beside them.
 */
export default async function EmployerDashboardPage({ params }: PageProps<"/[locale]/employer">) {
  const locale = resolveLocale((await params).locale);
  const { employerId, employer, dashboard, t, f, shell } = await employerFrame(locale, "/employer");
  const [attention, jobs, cities] = await Promise.all([
    employerPortalService.listJobs(employerId, { locale, statuses: ["rejected", "draft"], pageSize: 5 }),
    employerPortalService.listJobs(employerId, { locale, pageSize: MAX_PAGE_SIZE }),
    careersService.listCities(locale),
  ]);
  const isNew = isNewApplication(jobs.items);
  const cityName = cities.find((city) => city.id === employer.cityId)?.name ?? employer.cityId;
  const link = (path: string) => localePath(locale, path);

  const figures = [
    { icon: <BriefcaseIcon size={18} />, value: dashboard.counts.openJobs, label: t("employer.countOpen"), href: "/employer/jobs?status=open" },
    { icon: <HourglassIcon size={18} />, value: dashboard.counts.pendingJobs, label: t("employer.countPending"), href: "/employer/jobs?status=pending" },
    {
      icon: <DraftIcon size={18} />,
      value: dashboard.counts.draftJobs,
      label: t("employer.countDrafts"),
      href: "/employer/jobs?status=draft&status=rejected",
    },
    {
      icon: <PersonPlusIcon size={18} />,
      value: dashboard.counts.newApplications,
      label: t("employer.countNew"),
      href: "/employer/applications?status=submitted",
      highlight: dashboard.counts.newApplications > 0,
    },
    { icon: <UsersIcon size={18} />, value: dashboard.counts.totalApplications, label: t("employer.countTotal"), href: "/employer/applications" },
  ];

  return (
    <EmployerShell
      {...shell}
      active="/employer"
      title={employer.name}
      lead={t("employer.dashboardLead")}
      actions={
        <Link href={link("/employer/jobs/new")} className={buttonClasses({ variant: "gold" })}>
          {t("employer.postJob")}
        </Link>
      }
    >
      <Reveal stagger as="ul" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {figures.map((figure, index) => (
          <li key={figure.label} className={`flex ${index === figures.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
            <FigureTile
              href={link(figure.href)}
              icon={figure.icon}
              value={f.number(figure.value)}
              label={figure.label}
              highlight={figure.highlight}
            />
          </li>
        ))}
      </Reveal>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Panel
            id="recent-applicants"
            title={t("employer.recentTitle")}
            action={
              dashboard.recentApplications.length > 0 ? (
                <Link href={link("/employer/applications")} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  {t("employer.seeAllApplicants")}
                  <ArrowIcon size={14} />
                </Link>
              ) : undefined
            }
          >
            {dashboard.recentApplications.length === 0 ? (
              <EmptyNote text={t("employer.recentEmpty")} icon="applications" />
            ) : (
              <ul className="-my-1 divide-y divide-line">
                {dashboard.recentApplications.map((application) => (
                  <li key={application.id}>
                    <Link
                      href={link(`/employer/applications/${application.id}`)}
                      className="group -mx-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-4 transition-colors hover:bg-canvas"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-05 font-heading text-[16px] font-bold text-primary-dark ring-1 ring-primary/15"
                      >
                        {Array.from(application.candidate.name.trim())[0] ?? ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span dir="auto" className="font-heading text-[15.5px] font-semibold text-ink group-hover:text-primary-dark">
                            {application.candidate.name}
                          </span>
                          {isNew(application) ? <NewMarker label={t("employer.new")} /> : null}
                          <ApplicationStatusChip t={t} status={application.status} />
                        </span>
                        <span className="mt-1 block text-[13.5px] text-body">
                          <span dir="auto">{application.job.title}</span>
                          {" · "}
                          <span dir="ltr" className="whitespace-nowrap">
                            {application.job.reference}
                          </span>
                        </span>
                      </span>
                      <span className="w-full ps-15 text-[12.5px] text-body/75 sm:w-auto sm:ps-0">
                        {t("employer.appliedWhen", { when: ago(application.submittedAt, locale) })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            id="needs-attention"
            title={t("employer.attentionTitle")}
            action={
              <Link href={link("/employer/jobs")} className={buttonClasses({ variant: "outline", size: "sm" })}>
                {t("employer.seeAllJobs")}
                <ArrowIcon size={14} />
              </Link>
            }
          >
            {attention.items.length === 0 ? (
              <EmptyNote text={t("employer.attentionEmpty")} icon="jobs" />
            ) : (
              <ul className="grid gap-3">
                {attention.items.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={link(`/employer/jobs/${job.id}`)}
                      className={`group block rounded-2xl border px-5 py-4 transition-colors ${
                        job.status === "rejected"
                          ? "border-danger/25 bg-danger-05 hover:border-danger/45"
                          : "border-line bg-surface hover:border-primary/35"
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2.5">
                        <span dir="auto" className="font-heading text-[15px] font-semibold text-ink group-hover:text-primary-dark">
                          {job.title}
                        </span>
                        <JobStatusChip t={t} status={job.status} />
                      </span>
                      {job.status === "rejected" && job.moderationNote ? (
                        <span className="mt-2 block text-[14px] leading-relaxed text-ink">
                          <span className="font-semibold">{t("employer.bannerNote")}: </span>
                          <span dir="auto">{job.moderationNote}</span>
                        </span>
                      ) : (
                        <span className="mt-1.5 block text-[13.5px] text-body">{t("employer.attentionDraft")}</span>
                      )}
                      <span className="mt-2 flex flex-wrap items-center gap-x-2 text-[12.5px] text-body/75">
                        <span dir="ltr" className="font-semibold">
                          {job.reference}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{`${t("employer.factUpdated")} ${ago(job.updatedAt, locale)}`}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Panel id="company" title={t("employer.companyTitle")} action={<VerificationChip t={t} status={employer.verificationStatus} />}>
            <div className="flex items-center gap-4">
              <CompanyLogo name={employer.name} logo={employer.logo} />
              <div className="min-w-0">
                <p dir="auto" className="font-heading text-[16px] leading-snug font-semibold text-ink">
                  {employer.name}
                </p>
                <p className="mt-1 text-[13.5px] text-body">{`${t(`careers.kind.${employer.kind}`)} · ${cityName}`}</p>
              </div>
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[13px] text-body/80">
              {t("employer.memberSince", { date: f.date(employer.createdAt) })}
            </p>
            <Link href={link("/employer/profile")} className={buttonClasses({ variant: "outline", className: "mt-5 w-full" })}>
              {t("employer.tabProfile")}
              <ArrowIcon />
            </Link>
          </Panel>

          <section
            aria-labelledby="post-a-job"
            className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
            <span aria-hidden="true" className="absolute -end-20 -bottom-24 -z-10 size-60 text-accent/16">
              <Rosette className="spin-slow size-full" />
            </span>
            <h2 id="post-a-job" className="text-[1.3rem] leading-snug text-white">
              {t("employer.ctaTitle")}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent/70" />
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/75">{t("employer.ctaBody")}</p>
            <Link href={link("/employer/jobs/new")} className={buttonClasses({ variant: "gold", className: "mt-6" })}>
              {t("employer.postJob")}
            </Link>
          </section>
        </aside>
      </div>
    </EmployerShell>
  );
}
