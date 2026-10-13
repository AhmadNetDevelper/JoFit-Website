import Link from "next/link";
import { revalidatePath } from "next/cache";

import { labelClasses, textareaClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import { careersService, type CandidateApplication, type StatusStep } from "@/features/careers";
import { getTranslator, localePath, resolveLocale, type Formatters, type Locale, type Translate } from "@/i18n";
import { buildMetadata, isAppError } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { EmptyNote, PortalNotice, PortalShell, PortalSubhead } from "../../_components/portal/portal-shell";
import { EmployerMark } from "../../careers/_components/employer-mark";
import { DownloadIcon } from "../../careers/_components/icons";
import { ApplicationStatusBadge, STEP_TONE } from "../../careers/_components/status-badge";
import { accountFrame } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/applications">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    path: "/account/applications",
    title: getTranslator(locale)("account.applications"),
    noIndex: true,
  });
}

/**
 * THE CANDIDATE'S APPLICATIONS.
 *
 * The employer moves an application on — reviewing, shortlisted, interview,
 * offer — from their portal; this page is where the candidate watches that
 * happen, reads any note the employer sent with a step, gets back exactly what
 * they sent (the CV included), and withdraws while it is still live.
 *
 * Live ones first, then the closed ones (hired, not taken forward, withdrawn),
 * because the live ones are the ones somebody opens this page for.
 */
export default async function AccountApplicationsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/applications">) {
  const locale = resolveLocale((await params).locale);
  const appliedRef = (await searchParams).applied;
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/applications");
  const applications = await careersService.listMyApplications(customerId, locale);

  const live = applications.filter((entry) => entry.canWithdraw);
  const closed = applications.filter((entry) => !entry.canWithdraw);
  const justSent = typeof appliedRef === "string" ? applications.find((entry) => entry.reference === appliedRef) : undefined;

  const fallback = t("state.errorTitle");
  const withdrawnMessage = t("careers.apps.withdrawn");
  const cannotWithdraw = t("careers.apps.errorWithdraw");

  async function withdraw(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    // An action is a public endpoint: the caller is re-checked, not trusted.
    const account = await requireAccount(locale, "customer", "/account/applications");
    try {
      await careersService.withdrawApplication(
        account.customerId!,
        String(formData.get("applicationId") ?? ""),
        String(formData.get("reason") ?? "").trim() || undefined,
        locale,
      );
      revalidatePath(localePath(locale, "/account/applications"));
      return succeeded(withdrawnMessage);
    } catch (error) {
      if (isAppError(error) && error.code === "conflict") return { status: "error", message: cannotWithdraw };
      return failed(error, fallback);
    }
  }

  const list = (entries: readonly CandidateApplication[]) => (
    <ul className="mt-5 grid gap-5">
      {entries.map((entry) => (
        <ApplicationCard
          key={entry.id}
          entry={entry}
          locale={locale}
          t={t}
          f={f}
          withdraw={withdraw}
          highlight={entry.id === justSent?.id}
        />
      ))}
    </ul>
  );

  return (
    <PortalShell {...shell} active="/account/applications" title={t("account.applications")} lead={t("careers.apps.lead")}>
      {justSent ? <PortalNotice title={t("careers.apps.sentTitle")} body={t("careers.apps.sentBody")} /> : null}

      {applications.length === 0 ? (
        <EmptyNote icon="applications" text={t("careers.apps.empty")} href={localePath(locale, "/careers")} action={t("careers.apps.emptyAction")} />
      ) : (
        <div className="space-y-10">
          {live.length > 0 ? (
            <section aria-labelledby="applications-live">
              <PortalSubhead id="applications-live" title={t("careers.apps.active")} />
              {list(live)}
            </section>
          ) : null}
          {closed.length > 0 ? (
            <section aria-labelledby="applications-closed">
              <PortalSubhead id="applications-closed" title={t("careers.apps.closed")} />
              {list(closed)}
            </section>
          ) : null}
        </div>
      )}
    </PortalShell>
  );
}

function byLabel(t: Translate, by: StatusStep["by"]) {
  return t(by === "candidate" ? "careers.apps.byCandidate" : by === "employer" ? "careers.apps.byEmployer" : "careers.apps.byStaff");
}

function ApplicationCard({
  entry,
  locale,
  t,
  f,
  withdraw,
  highlight,
}: {
  entry: CandidateApplication;
  locale: Locale;
  t: Translate;
  f: Formatters;
  withdraw: (state: FormState, formData: FormData) => Promise<FormState>;
  highlight: boolean;
}) {
  const jobHref = localePath(locale, `/careers/jobs/${entry.job.slug}`);
  const answers = [
    { label: t("careers.apply.years"), value: f.number(entry.yearsExperience), numeric: true },
    entry.certifications ? { label: t("careers.apply.certifications"), value: entry.certifications, written: true } : null,
    entry.availableFrom ? { label: t("careers.apply.availableFrom"), value: f.date(entry.availableFrom) } : null,
    entry.expectedSalary ? { label: t("careers.apply.expectedSalary"), value: f.money(entry.expectedSalary), numeric: true } : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <li
      id={`application-${entry.id}`}
      className={`relative rounded-3xl border bg-surface p-6 sm:p-7 ${
        highlight ? "border-primary shadow-lift ring-4 ring-primary-10" : "border-line shadow-soft"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {/* No live `logo`/`slug` on an application's job reference (see
              `CandidateApplicationJobRef` in careers/types.ts) — the mark
              falls back to its lettered seal and the employer's name is
              plain text rather than a link to a page we can't build a path
              for. */}
          <EmployerMark name={entry.job.employer.name} size="sm" className="rounded-2xl" />
          <div className="min-w-0">
            <h3 className="font-heading text-[17px] leading-snug font-semibold">
              <Link href={jobHref} dir="auto" className="text-ink underline-offset-4 hover:text-primary-dark hover:underline">
                {entry.job.title}
              </Link>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13.5px] text-body">
              <span dir="auto" className="font-semibold text-primary-dark">
                {entry.job.employer.name}
              </span>
              {/* city/employmentType: no live source on this reference — shown only when present. */}
              {entry.job.city ? (
                <>
                  <span aria-hidden="true" className="text-body/40">
                    ·
                  </span>
                  <span>{entry.job.city.name}</span>
                </>
              ) : null}
              {entry.job.employmentType ? (
                <>
                  <span aria-hidden="true" className="text-body/40">
                    ·
                  </span>
                  <span>{t(`careers.type.${entry.job.employmentType}`)}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="ms-auto text-end">
          <ApplicationStatusBadge status={entry.status} t={t} />
          <p className="mt-2 text-[12.5px] text-body/70">
            <span dir="ltr">{entry.reference}</span>
          </p>
        </div>
      </div>

      {/* THE TIMELINE — every step the application has been through, oldest
          first, with who moved it and when. */}
      <div className="mt-6 rounded-2xl border border-line bg-canvas p-5">
        <h4 className="text-[13px] font-semibold text-ink">{t("careers.apps.progress")}</h4>
        <ol className="mt-4 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-y-4">
          {entry.history.map((step, index) => {
            const last = index === entry.history.length - 1;
            return (
              <li key={`${step.status}-${step.at}`} className="relative flex items-start gap-3 sm:min-w-[9.5rem] sm:flex-col sm:gap-2 sm:pe-6">
                {/* The connector runs to the next step; the last one has none. */}
                {!last ? (
                  <span aria-hidden="true" className="absolute start-[5px] top-[5px] hidden h-px w-full bg-line sm:block" />
                ) : null}
                <span
                  aria-hidden="true"
                  className={`relative mt-1 size-[11px] shrink-0 rounded-full sm:mt-0 ${STEP_TONE[step.status]} ${last ? "ring-4 ring-primary-10" : ""}`}
                />
                <span className="min-w-0">
                  <span className={`block text-[13.5px] ${last ? "font-semibold text-ink" : "font-medium text-body"}`}>
                    {t(`careers.appStatus.${step.status}`)}
                  </span>
                  <span className="block text-[12px] text-body/65">{`${f.date(step.at)} · ${byLabel(t, step.by)}`}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The employer's note and the candidate's own reason are two things;
          withdrawing never overwrites what the employer said. */}
      {entry.statusNote ? (
        <div
          className={`mt-5 rounded-2xl border px-5 py-4 ${
            entry.status === "rejected" ? "border-danger/20 bg-danger-05" : "border-accent/40 bg-accent-10"
          }`}
        >
          <p className="text-[12.5px] font-semibold text-ink">{t("careers.apps.employerNote")}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-body" dir="auto">
            {entry.statusNote}
          </p>
        </div>
      ) : null}
      {entry.withdrawReason ? (
        <div className="mt-5 rounded-2xl border border-line bg-canvas px-5 py-4">
          <p className="text-[12.5px] font-semibold text-ink">{t("careers.apps.yourReason")}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-body" dir="auto">
            {entry.withdrawReason}
          </p>
        </div>
      ) : null}

      <details className="group mt-5 border-t border-line pt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold text-primary-dark [&::-webkit-details-marker]:hidden">
          {t("careers.apps.answers")}
          <Chevron />
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[12.5px] font-semibold text-body/75">{t("careers.apply.coverLetter")}</p>
            <p className="mt-1.5 max-w-[72ch] text-[14.5px] leading-relaxed whitespace-pre-line text-ink" dir="auto">
              {entry.coverLetter}
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-3 rounded-2xl bg-canvas p-4 sm:grid-cols-2">
            {answers.map((row) => (
              <div key={row.label}>
                <dt className="text-[12.5px] font-semibold text-body/75">{row.label}</dt>
                <dd className="mt-0.5 text-[14.5px] text-ink">
                  <span dir={"numeric" in row && row.numeric ? "ltr" : "written" in row && row.written ? "auto" : undefined}>
                    {row.value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        {entry.cv ? (
          <div className="min-w-0">
            <a
              href={`/api/careers/cv/${encodeURIComponent(entry.id)}`}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary-dark underline-offset-4 hover:text-primary hover:underline"
            >
              <DownloadIcon size={16} />
              {t("careers.apps.downloadCv")}
            </a>
            <p className="mt-0.5 ps-6 text-[12.5px] break-all text-body/60">
              <span dir="auto">{entry.cv.fileName}</span>
            </p>
          </div>
        ) : (
          <span />
        )}
        <p className="text-[12.5px] text-body/70">{t("careers.apps.appliedOn", { date: f.date(entry.submittedAt) })}</p>
      </div>

      {entry.canWithdraw ? (
        <details className="group mt-4 border-t border-line pt-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold text-danger [&::-webkit-details-marker]:hidden">
            {t("careers.apps.withdraw")}
            <Chevron />
          </summary>
          <ActionForm
            action={withdraw}
            submitLabel={t("careers.apps.withdrawConfirm")}
            pendingLabel={t("account.working")}
            tone="danger"
            className="mt-4 max-w-lg"
          >
            <input type="hidden" name="applicationId" value={entry.id} />
            <label className={labelClasses} htmlFor={`withdraw-${entry.id}`}>
              {t("careers.apps.withdrawReason")}
              <span className="ms-1 font-normal text-body/70">{t("booking.goalOptional")}</span>
            </label>
            <textarea
              id={`withdraw-${entry.id}`}
              name="reason"
              rows={2}
              maxLength={500}
              dir="auto"
              className={textareaClasses("min-h-24")}
            />
          </ActionForm>
        </details>
      ) : null}
    </li>
  );
}

/** Turns over when its `<details>` opens. */
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
      <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
