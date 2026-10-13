import { inputClasses, Rosette, selectClasses, textareaClasses } from "@/components/ui";
import { refreshAccountDisplay, requireAccount } from "@/features/auth";
import {
  careersService,
  EMPLOYER_KINDS,
  EMPLOYER_SIZES,
  JOB_CITIES,
  sniffImageType,
  type EmployerAccountProfile,
  type EmployerKind,
  type EmployerProfileInput,
  type EmployerSize,
  type JobCity,
} from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, resolveLocale, type Translate } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { succeeded } from "../../_components/portal/form-state";
import { Panel } from "../../_components/portal/portal-shell";
import { CompanyLogo } from "../_components/company-logo";
import { EmployerForm } from "../_components/employer-form";
import { employerFrame } from "../_components/employer-frame";
import { EmployerShell } from "../_components/employer-shell";
import { Field } from "../_components/fields";
import { FilePicker } from "../_components/file-picker";
import { isolate } from "../_components/format";
import { AlertIcon, ShieldIcon } from "../_components/icons";
import { refreshEmployerArea } from "../_components/navigation";
import { refused } from "../_components/refusals";
import { VerificationChip } from "../_components/status-chip";

export async function generateMetadata({ params }: PageProps<"/[locale]/employer/profile">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/employer/profile", title: getTranslator(locale)("employer.tabProfile"), noIndex: true });
}

const PATH = "/employer/profile";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** What is stored, as the input `updateProfile` takes — the logo left as it is. */
const inputOf = (profile: EmployerAccountProfile): EmployerProfileInput => ({
  name: profile.name,
  kind: profile.kind,
  cityId: profile.cityId,
  about: profile.about,
  website: profile.website,
  size: profile.size,
  email: profile.email,
  phone: profile.phone,
  contactName: profile.contactName,
});

/**
 * The obvious mistakes, caught in the reader's language before the service
 * is asked. The same rules the service applies; it still decides.
 */
function profileErrors(t: Translate, input: EmployerProfileInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.name.trim().length < 2) errors.name = t("employer.errName");
  if (!EMPLOYER_KINDS.includes(input.kind)) errors.kind = t("employer.errKind");
  if (!JOB_CITIES.includes(input.cityId)) errors.cityId = t("jobForm.errCity");
  if (input.size !== undefined && !EMPLOYER_SIZES.includes(input.size)) errors.size = t("employer.errSize");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = t("employer.errEmail");
  if (input.phone && !/^\+?[\d\s]{8,}$/.test(input.phone.trim())) errors.phone = t("account.errorPhone");
  if (input.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(input.website.trim())) errors.website = t("employer.errWebsite", { scheme: isolate("https://") });
  const contact = input.contactName.trim();
  if (contact.length < 3 || !contact.includes(" ")) errors.contactName = t("employer.errContactName");
  if (input.about.length > 3000) errors.about = t("employer.errAbout");
  return errors;
}

/**
 * THE COMPANY AS CANDIDATES MEET IT: its name, what it is, where, how to
 * reach it, what it says about itself — and its logo, which sits beside every
 * job it posts. The verification standing is said beside it, because it is
 * what decides whether any of this is public yet.
 */
export default async function EmployerProfilePage({ params }: PageProps<"/[locale]/employer/profile">) {
  const locale = resolveLocale((await params).locale);
  const { employerId, t, f, shell } = await employerFrame(locale, PATH);
  const [profile, cities] = await Promise.all([employerPortalService.getProfile(employerId), careersService.listCities(locale)]);

  async function save(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", PATH);
    const tr = getTranslator(locale);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const input: EmployerProfileInput = {
      name: text("name"),
      kind: text("kind") as EmployerKind,
      cityId: text("cityId") as JobCity,
      about: text("about"),
      website: text("website") || undefined,
      size: (text("size") || undefined) as EmployerSize | undefined,
      email: text("email"),
      phone: text("phone") || undefined,
      contactName: text("contactName"),
    };
    const errors = profileErrors(tr, input);
    if (Object.keys(errors).length > 0) return { status: "error", message: tr("account.fixFields"), fieldErrors: errors };
    try {
      const saved = await employerPortalService.updateProfile(account.employerId!, input);
      /* The header greets the contact person by name. */
      if (saved.contactName !== account.name) await refreshAccountDisplay({ ...account, name: saved.contactName });
    } catch (error) {
      return refused(tr, "updateProfile", error);
    }
    refreshEmployerArea(locale, PATH);
    return succeeded(tr("employer.profileSaved"));
  }

  async function uploadLogo(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", PATH);
    const tr = getTranslator(locale);
    const file = formData.get("logo");
    const refuse = (message: string): FormState => ({ status: "error", message, fieldErrors: { logo: message } });
    if (!(file instanceof File) || file.size === 0) return refuse(tr("employer.errLogoMissing"));
    if (file.size > LOGO_MAX_BYTES) return refuse(tr("employer.errLogoSize"));
    if (!sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()))) return refuse(tr("employer.errLogoType"));
    try {
      const logo = await employerPortalService.uploadLogo(account.employerId!, file);
      const current = await employerPortalService.getProfile(account.employerId!);
      await employerPortalService.updateProfile(account.employerId!, { ...inputOf(current), logo });
    } catch (error) {
      return refused(tr, "uploadLogo", error);
    }
    refreshEmployerArea(locale, PATH);
    return succeeded(tr("employer.logoSaved"));
  }

  async function removeLogo(): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "employer", PATH);
    const tr = getTranslator(locale);
    try {
      const current = await employerPortalService.getProfile(account.employerId!);
      await employerPortalService.updateProfile(account.employerId!, { ...inputOf(current), logo: null });
    } catch (error) {
      return refused(tr, "updateProfile", error);
    }
    refreshEmployerArea(locale, PATH);
    return succeeded(tr("employer.logoRemoved"));
  }

  const optional = t("employer.optional");
  const ids = {
    name: "company-name",
    kind: "company-kind",
    cityId: "company-city",
    size: "company-size",
    website: "company-website",
    email: "company-email",
    phone: "company-phone",
    contactName: "company-contact",
    about: "company-about",
  } as const;
  const labels = {
    name: t("employer.companyName"),
    kind: t("employer.kind"),
    cityId: t("employer.city"),
    size: t("employer.size"),
    website: t("employer.website"),
    email: t("employer.publicEmail"),
    phone: t("employer.publicPhone"),
    contactName: t("employer.contactName"),
    about: t("employer.about"),
  };
  const fields = Object.fromEntries(
    (Object.keys(ids) as (keyof typeof ids)[]).map((name) => [name, { label: labels[name], id: ids[name] }]),
  );

  const verified = profile.verificationStatus === "verified";
  const standing =
    profile.verificationStatus === "verified"
      ? t("employer.verificationVerified")
      : profile.verificationStatus === "pending"
        ? t("employer.bannerPending")
        : profile.verificationStatus === "rejected"
          ? t("employer.bannerRejected")
          : t("employer.bannerSuspended");

  return (
    <EmployerShell {...shell} active={PATH} title={profile.name} lead={t("employer.profileLead")}>
      <div className="grid grid-cols-1 gap-6">
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
          <section
            aria-labelledby="verification"
            className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
            <span aria-hidden="true" className="absolute -end-20 -bottom-24 -z-10 size-60 text-accent/16">
              <Rosette className="spin-slow size-full" />
            </span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-white/10 text-accent ring-1 ring-white/15">
                {verified ? <ShieldIcon size={19} /> : <AlertIcon size={19} />}
              </span>
              <span className="rounded-full bg-surface p-1">
                <VerificationChip t={t} status={profile.verificationStatus} />
              </span>
            </div>
            <h2 id="verification" className="mt-5 text-[1.2rem] leading-snug text-white">
              {t("employer.verificationTitle")}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent/70" />
            <p className="mt-4 text-[14px] leading-relaxed text-white/75">{standing}</p>
            {profile.verificationNote && profile.verificationStatus !== "verified" && profile.verificationStatus !== "pending" ? (
              <p className="mt-4 rounded-2xl bg-white/[0.07] px-4 py-3 text-[14px] text-white ring-1 ring-white/15">
                <span className="font-semibold">{t("employer.bannerNote")}: </span>
                <span dir="auto">{profile.verificationNote}</span>
              </p>
            ) : null}
            <p className="mt-5 border-t border-white/10 pt-4 text-[13px] text-white/55">
              {t("employer.memberSince", { date: f.date(profile.createdAt) })}
            </p>
          </section>
          <Panel id="company-logo" title={t("employer.logoTitle")}>
            <div className="flex items-center gap-5 rounded-2xl border border-line bg-canvas p-4">
              <CompanyLogo name={profile.name} logo={profile.logo} className="size-24" sizes="96px" />
              {profile.logo ? null : <p className="text-[13.5px] leading-relaxed text-body">{t("employer.logoNone")}</p>}
            </div>
            <ActionForm
              action={uploadLogo}
              submitLabel={t("employer.uploadLogo")}
              pendingLabel={t("account.working")}
              resetOnSuccess
              className="mt-5"
            >
              <FilePicker
                id="logo-file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                chooseLabel={t("employer.logoFile")}
                emptyLabel={t("employer.noFileChosen")}
                describedBy="logo-hint"
              />
              <p id="logo-hint" className="mt-2.5 text-[13px] leading-snug text-body/75">
                {t("employer.logoLead")}
              </p>
            </ActionForm>
            {profile.logo ? (
              <ActionForm
                action={removeLogo}
                submitLabel={t("employer.removeLogo")}
                pendingLabel={t("account.working")}
                tone="quiet"
                className="mt-4 [&>button]:mt-0"
              />
            ) : null}
          </Panel>
        </div>

        <Panel id="company-details" title={t("employer.detailsTitle")} className="min-w-0">
          <EmployerForm
            action={save}
            buttons={[{ intent: "save", label: t("employer.saveProfile") }]}
            pendingLabel={t("account.working")}
            fields={fields}
            fixLabel={t("jobForm.fixBelow")}
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={ids.name} label={labels.name} className="sm:col-span-2">
                <input id={ids.name} name="name" defaultValue={profile.name} required dir="auto" autoComplete="organization" className={inputClasses()} />
              </Field>
              <Field id={ids.kind} label={labels.kind}>
                <select id={ids.kind} name="kind" defaultValue={profile.kind} className={selectClasses()}>
                  {EMPLOYER_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`careers.kind.${kind}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={ids.cityId} label={labels.cityId}>
                <select id={ids.cityId} name="cityId" defaultValue={profile.cityId} className={selectClasses()}>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={ids.size} label={labels.size} optional={optional}>
                <select id={ids.size} name="size" defaultValue={profile.size ?? ""} className={selectClasses()}>
                  <option value="">{t("employer.notStated")}</option>
                  {EMPLOYER_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {t(`careers.size.${size}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={ids.website} label={labels.website} optional={optional} hint={t("employer.websiteHint", { scheme: isolate("https://") })}>
                <input
                  id={ids.website}
                  name="website"
                  type="url"
                  inputMode="url"
                  defaultValue={profile.website ?? ""}
                  placeholder="https://"
                  dir="ltr"
                  autoComplete="url"
                  className={inputClasses("text-start")}
                />
              </Field>
              <Field id={ids.email} label={labels.email} hint={t("employer.publicEmailHint")}>
                <input
                  id={ids.email}
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  required
                  dir="ltr"
                  autoComplete="email"
                  className={inputClasses("text-start")}
                />
              </Field>
              <Field id={ids.phone} label={labels.phone} optional={optional}>
                <input
                  id={ids.phone}
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone ?? ""}
                  dir="ltr"
                  autoComplete="tel"
                  className={inputClasses("text-start")}
                />
              </Field>
              <Field id={ids.contactName} label={labels.contactName} hint={t("employer.contactNameHint")} className="sm:col-span-2">
                <input
                  id={ids.contactName}
                  name="contactName"
                  defaultValue={profile.contactName}
                  required
                  dir="auto"
                  autoComplete="name"
                  className={inputClasses()}
                />
              </Field>
              <Field id={ids.about} label={labels.about} hint={t("employer.aboutHint")} className="sm:col-span-2">
                <textarea
                  id={ids.about}
                  name="about"
                  defaultValue={profile.about}
                  rows={7}
                  maxLength={3000}
                  dir="auto"
                  className={textareaClasses("min-h-44")}
                />
              </Field>
            </div>
          </EmployerForm>
        </Panel>
      </div>
    </EmployerShell>
  );
}
