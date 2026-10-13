import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { buttonClasses, Field, inputClasses, PageHero, Rosette, Section, textareaClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import {
  ammanToday,
  applicationErrors,
  careersService,
  CV_MAX_BYTES,
  type ApplicationInput,
} from "@/features/careers";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, fieldErrorsOf, isAppError } from "@/lib";

import { ActionForm, type FormState } from "../../../../_components/portal/action-form";
import { failed } from "../../../../_components/portal/form-state";
import { CoverLetterField } from "../../../_components/cover-letter-field";
import { CvField } from "../../../_components/cv-field";
import { EmployerMark } from "../../../_components/employer-mark";
import { closesLabel, salaryLabel } from "../../../_components/format";
import { CheckIcon } from "../../../_components/icons";
import { ApplicationStatusBadge } from "../../../_components/status-badge";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers/jobs/[slug]/apply">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const job = await careersService.getJobBySlug(slug, locale);
  return buildMetadata({
    locale,
    path: `/careers/jobs/${slug}/apply`,
    title: job ? t("careers.apply.metaTitle", { title: job.title }) : t("careers.board.metaTitle"),
    noIndex: true,
  });
}

/** What a CV may be named; the service still decides from the file's bytes. */
const CV_NAME = /\.(pdf|docx?)$/i;
const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * APPLYING FOR A JOB — for a signed-in CUSTOMER only; anyone else is sent to
 * sign in (and brought back here) or to their own area.
 *
 * The form is server markup inside the shared `ActionForm`, so it posts before
 * any JavaScript has loaded and keeps its values when something is refused.
 * The only client leaves are the CV picker (so its words are the page's, not
 * the browser's) and the cover letter's character count.
 *
 * The action checks the obvious things first, in the reader's language — the
 * CV's type and size, and every rule in `applicationErrors` — and only then
 * uploads the CV and applies. A 409 from the service (already applied, or the
 * job closed in the meantime) is told apart by asking whether this person now
 * has a live application to it, and answered in their language too.
 */
export default async function ApplyPage({ params }: PageProps<"/[locale]/careers/jobs/[slug]/apply">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const path = `/careers/jobs/${slug}/apply`;
  const account = await requireAccount(locale, "customer", path);
  const t = getTranslator(locale);
  const f = getFormatters(locale);

  const job = await careersService.getJobBySlug(slug, locale);
  if (!job) notFound();
  const existing = await careersService.findMyApplication(account.customerId!, job.id, locale);
  const jobHref = localePath(locale, `/careers/jobs/${job.slug}`);

  const jobId = job.id;
  const jobSlug = job.slug;
  /* Resolved here: an inline action may only close over plain values. */
  const copy = {
    fallback: t("state.errorTitle"),
    fix: t("account.fixFields"),
    already: t("careers.apply.errorAlreadyApplied"),
    closed: t("careers.apply.errorClosed"),
    cvSize: t("careers.apply.errorCvSize"),
    fields: {
      cv: t("careers.apply.errorCvType"),
      coverLetter: t("careers.apply.errorCoverLetter"),
      yearsExperience: t("careers.apply.errorYears"),
      certifications: t("careers.apply.errorCertifications"),
      availableFrom: t("careers.apply.errorAvailableFrom"),
      expectedSalary: t("careers.apply.errorSalary"),
    } as Record<string, string>,
    cvMissing: t("careers.apply.errorCv"),
  };

  async function apply(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    /* An action is a public endpoint: who is applying is read again here,
       from the session, never from the form. */
    const me = await requireAccount(locale, "customer", path);
    const customerId = me.customerId!;

    const text = (key: string) => String(formData.get(key) ?? "").trim();
    const file = formData.get("cv");
    const cv = file instanceof File && file.size > 0 ? file : null;

    const yearsRaw = text("yearsExperience");
    const salaryRaw = text("expectedSalary").replace(",", ".");
    const salaryDinars = salaryRaw ? Number(salaryRaw) : undefined;
    const input: Omit<ApplicationInput, "cvId"> = {
      jobId,
      coverLetter: text("coverLetter"),
      yearsExperience: yearsRaw === "" ? Number.NaN : Number(yearsRaw),
      certifications: text("certifications") || undefined,
      availableFrom: text("availableFrom") || undefined,
      expectedSalary:
        salaryDinars === undefined
          ? undefined
          : { amount: Number.isFinite(salaryDinars) ? Math.round(salaryDinars * 1000) : Number.NaN, currency: "JOD" },
    };

    const fieldErrors: Record<string, string> = {};
    if (!cv) fieldErrors.cv = copy.cvMissing;
    else if (cv.size > CV_MAX_BYTES) fieldErrors.cv = copy.cvSize;
    else if (!CV_NAME.test(cv.name) && !CV_TYPES.includes(cv.type)) fieldErrors.cv = copy.fields.cv;
    for (const key of Object.keys(applicationErrors({ ...input, cvId: cv ? "pending" : "" }))) {
      fieldErrors[key] ??= copy.fields[key] ?? copy.fix;
    }
    if (Object.keys(fieldErrors).length > 0) return { status: "error", message: copy.fix, fieldErrors };

    let reference: string;
    try {
      const stored = await careersService.uploadCv(customerId, cv!);
      const application = await careersService.apply(customerId, { ...input, cvId: stored.id }, locale);
      reference = application.reference;
    } catch (error) {
      if (isAppError(error) && error.code === "conflict") {
        const live = await careersService.findMyApplication(customerId, jobId, locale).catch(() => null);
        return { status: "error", message: live ? copy.already : copy.closed };
      }
      if (isAppError(error) && error.code === "validation") {
        const translated = Object.fromEntries(
          Object.keys(fieldErrorsOf(error)).map((key) => [key, copy.fields[key] ?? copy.fix]),
        );
        return { status: "error", message: copy.fix, fieldErrors: translated };
      }
      return failed(error, copy.fallback);
    }

    revalidatePath(localePath(locale, "/account/applications"));
    revalidatePath(localePath(locale, `/careers/jobs/${jobSlug}`));
    redirect(`${localePath(locale, "/account/applications")}?applied=${encodeURIComponent(reference)}`);
  }

  const salary = salaryLabel(job.salary, t, f);
  const summary = [
    `${t(`careers.type.${job.employmentType}`)} · ${t(`careers.mode.${job.workMode}`)}`,
    t(`careers.level.${job.experienceLevel}`),
    salary ?? t("careers.card.salaryHidden"),
    closesLabel(job.closesOn, t, f),
  ];
  const steps = [t("careers.apply.next1"), t("careers.apply.next2"), t("careers.apply.next3")];
  const optional = <span className="font-normal text-body/70">{t("booking.goalOptional")}</span>;

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("nav.careers"), href: localePath(locale, "/careers") },
          { label: job.title, href: jobHref },
          { label: t("careers.apply.eyebrow") },
        ]}
        eyebrow={t("careers.apply.eyebrow")}
        title={<span dir="auto">{job.title}</span>}
        lead={
          <p className="flex flex-wrap items-center gap-x-3">
            <span dir="auto" className="font-semibold text-white/90">
              {job.employer.name}
            </span>
            {job.city ? (
              <>
                <span aria-hidden="true" className="text-white/35">
                  ·
                </span>
                <span>{job.city.name}</span>
              </>
            ) : null}
          </p>
        }
      />

      <Section labelledBy="apply-form-heading">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
            <h2 id="apply-form-heading" className="text-[1.6rem] leading-tight sm:text-[1.85rem]">
              {t("careers.apply.formTitle")}
            </h2>

            {existing ? (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary-05 px-5 py-5">
                <p className="font-heading text-[1.05rem] font-semibold text-primary-dark">{t("careers.job.appliedTitle")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <ApplicationStatusBadge status={existing.status} t={t} />
                  <span className="text-[13px] text-body">{t("careers.job.appliedOn", { date: f.date(existing.submittedAt) })}</span>
                </div>
                <Link href={localePath(locale, "/account/applications")} className={buttonClasses({ className: "mt-5" })}>
                  {t("careers.job.appliedLink")}
                </Link>
              </div>
            ) : !job.acceptingApplications ? (
              <div className="mt-6 rounded-2xl border border-line bg-canvas px-5 py-5">
                <p className="font-heading text-[1.05rem] font-semibold text-ink">{t("careers.job.closedTitle")}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-body">{t("careers.job.closedBody")}</p>
                <Link href={localePath(locale, "/careers")} className={buttonClasses({ className: "mt-5" })}>
                  {t("careers.job.browse")}
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{t("careers.apply.lead")}</p>
                <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-canvas px-4 py-3 text-[13.5px] text-body">
                  <span>{t("careers.apply.applyingAs")}</span>
                  <span dir="auto" className="font-semibold text-ink">
                    {account.name}
                  </span>
                  <span aria-hidden="true" className="text-body/40">
                    ·
                  </span>
                  <span dir="ltr">{account.email}</span>
                </p>

                <ActionForm
                  action={apply}
                  submitLabel={t("careers.apply.submit")}
                  pendingLabel={t("careers.apply.sending")}
                  className="mt-8 [&>button]:mt-8"
                  submitSize="lg" submitClassName="w-full"
                >
                  <div className="space-y-6">
                    <CvField
                      id="apply-cv"
                      name="cv"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      label={t("careers.apply.cv")}
                      hint={t("careers.apply.cvHint")}
                      choose={t("careers.apply.cvChoose")}
                      change={t("careers.apply.cvChange")}
                      none={t("careers.apply.cvNone")}
                    />

                    <CoverLetterField
                      id="apply-cover"
                      name="coverLetter"
                      label={t("careers.apply.coverLetter")}
                      hint={t("careers.apply.coverLetterHint")}
                      min={30}
                      max={3000}
                      className={textareaClasses("min-h-48")}
                    />

                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label={t("careers.apply.years")} htmlFor="apply-years">
                        <input
                          id="apply-years"
                          name="yearsExperience"
                          type="number"
                          inputMode="numeric"
                          required
                          min={0}
                          max={50}
                          step={1}
                          dir="ltr"
                          className={inputClasses()}
                        />
                      </Field>
                      <Field
                        label={
                          <>
                            {t("careers.apply.availableFrom")} {optional}
                          </>
                        }
                        htmlFor="apply-available"
                      >
                        <input
                          id="apply-available"
                          name="availableFrom"
                          type="date"
                          min={ammanToday()}
                          dir="ltr"
                          className={inputClasses()}
                        />
                      </Field>
                    </div>

                    <Field
                      label={
                        <>
                          {t("careers.apply.certifications")} {optional}
                        </>
                      }
                      htmlFor="apply-certifications"
                      hint={t("careers.apply.certificationsHint")}
                    >
                      <textarea
                        id="apply-certifications"
                        name="certifications"
                        rows={2}
                        maxLength={500}
                        dir="auto"
                        aria-describedby="apply-certifications-hint"
                        className={textareaClasses("min-h-24")}
                      />
                    </Field>

                    <Field
                      label={
                        <>
                          {t("careers.apply.expectedSalary")} {optional}
                        </>
                      }
                      htmlFor="apply-salary"
                      className="sm:max-w-[calc(50%-0.75rem)]"
                    >
                      <input
                        id="apply-salary"
                        name="expectedSalary"
                        type="number"
                        inputMode="decimal"
                        min={1}
                        step="any"
                        dir="ltr"
                        className={inputClasses()}
                      />
                    </Field>
                  </div>
                </ActionForm>
              </>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <EmployerMark name={job.employer.name} logo={job.employer.logo} size="md" />
                <div className="min-w-0">
                  <p className="font-heading text-[15px] leading-snug font-semibold text-ink">
                    <span dir="auto">{job.title}</span>
                  </p>
                  <p className="mt-1 text-[13px] text-body/80">
                    <span dir="auto">{job.employer.name}</span>
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 border-t border-line pt-4 text-[13.5px] text-body">
                {summary.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="mt-1 text-primary">
                      <CheckIcon size={12} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <Link href={jobHref} className={buttonClasses({ variant: "outline", size: "sm", className: "mt-5" })}>
                {t("careers.apply.backToJob")}
              </Link>
            </div>

            {/* What happens next, on the deep panel: three numbered seals,
                because it is a sequence the candidate can follow. */}
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-deep p-7 text-white/75 sm:p-8">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
              <span aria-hidden="true" className="absolute -end-32 -bottom-36 -z-10 size-72 text-accent/[0.12]">
                <Rosette className="spin-slow size-full" />
              </span>
              <h2 className="text-[1.3rem] leading-snug text-white">{t("careers.apply.nextTitle")}</h2>
              <ol className="mt-6 space-y-5">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span
                      dir="ltr"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[14px] font-bold text-accent ring-1 ring-accent/50 ring-offset-2 ring-offset-deep"
                    >
                      {f.number(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-2 text-[14.5px] leading-relaxed text-white/75">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
