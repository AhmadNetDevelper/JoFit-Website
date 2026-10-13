import { revalidatePath } from "next/cache";

import { inputClasses, labelClasses } from "@/components/ui";
import { accountService } from "@/features/account";
import { authService, refreshAccountDisplay, requireAccount } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, isAppError } from "@/lib";

import { AccountSecurity } from "../../_components/portal/account-security";
import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { PasswordField } from "../../_components/portal/password-field";
import { Panel, PortalShell } from "../../_components/portal/portal-shell";
import { accountFrame } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/settings">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/settings", title: getTranslator(locale)("account.settings"), noIndex: true });
}

const PATH = "/account/settings";

/**
 * ACCOUNT & SECURITY — everything about the account itself, in one place:
 * the person's name and phone, the email they sign in with, their password,
 * and the sessions still signed in elsewhere.
 *
 * Name and phone are what staff see on every order and booking, so a change
 * here reaches the admin's customer record at once. The email and the
 * password both ask for the current password: a session left open on a
 * shared computer must not be enough to take the account over.
 */
export default async function AccountSettingsPage({ params }: PageProps<"/[locale]/account/settings">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, shell } = await accountFrame(locale, PATH);
  const profile = await accountService.getProfile(customerId);

  const fallback = t("state.errorTitle");
  const copy = {
    fix: t("account.fixFields"),
    name: t("account.errorName"),
    phone: t("account.errorPhone"),
    email: t("account.errorEmail"),
    sameEmail: t("account.errorSameEmail"),
    current: t("account.errorCurrentPassword"),
    taken: t("account.errorEmailTaken"),
    detailsSaved: t("account.detailsSaved"),
    emailChanged: t("account.emailChanged"),
  };

  async function saveDetails(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", PATH);
    const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
    const phone = String(formData.get("phone") ?? "").trim();
    const fieldErrors: Record<string, string> = {};
    if (name.length < 3 || !name.includes(" ")) fieldErrors.name = copy.name;
    if (phone && !/^\+?[\d\s]{8,}$/.test(phone)) fieldErrors.phone = copy.phone;
    if (Object.keys(fieldErrors).length > 0) return { status: "error", message: copy.fix, fieldErrors };
    try {
      const saved = await accountService.updateProfile(account.customerId!, { name, phone: phone || undefined });
      /* The header greets by first name from the display cookie; renew it. */
      await refreshAccountDisplay({ ...account, name: saved.displayName });
      revalidatePath(localePath(locale, PATH));
      return succeeded(copy.detailsSaved);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  async function changeEmail(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", PATH);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const fieldErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = copy.email;
    else if (email === account.email.toLowerCase()) fieldErrors.email = copy.sameEmail;
    if (!currentPassword) fieldErrors.currentPassword = copy.current;
    if (Object.keys(fieldErrors).length > 0) return { status: "error", message: copy.fix, fieldErrors };
    try {
      await authService.changeEmail({ email, currentPassword });
      revalidatePath(localePath(locale, PATH));
      return succeeded(copy.emailChanged);
    } catch (error) {
      /* The one refusal the page cannot foresee, said in the reader's language. */
      if (isAppError(error) && error.code === "conflict") {
        return { status: "error", message: copy.taken, fieldErrors: { email: copy.taken } };
      }
      return failed(error, fallback);
    }
  }

  return (
    <PortalShell {...shell} active={PATH} title={t("account.settings")} lead={t("account.settingsLead")}>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <Panel id="details" title={t("account.detailsTitle")} lead={t("account.detailsLead")}>
            <ActionForm
              action={saveDetails}
              submitLabel={t("account.saveDetails")}
              pendingLabel={t("account.working")}
              className="grid gap-4"
            >
              <div>
                <label htmlFor="details-name" className={labelClasses}>
                  {t("account.fullName")}
                </label>
                <input
                  id="details-name"
                  name="name"
                  required
                  autoComplete="name"
                  dir="auto"
                  defaultValue={profile.displayName}
                  className={inputClasses()}
                />
              </div>
              <div>
                <label htmlFor="details-phone" className={labelClasses}>
                  {t("account.phone")}
                  <span className="ms-1 font-normal text-body/70">{t("booking.goalOptional")}</span>
                </label>
                <input
                  id="details-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  dir="ltr"
                  defaultValue={profile.phone ?? ""}
                  className={inputClasses()}
                />
              </div>
            </ActionForm>
          </Panel>

          <Panel id="email" title={t("account.emailTitle")} lead={t("account.emailLead")}>
            <dl className="flex items-center gap-3.5 rounded-2xl border border-line bg-canvas px-4 py-3.5">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
                  <rect x="1.8" y="3.2" width="12.4" height="9.6" rx="1.6" />
                  <path d="m2.4 4.2 5.6 4.3 5.6-4.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <dt className="text-[12.5px] font-medium text-body">{t("account.currentEmail")}</dt>
                <dd className="mt-0.5 font-semibold break-all text-ink">
                  <span dir="ltr">{profile.email}</span>
                </dd>
              </div>
            </dl>
            <ActionForm
              action={changeEmail}
              submitLabel={t("account.changeEmail")}
              pendingLabel={t("account.working")}
              resetOnSuccess
              className="mt-5 grid gap-4"
            >
              <div>
                <label htmlFor="email-new" className={labelClasses}>
                  {t("account.newEmail")}
                </label>
                <input id="email-new" name="email" type="email" required autoComplete="email" dir="ltr" className={inputClasses()} />
              </div>
              <PasswordField
                id="email-password"
                name="currentPassword"
                label={t("account.currentPassword")}
                autoComplete="current-password"
                showLabel={t("signIn.showPassword")}
                hideLabel={t("signIn.hidePassword")}
              />
            </ActionForm>
          </Panel>
        </div>

        <div className="grid gap-6">
          <AccountSecurity locale={locale} role="customer" path={PATH} />
          <p className="flex gap-3 rounded-2xl border border-line bg-surface/70 px-5 py-4 text-[13.5px] leading-relaxed text-body">
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent-strong">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M8 1.6 13.4 3.6V7.8c0 3.1-2.3 5.6-5.4 6.6-3.1-1-5.4-3.5-5.4-6.6V3.6L8 1.6Z" strokeLinejoin="round" />
                <path d="m5.6 8 1.7 1.6 3.1-3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {t("account.securityNote")}
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
