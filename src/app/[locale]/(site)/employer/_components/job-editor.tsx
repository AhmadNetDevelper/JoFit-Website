import Link from "next/link";
import { redirect } from "next/navigation";

import { inputClasses, Rosette, selectClasses, textareaClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import {
  careersService,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_LANGUAGES,
  jobDraftErrors,
  WORK_MODES,
  type EmployerJob,
  type EmploymentType,
  type ExperienceLevel,
  type JobCity,
  type JobDraft,
  type JobLanguage,
  type SalaryPeriod,
  type WorkMode,
} from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { sportsService } from "@/features/sports";
import { getTranslator, localePath, type Locale } from "@/i18n";
import { toMajorUnits } from "@/lib";
import type { Money } from "@/types";

import type { FormState } from "../../_components/portal/action-form";
import { succeeded } from "../../_components/portal/form-state";
import { Panel } from "../../_components/portal/portal-shell";
import { EmployerForm, type FormButton } from "./employer-form";
import { Choices, Field, Switch } from "./fields";
import { AlertIcon, BackArrowIcon } from "./icons";
import { JobActions } from "./job-actions";
import { LineList } from "./line-list";
import { refreshEmployerArea, withNotice } from "./navigation";
import { draftErrorsIn, refused } from "./refusals";
import { JobStatusChip } from "./status-chip";

const LIST_MAX = 15;

/** A JOD amount typed in dinars → minor units. Arabic-Indic digits and a decimal comma are read too. */
function jod(value: FormDataEntryValue | null): Money | undefined {
  const raw = (typeof value === "string" ? value : "")
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[٫,]/g, ".");
  if (!raw) return undefined;
  const dinars = Number(raw);
  return { amount: Number.isFinite(dinars) ? Math.round(dinars * 1000) : Number.NaN, currency: "JOD" };
}

/** The posted form, as the `JobDraft` the service takes. Blank list lines are dropped. */
function readDraft(formData: FormData): JobDraft {
  const text = (name: string) => String(formData.get(name) ?? "");
  const lines = (name: string) =>
    formData
      .getAll(name)
      .map((line) => String(line).trim())
      .filter(Boolean);
  const min = jod(formData.get("salary.min"));
  const max = jod(formData.get("salary.max"));
  const positions = text("positions").trim();
  return {
    title: text("title"),
    categoryId: text("categoryId"),
    sportIds: formData.getAll("sportIds").map(String),
    cityId: text("cityId") as JobCity,
    workMode: text("workMode") as WorkMode,
    employmentType: text("employmentType") as EmploymentType,
    experienceLevel: text("experienceLevel") as ExperienceLevel,
    salary: min || max ? { min, max, period: (text("salary.period") || "month") as SalaryPeriod } : undefined,
    showSalary: formData.get("showSalary") === "1",
    description: text("description"),
    requirements: lines("requirements"),
    benefits: lines("benefits"),
    languages: formData.getAll("languages").map(String) as JobLanguage[],
    positions: positions ? Number(positions) : Number.NaN,
    closesOn: text("closesOn") || undefined,
  };
}

/** A stored amount back in dinars for the input, without trailing zeros. */
const dinars = (money: Money | undefined) => (money ? String(toMajorUnits(money)) : "");

/**
 * THE JOB EDITOR — writing a new job and changing an existing one.
 *
 * Five panels in the order an employer thinks about a vacancy: what it is,
 * the terms, the pay, the description, then the lists. What is chosen from a
 * list (category, city, contract…) is an id, shown in the reader's language;
 * what is written (title, description, lines) is stored as written and drawn
 * with `dir="auto"`.
 *
 * `jobDraftErrors` runs first so the refusals read in the reader's language;
 * the service still decides. A new job leaves with "Save draft" or "Submit
 * for review"; an existing one with "Save" — which, on an OPEN job, takes it
 * off the board and back to review, and the page says so before and after.
 */
export async function JobEditor({
  locale,
  job,
  blocked,
  path,
}: {
  locale: Locale;
  job?: EmployerJob;
  blocked: boolean;
  /** This page, without the locale — where sign-in brings the person back to. */
  path: string;
}) {
  const t = getTranslator(locale);
  const [categories, sports, cities] = await Promise.all([
    careersService.listCategories(locale),
    sportsService.list({ locale }),
    careersService.listCities(locale),
  ]);
  const jobId = job?.id;
  const optional = t("employer.optional");

  async function save(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", path);
    const tr = getTranslator(locale);
    const employerId = account.employerId!;
    const draft = readDraft(formData);
    const [knownCategories, knownSports] = await Promise.all([
      careersService.listCategories(locale),
      sportsService.list({ locale }),
    ]);
    const errors = jobDraftErrors(draft, {
      categoryIds: knownCategories.map((category) => category.id),
      sportIds: knownSports.map((sport) => sport.id),
    });
    if (Object.keys(errors).length > 0) {
      return { status: "error", message: tr("account.fixFields"), fieldErrors: draftErrorsIn(tr, errors, draft) };
    }

    if (jobId) {
      let wasOpen = false;
      try {
        wasOpen = (await employerPortalService.getJob(employerId, jobId))?.status === "open";
        await employerPortalService.updateJob(employerId, jobId, draft);
      } catch (error) {
        return refused(tr, "updateJob", error);
      }
      refreshEmployerArea(locale, `/employer/jobs/${jobId}`);
      return succeeded(tr(wasOpen ? "jobForm.savedBackToReview" : "jobForm.saved"));
    }

    const submit = formData.get("intent") === "submit";
    let created: EmployerJob;
    try {
      created = await employerPortalService.createJob(employerId, draft, submit);
    } catch (error) {
      return refused(tr, "createJob", error);
    }
    refreshEmployerArea(locale);
    redirect(localePath(locale, withNotice("/employer/jobs", created.status === "pending" ? "submitted" : "draft", created.reference)));
  }

  const buttons: readonly FormButton[] = job
    ? [{ intent: "save", label: t("jobForm.save") }]
    : blocked
      ? [{ intent: "draft", label: t("jobForm.saveDraft") }]
      : [
          { intent: "submit", label: t("jobForm.submit") },
          { intent: "draft", label: t("jobForm.saveDraft"), tone: "quiet" },
        ];

  const label = {
    title: t("jobForm.title"),
    categoryId: t("jobForm.category"),
    sportIds: t("jobForm.sports"),
    cityId: t("jobForm.city"),
    employmentType: t("jobForm.type"),
    workMode: t("jobForm.mode"),
    experienceLevel: t("jobForm.level"),
    positions: t("jobForm.positions"),
    closesOn: t("jobForm.closesOn"),
    languages: t("jobForm.languages"),
    "salary.min": t("jobForm.salaryMin"),
    "salary.max": t("jobForm.salaryMax"),
    "salary.period": t("jobForm.period"),
    showSalary: t("jobForm.showSalary"),
    description: t("jobForm.descriptionLabel"),
    requirements: t("jobForm.requirements"),
    benefits: t("jobForm.benefits"),
  };
  const ids: Record<keyof typeof label, string> = {
    title: "job-title",
    categoryId: "job-category",
    sportIds: "job-sports",
    cityId: "job-city",
    employmentType: "job-type",
    workMode: "job-mode",
    experienceLevel: "job-level",
    positions: "job-positions",
    closesOn: "job-closes",
    languages: "job-languages",
    "salary.min": "job-salary-min",
    "salary.max": "job-salary-max",
    "salary.period": "job-period",
    showSalary: "job-show-salary",
    description: "job-description",
    requirements: "job-requirements",
    benefits: "job-benefits",
  };
  const fields = Object.fromEntries(
    (Object.keys(label) as (keyof typeof label)[]).map((name) => [name, { label: label[name], id: ids[name] }]),
  );

  const lineCopy = {
    max: LIST_MAX,
    lineLabel: t("jobForm.lineLabel"),
    addLabel: t("jobForm.addLine"),
    removeLabel: t("jobForm.removeLine"),
  };
  const statusBody = job
    ? t(
        job.status === "draft"
          ? "jobForm.statusDraft"
          : job.status === "pending"
            ? "jobForm.statusPending"
            : job.status === "open"
              ? "jobForm.statusOpen"
              : job.status === "closed"
                ? "jobForm.statusClosed"
                : "jobForm.statusRejected",
      )
    : "";

  return (
    <>
      <p className="mb-6">
        <Link
          href={localePath(locale, "/employer/jobs")}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-primary-dark transition-colors hover:border-primary/40"
        >
          <BackArrowIcon size={15} />
          {t("jobForm.backToJobs")}
        </Link>
      </p>

      {job?.status === "open" ? (
        <section aria-labelledby="open-warning" className="mb-8 flex items-start gap-4 rounded-3xl border border-accent/40 bg-accent-10 p-5 sm:p-6">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-accent-strong ring-1 ring-accent/40">
            <AlertIcon size={17} />
          </span>
          <div className="min-w-0">
            <h2 id="open-warning" className="text-[1.05rem] leading-snug text-ink">
              {t("jobForm.openWarningTitle")}
            </h2>
            <p className="mt-1.5 max-w-[76ch] text-[14.5px] leading-relaxed text-body">{t("jobForm.openWarning")}</p>
          </div>
        </section>
      ) : null}
      {job?.status === "rejected" ? (
        <section aria-labelledby="moderation-note" className="mb-8 flex items-start gap-4 rounded-3xl border border-danger/25 bg-danger-05 p-5 sm:p-6">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-danger ring-1 ring-danger/25">
            <AlertIcon size={17} />
          </span>
          <div className="min-w-0">
            <h2 id="moderation-note" className="text-[1.05rem] leading-snug text-danger">
              {t("jobForm.rejectedTitle")}
            </h2>
            {job.moderationNote ? (
              <blockquote
                className="mt-3 max-w-[76ch] rounded-2xl bg-surface px-4 py-3 text-[15px] leading-relaxed font-medium text-ink ring-1 ring-danger/15"
                dir="auto"
              >
                {job.moderationNote}
              </blockquote>
            ) : null}
            <p className="mt-3 text-[14px] text-body">{t("jobForm.rejectedBody")}</p>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6">
        {/* Where this job stands (or, for a new one, how it goes live) comes
            first: the form below is long, and the moves open to the job are
            what an employer opens this page to find. */}
        <aside className="min-w-0">
          {job ? (
            <Panel id="job-status" title={t("jobForm.statusTitle")} action={<JobStatusChip t={t} status={job.status} />}>
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
                <p className="max-w-[62ch] text-[14px] leading-relaxed text-body">{statusBody}</p>
                <dl className="rounded-2xl border border-line bg-canvas px-4 py-3 text-[14px]">
                  <dt className="text-[12.5px] text-body">{t("employer.factApplicants")}</dt>
                  <dd className="mt-0.5">
                    <Link
                      href={localePath(locale, `/employer/applications?job=${encodeURIComponent(job.id)}`)}
                      className="font-semibold text-primary-dark underline-offset-4 hover:underline"
                    >
                      {t("employer.applicantsNewOfTotal", { new: job.newApplicationCount, total: job.applicationCount })}
                    </Link>
                  </dd>
                </dl>
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <JobActions
                  job={job}
                  locale={locale}
                  returnTo={`/employer/jobs/${job.id}`}
                  blocked={blocked}
                  previewHref={job.status === "open" ? localePath(locale, `/careers/jobs/${job.slug}`) : undefined}
                />
              </div>
            </Panel>
          ) : (
            <section
              aria-labelledby="how-it-goes-live"
              className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-8"
            >
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
              <span aria-hidden="true" className="absolute -end-20 -top-24 -z-10 size-64 text-accent/16">
                <Rosette className="spin-slow size-full" />
              </span>
              <h2 id="how-it-goes-live" className="text-[1.25rem] leading-snug text-white">
                {t("jobForm.howTitle")}
              </h2>
              <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent/70" />
              <ol className="mt-7 grid gap-5 sm:grid-cols-3 sm:gap-6">
                {[t("jobForm.how1"), t("jobForm.how2"), t("jobForm.how3")].map((step, index) => (
                  <li key={step} className="flex items-start gap-4 sm:flex-col">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[15px] font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-deep"
                    >
                      <span dir="ltr">{index + 1}</span>
                    </span>
                    <span className="pt-2 text-[14px] leading-relaxed text-white/80 sm:pt-0">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
        <EmployerForm
          action={save}
          buttons={buttons}
          pendingLabel={t("account.working")}
          fields={fields}
          fixLabel={t("jobForm.fixBelow")}
          noValidate
          footnote={
            job?.status === "open" ? (
              <span className="text-[13.5px] font-medium text-ink">{t("jobForm.openWarningShort")}</span>
            ) : !job && blocked ? (
              <span className="text-[13.5px] text-body">{t("employer.blockedNote")}</span>
            ) : null
          }
          className="grid min-w-0 grid-cols-1 gap-6"
        >
          <Panel id="job-basics" title={t("jobForm.basics")}>
            <div className="grid gap-5">
              <Field id={ids.title} label={label.title} hint={t("jobForm.titleHint")}>
                <input
                  id={ids.title}
                  name="title"
                  defaultValue={job?.title}
                  required
                  minLength={5}
                  maxLength={120}
                  dir="auto"
                  aria-describedby={`${ids.title}-hint`}
                  className={inputClasses()}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={ids.categoryId} label={label.categoryId}>
                  <select id={ids.categoryId} name="categoryId" defaultValue={job?.categoryId ?? ""} required className={selectClasses()}>
                    <option value="" disabled>
                      {t("jobForm.choose")}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={ids.cityId} label={label.cityId}>
                  <select id={ids.cityId} name="cityId" defaultValue={job?.cityId ?? ""} required className={selectClasses()}>
                    <option value="" disabled>
                      {t("jobForm.choose")}
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Choices
                legend={label.sportIds}
                name="sportIds"
                type="checkbox"
                firstId={ids.sportIds}
                optional={optional}
                hint={t("jobForm.sportsHint")}
                options={sports.map((sport) => ({ value: sport.id, label: sport.name }))}
                selected={job?.sportIds ?? []}
              />
            </div>
          </Panel>

          <Panel id="job-contract" title={t("jobForm.contract")}>
            <div className="grid gap-6">
              <Choices
                legend={label.employmentType}
                name="employmentType"
                type="radio"
                firstId={ids.employmentType}
                options={EMPLOYMENT_TYPES.map((value) => ({ value, label: t(`careers.type.${value}`) }))}
                selected={[job?.employmentType ?? "full-time"]}
              />
              <Choices
                legend={label.workMode}
                name="workMode"
                type="radio"
                firstId={ids.workMode}
                options={WORK_MODES.map((value) => ({ value, label: t(`careers.mode.${value}`) }))}
                selected={[job?.workMode ?? "on-site"]}
              />
              <Choices
                legend={label.experienceLevel}
                name="experienceLevel"
                type="radio"
                firstId={ids.experienceLevel}
                options={EXPERIENCE_LEVELS.map((value) => ({ value, label: t(`careers.level.${value}`) }))}
                selected={[job?.experienceLevel ?? "mid"]}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={ids.positions} label={label.positions} hint={t("jobForm.positionsHint")}>
                  <input
                    id={ids.positions}
                    name="positions"
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    defaultValue={job?.positions ?? 1}
                    required
                    dir="ltr"
                    className={inputClasses("text-start")}
                  />
                </Field>
                <Field id={ids.closesOn} label={label.closesOn} optional={optional} hint={t("jobForm.closesOnHint")}>
                  <input
                    id={ids.closesOn}
                    name="closesOn"
                    type="date"
                    defaultValue={job?.closesOn ?? ""}
                    dir="ltr"
                    className={inputClasses("text-start")}
                  />
                </Field>
              </div>
              <Choices
                legend={label.languages}
                name="languages"
                type="checkbox"
                firstId={ids.languages}
                options={JOB_LANGUAGES.map((value) => ({ value, label: t(`careers.lang.${value}`) }))}
                selected={job?.languages ?? [locale]}
              />
            </div>
          </Panel>

          <Panel id="job-pay" title={t("jobForm.pay")} lead={t("jobForm.payLead")}>
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={ids["salary.min"]} label={label["salary.min"]}>
                  <input
                    id={ids["salary.min"]}
                    name="salary.min"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    defaultValue={dinars(job?.salary?.min)}
                    dir="ltr"
                    className={inputClasses("text-start")}
                  />
                </Field>
                <Field id={ids["salary.max"]} label={label["salary.max"]}>
                  <input
                    id={ids["salary.max"]}
                    name="salary.max"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    defaultValue={dinars(job?.salary?.max)}
                    dir="ltr"
                    className={inputClasses("text-start")}
                  />
                </Field>
              </div>
              <Choices
                legend={label["salary.period"]}
                name="salary.period"
                type="radio"
                firstId={ids["salary.period"]}
                options={[
                  { value: "month", label: t("jobForm.perMonth") },
                  { value: "hour", label: t("jobForm.perHour") },
                ]}
                selected={[job?.salary?.period ?? "month"]}
              />
              <Switch
                id={ids.showSalary}
                name="showSalary"
                label={label.showSalary}
                hint={t("jobForm.showSalaryHint")}
                checked={job?.showSalary ?? false}
              />
            </div>
          </Panel>

          <Panel id="job-description-panel" title={t("jobForm.description")}>
            <Field id={ids.description} label={label.description} hint={t("jobForm.descriptionHint")}>
              <textarea
                id={ids.description}
                name="description"
                defaultValue={job?.description}
                required
                minLength={50}
                maxLength={5000}
                rows={9}
                dir="auto"
                aria-describedby={`${ids.description}-hint`}
                className={textareaClasses("min-h-56")}
              />
            </Field>
          </Panel>

          <Panel id="job-lists" title={t("jobForm.lists")} lead={t("jobForm.listHint")}>
            <div className="grid gap-8 md:grid-cols-2">
              <fieldset className="min-w-0">
                <legend className="mb-3 text-[14px] font-semibold text-ink">{label.requirements}</legend>
                <LineList
                  name="requirements"
                  id={ids.requirements}
                  initial={job?.requirements ?? []}
                  listLabel={label.requirements}
                  {...lineCopy}
                />
              </fieldset>
              <fieldset className="min-w-0">
                <legend className="mb-3 text-[14px] font-semibold text-ink">{label.benefits}</legend>
                <LineList name="benefits" id={ids.benefits} initial={job?.benefits ?? []} listLabel={label.benefits} {...lineCopy} />
              </fieldset>
            </div>
          </Panel>
        </EmployerForm>
      </div>
    </>
  );
}
