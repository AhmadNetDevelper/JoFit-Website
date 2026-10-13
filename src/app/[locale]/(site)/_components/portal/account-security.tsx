import { authService, requireAccount, type AccountRole } from "@/features/auth";
import { getTranslator, type Locale } from "@/i18n";

import { ActionForm, type FormState } from "./action-form";
import { signOutAction } from "./auth-actions";
import { failed, succeeded } from "./form-state";
import { PasswordField } from "./password-field";
import { SignOutIcon } from "./portal-icons";
import { Panel } from "./portal-shell";

/**
 * The two security panels a customer and a coach share: changing the password
 * and ending the other sessions.
 *
 * The actions are defined here, on the server, and each one re-checks who is
 * calling (`requireAccount`) — an action is a public endpoint whatever page
 * drew its button. The obvious mistakes are caught here, in the reader's
 * language, before the service is asked; the service still decides.
 */
export function AccountSecurity({
  locale,
  role,
  path,
}: {
  locale: Locale;
  role: AccountRole;
  /** The page these panels are on — where sign-in brings the person back to. */
  path: string;
}) {
  const t = getTranslator(locale);
  const fallback = t("state.errorTitle");
  const copy = {
    fix: t("account.fixFields"),
    current: t("account.errorCurrentPassword"),
    short: t("account.errorPasswordShort"),
    same: t("account.errorPasswordSame"),
    mismatch: t("account.errorPasswordMismatch"),
    changed: t("account.passwordChanged"),
    others: t("account.signedOutOthers"),
  };

  async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    await requireAccount(locale, role, path);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const repeat = String(formData.get("confirmPassword") ?? "");
    const fieldErrors: Record<string, string> = {};
    if (!currentPassword) fieldErrors.currentPassword = copy.current;
    if (newPassword.length < 8) fieldErrors.newPassword = copy.short;
    else if (newPassword === currentPassword) fieldErrors.newPassword = copy.same;
    if (newPassword !== repeat) fieldErrors.confirmPassword = copy.mismatch;
    if (Object.keys(fieldErrors).length > 0) return { status: "error", message: copy.fix, fieldErrors };
    try {
      await authService.changePassword({ currentPassword, newPassword });
      return succeeded(copy.changed);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  async function signOutOthers(): Promise<FormState> {
    "use server";
    await requireAccount(locale, role, path);
    try {
      await authService.signOutOtherSessions();
      return succeeded(copy.others);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  const reveal = { showLabel: t("signIn.showPassword"), hideLabel: t("signIn.hidePassword") };

  return (
    <>
      <Panel id="password" title={t("account.passwordTitle")} lead={t("account.passwordLead")}>
        <ActionForm
          action={changePassword}
          submitLabel={t("account.changePassword")}
          pendingLabel={t("account.working")}
          resetOnSuccess
          className="grid gap-4"
        >
          <PasswordField
            id="password-current"
            name="currentPassword"
            label={t("account.currentPassword")}
            autoComplete="current-password"
            {...reveal}
          />
          <PasswordField
            id="password-new"
            name="newPassword"
            label={t("account.newPassword")}
            hint={t("account.errorPasswordShort")}
            autoComplete="new-password"
            {...reveal}
          />
          <PasswordField
            id="password-confirm"
            name="confirmPassword"
            label={t("account.confirmPassword")}
            autoComplete="new-password"
            {...reveal}
          />
        </ActionForm>
      </Panel>

      <Panel id="devices" title={t("account.devicesTitle")} lead={t("account.devicesLead")}>
        <ActionForm
          action={signOutOthers}
          submitLabel={t("account.signOutOthers")}
          pendingLabel={t("account.working")}
          tone="quiet"
          className="[&>button]:mt-0"
        />
        <form action={signOutAction} className="mt-6 border-t border-line pt-5">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-danger underline-offset-4 hover:underline"
          >
            <SignOutIcon />
            {t("account.signOutHere")}
          </button>
        </form>
      </Panel>
    </>
  );
}
