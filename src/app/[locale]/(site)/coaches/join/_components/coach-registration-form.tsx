"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";

import { buttonClasses, Field, inputClasses, selectClasses, textareaClasses } from "@/components/ui";
import {
  COACH_REGISTRATION_LIMITS as LIMITS,
  type CoachRegistrationOptions,
  type RegistrationOption,
} from "@/features/coach-registration";
import type { Locale } from "@/i18n";

import { IDLE, type FormState } from "../../../_components/portal/action-form";
import { PasswordField } from "../../../_components/portal/password-field";
import { FilePicker } from "../../../employer/_components/file-picker";
import type { FormCopy } from "../form-copy";
import { parseCoachForm, type ErrorMessages } from "../parse-form";

interface DatedRow {
  readonly key: string;
  readonly start: string;
  /** "Until now": the end date is disabled and cleared. */
  readonly current: boolean;
}

interface SkillRow {
  readonly key: string;
  readonly skillId: string;
  readonly level: string;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));

const idOf = (name: string) => `cj-${name.replace(/\./g, "-")}`;

/**
 * THE COACH REGISTRATION FORM — Mudarrib's structure, without its faults
 * (`docs/mudarrib-coach-registration.md` §4 and §6):
 *
 * - rows are added and removed in the browser and the whole form is sent
 *   once, so no round trip loses a chosen file;
 * - the city list follows the country without reloading the page;
 * - "until now" disables and clears the end date, and an end date before its
 *   start is refused, here and on the server;
 * - every field has its own message in the page's language, beside it, and
 *   the API's own messages land on the same fields;
 * - a real password box, labelled inputs, a consent box and a honeypot.
 *
 * Everything is one `<form>`: the fields stay uncontrolled except where the
 * page reacts to them (the dates that bound each other, "until now", the
 * chosen skills, the country), so the values survive a refused submission.
 */
export function CoachRegistrationForm({
  locale,
  options,
  dialCodes,
  copy,
  messages,
  action,
  loadCities,
  termsHref,
  privacyHref,
  signInHref,
  homeHref,
}: {
  locale: Locale;
  options: CoachRegistrationOptions;
  dialCodes: readonly { readonly code: string; readonly label: string }[];
  copy: FormCopy;
  messages: ErrorMessages;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  loadCities: (countryId: string) => Promise<readonly RegistrationOption[]>;
  termsHref: string;
  privacyHref: string;
  signInHref: string;
  homeHref: string;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  /* The browser's own check of the last attempt; `null` once it passed and the server answers. */
  const [local, setLocal] = useState<FormState | null>(null);
  /* Fields edited since the last attempt: their message is stale, so it is hidden. */
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const focusError = useRef(false);

  const counter = useRef(0);
  const nextKey = () => `r${++counter.current}`;
  const [educations, setEducations] = useState<readonly DatedRow[]>([]);
  const [certificates, setCertificates] = useState<readonly DatedRow[]>([]);
  const [experiences, setExperiences] = useState<readonly DatedRow[]>([]);
  const [skills, setSkills] = useState<readonly SkillRow[]>([]);

  const [countryId, setCountryId] = useState("");
  const [cities, setCities] = useState<readonly RegistrationOption[]>([]);
  const [citiesPending, startCities] = useTransition();
  const latestCountry = useRef("");

  const [photo, setPhoto] = useState<string>();
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => (photo ? URL.revokeObjectURL(photo) : undefined), [photo]);

  /* The send button wakes once every required box is filled (the browser's own validity, kept out of sight by `noValidate`). */
  const [ready, setReady] = useState(false);
  const checkReady = () => {
    const form = formRef.current;
    const picked = (name: string) => form?.querySelector(`input[name="${name}"]:checked`) !== null;
    setReady(Boolean(form?.checkValidity()) && picked("sportIds") && picked("languages"));
  };
  /* Rows added or removed and the city list loading change what is required, without an input event. */
  useEffect(checkReady, [educations, certificates, experiences, skills, countryId, cities, citiesPending]);

  const shown = local ?? state;
  const errors = shown.status === "error" ? (shown.fieldErrors ?? {}) : {};

  /* After an attempt is refused, take the reader to the first field to fix. */
  useEffect(() => {
    if (!focusError.current) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!invalid && shown.status !== "error") return;
    focusError.current = false;
    (invalid ?? formRef.current?.querySelector<HTMLElement>("[data-form-summary]"))?.focus();
    invalid?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [shown]);

  if (state.status === "ok" && !local) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-7 text-center shadow-soft sm:p-10">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/20"
        >
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
            <path d="m3 8.4 3.4 3.3L13 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-6 text-[1.6rem] leading-tight sm:text-[1.85rem]" tabIndex={-1} ref={(node) => node?.focus()}>
          {copy.successTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-[15px] leading-relaxed text-body">{copy.successBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={signInHref} className={buttonClasses({ variant: "primary", size: "lg" })}>
            {copy.successSignIn}
          </Link>
          <Link href={homeHref} className={buttonClasses({ variant: "outline", size: "lg" })}>
            {copy.successHome}
          </Link>
        </div>
      </div>
    );
  }

  /* ── field helpers: plain functions returning markup, never components, so inputs keep their values ── */

  const errorOf = (name: string) => (edited.has(name) ? undefined : errors[name]);

  const a11y = (name: string, hasHint = false) => {
    const id = idOf(name);
    const error = errorOf(name);
    return {
      id,
      name,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": [hasHint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined,
    };
  };

  const labelFor = (label: string, required: boolean): ReactNode =>
    required ? (
      label
    ) : (
      <>
        {label} <span className="font-normal text-body/60">{copy.optional}</span>
      </>
    );

  const textField = (
    name: string,
    label: string,
    {
      required = false,
      type = "text",
      autoComplete,
      dir = "auto",
      maxLength,
      hint,
      className,
      placeholder,
    }: {
      required?: boolean;
      type?: "text" | "email" | "url";
      autoComplete?: string;
      dir?: "auto" | "ltr";
      maxLength?: number;
      hint?: string;
      className?: string;
      placeholder?: string;
    } = {},
  ) => (
    <Field label={labelFor(label, required)} htmlFor={idOf(name)} required={required} hint={hint} error={errorOf(name)} className={className}>
      <input
        {...a11y(name, Boolean(hint))}
        type={type}
        required={required}
        autoComplete={autoComplete ?? "off"}
        dir={dir}
        maxLength={maxLength}
        placeholder={placeholder}
        className={inputClasses()}
      />
    </Field>
  );

  const selectField = (
    name: string,
    label: string,
    choices: readonly RegistrationOption[],
    { required = false, className }: { required?: boolean; className?: string } = {},
  ) => (
    <Field label={labelFor(label, required)} htmlFor={idOf(name)} required={required} error={errorOf(name)} className={className}>
      <select {...a11y(name)} required={required} defaultValue="" className={selectClasses()}>
        <option value="">{copy.choose}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.name}
          </option>
        ))}
      </select>
    </Field>
  );

  /** A required "pick at least one" group of checkboxes, which the browser's own validity does not cover. */
  const choiceGroup = (
    name: string,
    label: string,
    choices: readonly { value: string; label: string }[],
    hint?: string,
    className?: string,
  ) => (
    <fieldset className={className} aria-invalid={errorOf(name) ? true : undefined}>
      <legend className="mb-2 block text-[14px] font-semibold text-ink">
        {label}
        <span aria-hidden="true" className="ms-1 text-danger">
          *
        </span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {choices.map((choice) => (
          <label key={choice.value} className="cursor-pointer">
            <input type="checkbox" name={name} value={choice.value} className="peer sr-only" />
            <span className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-5 text-[14px] font-semibold text-ink transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:border-primary/50">
              {choice.label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="mt-1.5 text-[13px] leading-snug text-body/70">{hint}</p> : null}
      {errorOf(name) ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
          {errorOf(name)}
        </p>
      ) : null}
    </fieldset>
  );

  const textArea = (name: string, label: string, dir: "rtl" | "ltr", lang: Locale) => (
    <Field
      label={labelFor(label, false)}
      htmlFor={idOf(name)}
      hint={fill(copy.textMax, { max: LIMITS.profileTextMax })}
      error={errorOf(name)}
    >
      <textarea
        {...a11y(name, true)}
        rows={3}
        maxLength={LIMITS.profileTextMax}
        dir={dir}
        lang={lang}
        className={textareaClasses("min-h-24")}
      />
    </Field>
  );

  /** A start date that bounds its end date, and the "until now" box that clears it. */
  const datedFields = (
    group: "education" | "experience",
    row: DatedRow,
    update: (key: string, patch: Partial<DatedRow>) => void,
    currentLabel: string,
  ) => {
    const start = `${group}.${row.key}.startDate`;
    const end = `${group}.${row.key}.endDate`;
    return (
      <>
        <Field label={copy.startDate} htmlFor={idOf(start)} required error={errorOf(start)}>
          <input
            {...a11y(start)}
            type="date"
            required
            onChange={(event) => update(row.key, { start: event.currentTarget.value })}
            className={inputClasses()}
          />
        </Field>
        <Field label={labelFor(copy.endDate, false)} htmlFor={idOf(end)} error={errorOf(end)}>
          {/* A new key when "until now" changes remounts the box empty: the clearing. */}
          <input
            key={row.current ? "current" : "dated"}
            {...a11y(end)}
            type="date"
            min={row.start || undefined}
            disabled={row.current}
            className={inputClasses()}
          />
        </Field>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-body select-none sm:col-span-2">
          <input
            type="checkbox"
            name={`${group}.${row.key}.current`}
            checked={row.current}
            onChange={(event) => update(row.key, { current: event.currentTarget.checked })}
            className="size-4 cursor-pointer accent-primary"
          />
          {currentLabel}
        </label>
      </>
    );
  };

  const patchRow =
    <T extends { key: string }>(set: (update: (rows: readonly T[]) => readonly T[]) => void) =>
    (key: string, patch: Partial<T>) =>
      set((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const removeRow =
    <T extends { key: string }>(set: (update: (rows: readonly T[]) => readonly T[]) => void) =>
    (key: string) =>
      set((rows) => rows.filter((row) => row.key !== key));

  const updateEducation = patchRow(setEducations);
  const updateExperience = patchRow(setExperiences);
  const updateSkill = patchRow(setSkills);
  const chosenSkills = new Set(skills.map((row) => row.skillId).filter(Boolean));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = parseCoachForm(data, messages);
    focusError.current = true;
    setEdited(new Set());
    if (!parsed.registration && !parsed.isBot) {
      setLocal({ status: "error", message: messages.fix, fieldErrors: parsed.fieldErrors });
      return;
    }
    setLocal(null);
    startTransition(() => run(data));
  };

  const onCountry = (value: string) => {
    setCountryId(value);
    setCities([]);
    latestCountry.current = value;
    if (!value) return;
    startCities(async () => {
      const list = await loadCities(value);
      if (latestCountry.current === value) setCities(list);
    });
  };

  const photoError = errorOf("profileImage");
  const consentError = errorOf("consent");

  return (
    <form
      ref={formRef}
      action={run}
      onSubmit={onSubmit}
      onInput={(event) => {
        const name = (event.target as HTMLInputElement).name;
        if (name && errors[name] && !edited.has(name)) setEdited((names) => new Set(names).add(name));
        checkReady();
      }}
      noValidate
      className="space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {/* A field people never see; a bot fills every box it finds. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          {copy.honeypot}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* ── 01 Personal information ── */}
      <FormSection id="personal" index={1} title={copy.personalTitle} lead={copy.personalLead}>
        <div className="grid gap-5 sm:grid-cols-2">
          {textField("firstName", copy.firstName, { required: true, autoComplete: "given-name", maxLength: 100 })}
          {textField("lastName", copy.lastName, { required: true, autoComplete: "family-name", maxLength: 100 })}
          {textField("email", copy.email, { required: true, type: "email", autoComplete: "email", dir: "ltr", hint: copy.emailHint })}

          <Field label={copy.phone} htmlFor={idOf("phone")} required hint={copy.phoneHint} error={errorOf("phone")}>
            {/* LTR as a unit: the dialling code comes before the number in every language. The code box itself follows the page direction, so its arrow (drawn by the page direction) and its text padding agree. */}
            <div dir="ltr" className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-2">
              <select name="dialCode" dir={locale === "ar" ? "rtl" : "ltr"} defaultValue="+962" aria-label={copy.dialCode} className={selectClasses()}>
                {dialCodes.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <input
                {...a11y("phone", true)}
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel-national"
                dir="ltr"
                maxLength={20}
                className={inputClasses()}
              />
            </div>
          </Field>

          <PasswordField
            id={idOf("password")}
            name="password"
            label={copy.password}
            hint={copy.passwordHint}
            autoComplete="new-password"
            showLabel={copy.showPassword}
            hideLabel={copy.hidePassword}
            error={errorOf("password")}
            markRequired
          />

          <PasswordField
            id={idOf("confirmPassword")}
            name="confirmPassword"
            label={copy.confirmPassword}
            autoComplete="new-password"
            showLabel={copy.showPassword}
            hideLabel={copy.hidePassword}
            error={errorOf("confirmPassword")}
            markRequired
            matchName="password"
            mismatchMessage={messages.passwordMismatch}
          />

          <Field label={copy.gender} htmlFor={idOf("genderId")} required error={errorOf("genderId")}>
            <select {...a11y("genderId")} required defaultValue="" className={selectClasses()}>
              <option value="">{copy.choose}</option>
              <option value="1">{copy.genderMale}</option>
              <option value="2">{copy.genderFemale}</option>
            </select>
          </Field>

          <Field label={labelFor(copy.birthDate, false)} htmlFor={idOf("birthDate")} error={errorOf("birthDate")}>
            <input {...a11y("birthDate")} type="date" autoComplete="bday" className={inputClasses()} />
          </Field>

          <Field label={copy.country} htmlFor={idOf("countryId")} required error={errorOf("countryId")}>
            <select
              {...a11y("countryId")}
              required
              value={countryId}
              onChange={(event) => onCountry(event.currentTarget.value)}
              className={selectClasses()}
            >
              <option value="">{copy.choose}</option>
              {options.countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={copy.city} htmlFor={idOf("cityId")} required error={errorOf("cityId")}>
            <select
              key={countryId}
              {...a11y("cityId")}
              required
              defaultValue=""
              disabled={!countryId || citiesPending}
              aria-busy={citiesPending || undefined}
              className={selectClasses()}
            >
              <option value="">{!countryId ? copy.cityFirst : citiesPending ? copy.cityLoading : copy.choose}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </Field>

          {selectField("jobStatusId", copy.jobStatus, options.jobStatuses, { className: "sm:col-span-2" })}
        </div>
      </FormSection>

      {/* ── 02 The coach page ── */}
      <FormSection id="profile" index={2} title={copy.profileTitle} lead={copy.profileLead}>
        <div className="grid gap-5 sm:grid-cols-2">
          {selectField("locationId", copy.basedIn, options.locations, { required: true })}
          {choiceGroup("languages", copy.languages, [
            { value: "ar", label: copy.langAr },
            { value: "en", label: copy.langEn },
          ])}
          {choiceGroup("sportIds", copy.sports, options.sports.map((sport) => ({ value: sport.id, label: sport.name })), copy.sportsHint, "sm:col-span-2")}
          {textField("profileNameAr", copy.profileNameAr, { maxLength: LIMITS.nameMax, hint: copy.profileNameHint })}
          {textField("profileNameEn", copy.profileNameEn, { maxLength: LIMITS.nameMax, dir: "ltr" })}
          {textField("headlineAr", copy.headlineAr, { required: true, maxLength: LIMITS.profileTextMax, hint: copy.headlineHint })}
          {textField("headlineEn", copy.headlineEn, { required: true, maxLength: LIMITS.profileTextMax, dir: "ltr" })}
          {textArea("bioAr", copy.bioAr, "rtl", "ar")}
          {textArea("bioEn", copy.bioEn, "ltr", "en")}
        </div>
      </FormSection>

      {/* ── 03 Education ── */}
      <FormSection id="education" index={3} title={copy.educationTitle} lead={copy.educationLead}>
        <RowList
          rows={educations}
          emptyLabel={copy.empty}
          addLabel={copy.addEducation}
          fullLabel={fill(copy.rowsFull, { max: LIMITS.maxRows })}
          max={LIMITS.maxRows}
          onAdd={() => setEducations((rows) => [...rows, { key: nextKey(), start: "", current: false }])}
        >
          {educations.map((row, index) => (
            <RowCard
              key={row.key}
              title={fill(copy.educationRow, { n: index + 1 })}
              removeLabel={copy.remove}
              onRemove={() => removeRow(setEducations)(row.key)}
            >
              {textField(`education.${row.key}.schoolName`, copy.school, {
                required: true,
                maxLength: LIMITS.schoolNameMax,
                className: "sm:col-span-2",
              })}
              {selectField(`education.${row.key}.academicDegreeId`, copy.degree, options.academicDegrees, { required: true })}
              {selectField(`education.${row.key}.universityMajorId`, copy.major, options.universityMajors, { required: true })}
              {datedFields("education", row, updateEducation, copy.stillStudying)}
            </RowCard>
          ))}
        </RowList>
      </FormSection>

      {/* ── 04 Certificates ── */}
      <FormSection id="certificates" index={4} title={copy.certificatesTitle} lead={copy.certificatesLead}>
        <RowList
          rows={certificates}
          emptyLabel={copy.empty}
          addLabel={copy.addCertificate}
          fullLabel={fill(copy.rowsFull, { max: LIMITS.maxRows })}
          max={LIMITS.maxRows}
          onAdd={() => setCertificates((rows) => [...rows, { key: nextKey(), start: "", current: false }])}
        >
          {certificates.map((row, index) => {
            const issued = `certificate.${row.key}.issuedDate`;
            const expiry = `certificate.${row.key}.expiryDate`;
            const file = `certificate.${row.key}.file`;
            return (
              <RowCard
                key={row.key}
                title={fill(copy.certificateRow, { n: index + 1 })}
                removeLabel={copy.remove}
                onRemove={() => removeRow(setCertificates)(row.key)}
              >
                {textField(`certificate.${row.key}.name`, copy.certName, { required: true, maxLength: LIMITS.certificateTextMax })}
                {textField(`certificate.${row.key}.organization`, copy.certOrg, {
                  required: true,
                  maxLength: LIMITS.certificateTextMax,
                })}
                <Field label={copy.issuedDate} htmlFor={idOf(issued)} required error={errorOf(issued)}>
                  <input
                    {...a11y(issued)}
                    type="date"
                    required
                    onChange={(event) => patchRow(setCertificates)(row.key, { start: event.currentTarget.value })}
                    className={inputClasses()}
                  />
                </Field>
                <Field label={labelFor(copy.expiryDate, false)} htmlFor={idOf(expiry)} error={errorOf(expiry)}>
                  <input {...a11y(expiry)} type="date" min={row.start || undefined} className={inputClasses()} />
                </Field>
                {textField(`certificate.${row.key}.credentialId`, copy.credentialId, {
                  required: true,
                  maxLength: LIMITS.certificateTextMax,
                  dir: "ltr",
                })}
                {textField(`certificate.${row.key}.credentialUrl`, copy.credentialUrl, {
                  type: "url",
                  maxLength: LIMITS.credentialUrlMax,
                  dir: "ltr",
                  placeholder: "https://",
                })}
                <div className="sm:col-span-2">
                  <p className="text-[14px] font-semibold text-ink">
                    {labelFor(copy.certFile, false)}
                  </p>
                  <FilePicker
                    id={idOf(file)}
                    name={file}
                    accept="image/*,application/pdf"
                    chooseLabel={copy.chooseFile}
                    emptyLabel={copy.noFile}
                    describedBy={`${idOf(file)}-hint`}
                  />
                  <p id={`${idOf(file)}-hint`} className="mt-1.5 text-[13px] leading-snug text-body/70">
                    {copy.certFileHint}
                  </p>
                  {errorOf(file) ? (
                    <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
                      {errorOf(file)}
                    </p>
                  ) : null}
                </div>
              </RowCard>
            );
          })}
        </RowList>
      </FormSection>

      {/* ── 05 Experience ── */}
      <FormSection id="experience" index={5} title={copy.experienceTitle} lead={copy.experienceLead}>
        <RowList
          rows={experiences}
          emptyLabel={copy.empty}
          addLabel={copy.addExperience}
          fullLabel={fill(copy.rowsFull, { max: LIMITS.maxRows })}
          max={LIMITS.maxRows}
          onAdd={() => setExperiences((rows) => [...rows, { key: nextKey(), start: "", current: false }])}
        >
          {experiences.map((row, index) => (
            <RowCard
              key={row.key}
              title={fill(copy.experienceRow, { n: index + 1 })}
              removeLabel={copy.remove}
              onRemove={() => removeRow(setExperiences)(row.key)}
            >
              {textField(`experience.${row.key}.title`, copy.expTitle, { required: true, maxLength: LIMITS.experienceTitleMax })}
              {selectField(`experience.${row.key}.jobTypeId`, copy.jobType, options.jobTypes, { required: true })}
              {textField(`experience.${row.key}.companyName`, copy.company, { required: true, maxLength: LIMITS.companyMax })}
              {textField(`experience.${row.key}.location`, copy.location, { required: true, maxLength: LIMITS.companyMax })}
              {datedFields("experience", row, updateExperience, copy.stillWorking)}
            </RowCard>
          ))}
        </RowList>
      </FormSection>

      {/* ── 06 Skills ── */}
      <FormSection
        id="skills"
        index={6}
        title={copy.skillsTitle}
        lead={fill(copy.skillsLead, { max: LIMITS.maxSkills })}
      >
        <RowList
          rows={skills}
          emptyLabel={copy.empty}
          addLabel={copy.addSkill}
          fullLabel={fill(copy.rowsFull, { max: LIMITS.maxSkills })}
          max={LIMITS.maxSkills}
          onAdd={() => setSkills((rows) => [...rows, { key: nextKey(), skillId: "", level: "50" }])}
        >
          {skills.map((row, index) => {
            const skill = `skill.${row.key}.skillId`;
            const level = `skill.${row.key}.level`;
            const percent = Math.min(100, Math.max(0, Number(row.level) || 0));
            return (
              <RowCard
                key={row.key}
                title={fill(copy.skillRow, { n: index + 1 })}
                removeLabel={copy.remove}
                onRemove={() => removeRow(setSkills)(row.key)}
              >
                <Field label={copy.skill} htmlFor={idOf(skill)} required error={errorOf(skill)}>
                  <select
                    {...a11y(skill)}
                    required
                    value={row.skillId}
                    onChange={(event) => updateSkill(row.key, { skillId: event.currentTarget.value })}
                    className={selectClasses()}
                  >
                    <option value="">{copy.choose}</option>
                    {options.skills.map((option) => (
                      <option key={option.id} value={option.id} disabled={option.id !== row.skillId && chosenSkills.has(option.id)}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.skillLevel} htmlFor={idOf(level)} required error={errorOf(level)}>
                  <div className="flex items-center gap-4">
                    <div dir="ltr" className="relative w-28 shrink-0">
                      <input
                        {...a11y(level)}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        step={1}
                        required
                        value={row.level}
                        /* Kept inside 0–100 as it is typed; an empty box is allowed while typing. */
                        onChange={(event) => {
                          const raw = event.currentTarget.value.replace(/\D/g, "");
                          updateSkill(row.key, { level: raw === "" ? "" : String(Math.min(100, Number(raw))) });
                        }}
                        className={inputClasses("w-28 pe-9")}
                      />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-4 grid place-items-center text-[14px] text-body/60">
                        %
                      </span>
                    </div>
                    <span aria-hidden="true" className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-primary-10">
                      <span className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
                    </span>
                  </div>
                </Field>
              </RowCard>
            );
          })}
        </RowList>
      </FormSection>

      {/* ── 07 Profile photo ── */}
      <FormSection id="photo" index={7} title={copy.photoTitle} lead={copy.photoLead}>
        <div className="flex flex-wrap items-center gap-6">
          <span className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-05 text-primary/50 ring-1 ring-line">
            {photo ? (
              /* A local preview of a file not yet uploaded: an object URL, which next/image cannot take. */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.75" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4.5 20c.9-3.6 3.9-5.75 7.5-5.75S18.6 16.4 19.5 20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={buttonClasses({
                  variant: "outline",
                  className:
                    "cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                })}
              >
                {photo ? copy.changePhoto : copy.choosePhoto}
                <input
                  ref={photoInput}
                  id={idOf("profileImage")}
                  name="profileImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-invalid={photoError ? true : undefined}
                  aria-describedby={`${idOf("profileImage")}-hint${photoError ? ` ${idOf("profileImage")}-error` : ""}`}
                  className="sr-only"
                  onChange={(event) => {
                    const chosen = event.currentTarget.files?.[0];
                    setPhoto(chosen ? URL.createObjectURL(chosen) : undefined);
                  }}
                />
              </label>
              {photo ? (
                <button
                  type="button"
                  onClick={() => {
                    if (photoInput.current) photoInput.current.value = "";
                    setPhoto(undefined);
                  }}
                  className="cursor-pointer rounded-full px-3 py-2 text-[14px] font-semibold text-danger transition-colors hover:bg-danger-05"
                >
                  {copy.removePhoto}
                </button>
              ) : null}
            </div>
            <p id={`${idOf("profileImage")}-hint`} className="mt-2 text-[13px] leading-snug text-body/70">
              {copy.photoHint}
            </p>
            {photoError ? (
              <p id={`${idOf("profileImage")}-error`} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
                {photoError}
              </p>
            ) : null}
          </div>
        </div>
      </FormSection>

      {/* ── consent and send ── */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <label className="flex cursor-pointer items-start gap-3 text-[14.5px] leading-relaxed text-body">
          <input
            id={idOf("consent")}
            type="checkbox"
            name="consent"
            required
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? `${idOf("consent")}-error` : undefined}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
          />
          <span>
            {copy.consentPrefix}{" "}
            {/* A new tab, so reading the terms does not lose a half-filled form. */}
            <Link href={termsHref} target="_blank" className="font-semibold text-primary-dark underline decoration-1 underline-offset-4 hover:text-primary">
              {copy.consentTerms}
            </Link>{" "}
            {copy.consentAnd}{" "}
            <Link href={privacyHref} target="_blank" className="font-semibold text-primary-dark underline decoration-1 underline-offset-4 hover:text-primary">
              {copy.consentPrivacy}
            </Link>
          </span>
        </label>
        {consentError ? (
          <p id={`${idOf("consent")}-error`} role="alert" className="mt-1.5 ps-7 text-[13px] font-medium text-danger">
            {consentError}
          </p>
        ) : null}

        <div aria-live="polite" className="empty:hidden">
          {shown.status === "error" ? (
            <div
              data-form-summary
              tabIndex={-1}
              className="mt-6 flex gap-3 rounded-2xl border border-danger/20 bg-danger-05 px-4 py-3.5 text-[14px] text-danger outline-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="mt-px shrink-0">
                <circle cx="9" cy="9" r="7.25" />
                <path d="M9 5.2v4.6M9 12.4v.1" strokeLinecap="round" />
              </svg>
              <p className="min-w-0 font-semibold">{shown.message}</p>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending || !ready || citiesPending}
          aria-busy={pending || undefined}
          className={buttonClasses({ variant: "primary", size: "lg", className: "mt-6 w-full" })}
        >
          {pending ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-spin motion-reduce:animate-none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : null}
          <span>{pending ? copy.working : copy.submit}</span>
        </button>
      </div>
    </form>
  );
}

/** One numbered part of the form, on its own card. */
function FormSection({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string;
  index: number;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span
          dir="ltr"
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-05 font-heading text-[14px] font-bold text-primary-dark ring-1 ring-primary/20"
        >
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 id={`${id}-title`} className="text-[1.3rem] leading-snug sm:text-[1.45rem]">
            {title}
          </h2>
          <p className="mt-1 text-[14.5px] leading-relaxed text-body">{lead}</p>
        </div>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

/** A repeatable block: its rows, an empty line while there are none, and the add button. */
function RowList({
  rows,
  emptyLabel,
  addLabel,
  fullLabel,
  max,
  onAdd,
  children,
}: {
  rows: readonly unknown[];
  emptyLabel: string;
  addLabel: string;
  fullLabel: string;
  max: number;
  onAdd: () => void;
  children: ReactNode;
}) {
  const full = rows.length >= max;
  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-[14px] text-body/80">{emptyLabel}</p>
      ) : (
        children
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onAdd} disabled={full} className={buttonClasses({ variant: "soft", size: "sm" })}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {addLabel}
        </button>
        {full ? <span className="text-[13px] text-body/70">{fullLabel}</span> : null}
      </div>
    </div>
  );
}

/** One row of a repeatable block. */
function RowCard({
  title,
  removeLabel,
  onRemove,
  children,
}: {
  title: string;
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={title} className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-heading text-[15.5px] font-semibold text-ink">{title}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${removeLabel} — ${title}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-05"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {removeLabel}
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}
