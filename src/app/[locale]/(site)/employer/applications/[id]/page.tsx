import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonClasses, hintClasses, textareaClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import { isApplicationStatus, type StatusStep } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, readParam, resolveSearchParams } from "@/lib";

import { ActionForm, type FormState } from "../../../_components/portal/action-form";
import { succeeded } from "../../../_components/portal/form-state";
import { Panel } from "../../../_components/portal/portal-shell";
import { EmployerForm } from "../../_components/employer-form";
import { employerFrame } from "../../_components/employer-frame";
import { EmployerShell } from "../../_components/employer-shell";
import { Field } from "../../_components/fields";
import { ago, experience, isolate } from "../../_components/format";
import { BackArrowIcon, DownloadIcon, LockIcon, MailIcon, PhoneIcon } from "../../_components/icons";
import { refreshEmployerArea, withNotice } from "../../_components/navigation";
import { refused } from "../../_components/refusals";
import { ApplicationStatusChip, HeroStatus } from "../../_components/status-chip";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/applications/[id]">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    path: "/employer/applications",
    title: getTranslator(locale)("employer.tabApplications"),
    noIndex: true,
  });
}

const NOTE_MAX = 500;

/**
 * ONE APPLICANT.
 *
 * Who they are and how to reach them, their CV, what they wrote, and where
 * the application has been. Then the decision: exactly the next moves the
 * lifecycle allows from here — a step forward, with an optional note the
 * candidate reads, or "not taking it forward", which is final and asked for
 * separately. Beside it, the team's private notes, which the candidate never
 * sees.
 *
 * Opening the page marks the application seen; another company's application
 * answers 404, like one that does not exist.
 */
export default async function EmployerApplicationPage({ params, searchParams }: PageProps<"/[locale]/employer/applications/[id]">) {
  const [{ locale: raw, id }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const path = `/employer/applications/${id}`;
  /* Read first, so the tab's "new" count already leaves this one out. */
  const signedIn = await requireAccount(locale, "employer", path);
  const application = await employerPortalService.getApplication(signedIn.employerId!, id);
  if (!application) notFound();
  const { t, f, shell } = await employerFrame(locale, path);

  const moved = readParam(search, "notice") === "moved" && isApplicationStatus(readParam(search, "ref"));
  const notice = moved ? t("employer.noticeMoved", { status: t(`careers.appStatus.${application.status}`) }) : undefined;

  async function move(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", path);
    const tr = getTranslator(locale);
    const status = String(formData.get("intent") ?? "");
    if (!isApplicationStatus(status)) return { status: "error", message: tr("state.errorTitle") };
    const note = String(formData.get("note") ?? "").trim().slice(0, NOTE_MAX) || undefined;
    try {
      await employerPortalService.moveApplication(account.employerId!, id, status, note);
    } catch (error) {
      return refused(tr, "moveApplication", error);
    }
    refreshEmployerArea(locale, path);
    redirect(localePath(locale, withNotice(path, "moved", status)));
  }

  async function saveNote(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", path);
    const tr = getTranslator(locale);
    const note = String(formData.get("employerNote") ?? "");
    if (note.length > 2000) {
      return { status: "error", message: tr("employer.errNoteLong"), fieldErrors: { employerNote: tr("employer.errNoteLong") } };
    }
    try {
      await employerPortalService.saveApplicationNote(account.employerId!, id, note);
    } catch (error) {
      return refused(tr, "saveNote", error);
    }
    refreshEmployerArea(locale, path);
    return succeeded(tr("employer.noteSaved"));
  }

  const forward = application.nextStatuses.filter((status) => status !== "rejected");
  const canReject = application.nextStatuses.includes("rejected");
  const statusWord = (status: StatusStep["status"]) => t(`careers.appStatus.${status}`);
  const byWhom: Record<StatusStep["by"], string> = {
    candidate: t("employer.byCandidate"),
    employer: t("employer.byEmployer"),
    staff: t("employer.byStaff"),
  };
  const { cv } = application;
  const kilobytes = cv ? Math.max(1, Math.round(cv.bytes / 1024)) : 0;
  const phoneHref = application.candidate.phone ? `tel:${application.candidate.phone.replace(/[^\d+]/g, "")}` : undefined;

  const facts: readonly { label: string; value: string; auto?: boolean; ltr?: boolean }[] = [
    { label: t("employer.experience"), value: experience(t, application.yearsExperience, locale) },
    {
      label: t("employer.certifications"),
      value: application.certifications || t("employer.notStated"),
      auto: Boolean(application.certifications),
    },
    {
      label: t("employer.availableFrom"),
      value: application.availableFrom ? f.date(application.availableFrom) : t("employer.notStated"),
    },
    {
      label: t("employer.expectedSalary"),
      value: application.expectedSalary
        ? t("employer.perMonthValue", { amount: isolate(f.money(application.expectedSalary)) })
        : t("employer.notStated"),
    },
    { label: t("employer.submittedOn"), value: f.dateTime(application.submittedAt) },
  ];

  return (
    <EmployerShell
      {...shell}
      active="/employer/applications"
      subpage={application.candidate.name}
      title={application.candidate.name}
      lead={t("employer.applicationLead", { job: isolate(application.job.title), reference: isolate(application.reference) })}
      notice={notice}
      actions={
        <HeroStatus label={t("jobForm.statusTitle")}>
          <ApplicationStatusChip t={t} status={application.status} />
        </HeroStatus>
      }
    >
      <p className="mb-6">
        <Link
          href={localePath(locale, "/employer/applications")}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-primary-dark transition-colors hover:border-primary/40"
        >
          <BackArrowIcon size={15} />
          {t("employer.backToApplicants")}
        </Link>
      </p>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Panel id="next-step" title={t("employer.moveTitle")}>
            {application.nextStatuses.length === 0 ? (
              <p className="rounded-2xl border border-line bg-canvas px-4 py-3.5 text-[14.5px] text-ink">
                {t("employer.finalState", { status: statusWord(application.status) })}
              </p>
            ) : (
              <>
                {forward.length > 0 ? (
                  <EmployerForm
                    action={move}
                    pendingLabel={t("account.working")}
                    buttons={forward.map((status) => ({ intent: status, label: t("employer.moveTo", { status: statusWord(status) }) }))}
                  >
                    <p className="max-w-[66ch] text-[14.5px] leading-relaxed text-body">{t("employer.moveLead")}</p>
                    <Field id="move-note" label={t("employer.noteToCandidate")} optional={t("employer.optional")} hint={t("employer.noteToCandidateHint")} className="mt-5">
                      <textarea
                        id="move-note"
                        name="note"
                        rows={3}
                        maxLength={NOTE_MAX}
                        dir="auto"
                        aria-describedby="move-note-hint"
                        className={textareaClasses("min-h-28")}
                      />
                    </Field>
                  </EmployerForm>
                ) : null}

                {canReject ? (
                  <details className={forward.length > 0 ? "mt-6 border-t border-line pt-5" : ""}>
                    <summary className="w-fit cursor-pointer py-1 text-[14px] font-semibold text-danger underline-offset-4 hover:underline">
                      {t("employer.reject")}
                    </summary>
                    <EmployerForm
                      action={move}
                      pendingLabel={t("account.working")}
                      buttons={[{ intent: "rejected", label: t("employer.rejectYes"), tone: "danger" }]}
                      className="mt-4 rounded-2xl border border-danger/25 bg-danger-05 p-4 sm:p-5"
                    >
                      <p className="text-[14px] leading-relaxed text-ink">{t("employer.rejectLead")}</p>
                      <Field id="reject-note" label={t("employer.rejectNote")} optional={t("employer.optional")} hint={t("employer.rejectNoteHint")} className="mt-4">
                        <textarea
                          id="reject-note"
                          name="note"
                          rows={3}
                          maxLength={NOTE_MAX}
                          dir="auto"
                          aria-describedby="reject-note-hint"
                          className={textareaClasses("min-h-28")}
                        />
                      </Field>
                    </EmployerForm>
                  </details>
                ) : null}
              </>
            )}
          </Panel>

          <Panel id="cover-letter" title={t("employer.coverLetter")}>
            <p
              dir="auto"
              className="relative rounded-2xl bg-canvas px-5 py-4 ps-6 text-[15.5px] leading-[1.85] whitespace-pre-line text-ink before:absolute before:inset-y-4 before:start-0 before:w-[3px] before:rounded-full before:bg-accent"
            >
              {application.coverLetter}
            </p>
          </Panel>

          <Panel id="application-details" title={t("employer.details")}>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-surface px-4 py-3.5">
                  <dt className="text-[12.5px] text-body">{fact.label}</dt>
                  <dd dir={fact.auto ? "auto" : undefined} className="mt-1 text-[15px] font-semibold text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
              <div className="bg-surface px-4 py-3.5">
                <dt className="text-[12.5px] text-body">{t("employer.filterJob")}</dt>
                <dd className="mt-1 text-[15px] font-semibold">
                  <Link
                    href={localePath(locale, `/employer/jobs/${application.job.id}`)}
                    dir="auto"
                    className="text-primary-dark underline-offset-4 hover:underline"
                  >
                    {application.job.title}
                  </Link>
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel
            id="private-notes"
            title={t("employer.privateNotes")}
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-deep px-3 py-1.5 text-[12px] leading-none font-semibold text-white">
                <span className="text-accent">
                  <LockIcon size={12} />
                </span>
                {t("employer.privateBadge")}
              </span>
            }
          >
            <ActionForm action={saveNote} submitLabel={t("employer.saveNote")} pendingLabel={t("account.working")} tone="quiet">
              <label htmlFor="employer-note" className="sr-only">
                {t("employer.privateNotes")}
              </label>
              <textarea
                id="employer-note"
                name="employerNote"
                rows={5}
                maxLength={2000}
                defaultValue={application.employerNote ?? ""}
                dir="auto"
                aria-describedby="employer-note-hint"
                className={textareaClasses("min-h-36")}
              />
              <p id="employer-note-hint" className={hintClasses}>
                {t("employer.privateNotesHint")}
              </p>
            </ActionForm>
          </Panel>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-6">
          <Panel id="candidate" title={t("employer.candidate")}>
            <div className="grid gap-4 text-[14.5px]">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15">
                  <MailIcon size={15} />
                </span>
                <dl className="min-w-0">
                  <dt className="text-[12.5px] text-body">{t("employer.email")}</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${application.candidate.email}`}
                      dir="ltr"
                      className="font-semibold break-all text-primary-dark underline-offset-4 hover:underline"
                    >
                      {application.candidate.email}
                    </a>
                  </dd>
                </dl>
              </div>
              {application.candidate.phone && phoneHref ? (
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15">
                    <PhoneIcon size={15} />
                  </span>
                  <dl className="min-w-0">
                    <dt className="text-[12.5px] text-body">{t("employer.phone")}</dt>
                    <dd className="mt-0.5">
                      <a href={phoneHref} dir="ltr" className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                        {application.candidate.phone}
                      </a>
                    </dd>
                  </dl>
                </div>
              ) : null}
            </div>

            {/* The live application's CV is nullable; with none there is nothing to download. */}
            {cv ? (
              <div className="mt-6 rounded-2xl border border-line bg-canvas p-4">
                <p className="text-[12.5px] text-body">{t("employer.cv")}</p>
                <p className="mt-1 text-[13px] break-all text-ink">
                  <span dir="ltr" className="font-semibold">
                    {cv.fileName}
                  </span>
                  <span className="text-body">{" · "}</span>
                  <span className="text-body">{t("employer.fileSize", { size: f.number(kilobytes) })}</span>
                </p>
                <a
                  href={`/api/employer/cv/${encodeURIComponent(application.id)}`}
                  download={cv.fileName}
                  className={buttonClasses({ className: "mt-4 w-full" })}
                >
                  <DownloadIcon size={15} />
                  {t("employer.downloadCv")}
                </a>
              </div>
            ) : null}
          </Panel>

          <Panel id="history" title={t("employer.history")}>
            <ol className="relative grid gap-5 ps-7 before:absolute before:inset-y-2 before:start-[7px] before:w-px before:bg-line">
              {[...application.history].reverse().map((step, index) => (
                <li key={`${step.status}-${step.at}`} className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -start-7 top-1 size-[15px] rounded-full ${
                      index === 0 ? "bg-primary ring-4 ring-primary-10" : "border-2 border-line bg-surface"
                    }`}
                  />
                  <p className="text-[14.5px] font-semibold text-ink">{statusWord(step.status)}</p>
                  <p className="mt-0.5 text-[12.5px] text-body">{`${byWhom[step.by]} · ${f.dateTime(step.at)}`}</p>
                  <p className="text-[12.5px] text-body/65">{ago(step.at, locale)}</p>
                </li>
              ))}
            </ol>
            {application.statusNote ? (
              <div className="mt-6 rounded-2xl border border-accent/40 bg-accent-10 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-ink">{t("employer.lastNote")}</p>
                <p dir="auto" className="mt-1 text-[14px] leading-relaxed text-ink">
                  {application.statusNote}
                </p>
              </div>
            ) : null}
            {application.withdrawReason ? (
              <div className="mt-4 rounded-2xl border border-line bg-canvas px-4 py-3">
                <p className="text-[12.5px] font-semibold text-ink">{t("employer.withdrawReason")}</p>
                <p dir="auto" className="mt-1 text-[14px] leading-relaxed text-ink">
                  {application.withdrawReason}
                </p>
              </div>
            ) : null}
          </Panel>
        </aside>
      </div>
    </EmployerShell>
  );
}
