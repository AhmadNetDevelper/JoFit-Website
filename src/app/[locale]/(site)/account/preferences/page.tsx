import { revalidatePath } from "next/cache";

import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { sportsService } from "@/features/sports";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { failed, succeeded } from "../../_components/portal/form-state";
import { Panel, PortalShell } from "../../_components/portal/portal-shell";
import { accountFrame } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/preferences">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/preferences", title: getTranslator(locale)("account.preferences"), noIndex: true });
}

/* A choice drawn as a pill: the input is visually hidden and the pill beside it answers to its state. */
const CHOICE =
  "inline-flex items-center gap-2 rounded-full border border-line bg-surface font-medium text-ink transition-colors hover:border-primary/40 " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary";

/**
 * How JoFit talks to this person: in which language, whether it may send them
 * news, and which sports to lead with. The same three facts staff see on the
 * customer record in the admin.
 */
export default async function AccountPreferencesPage({ params }: PageProps<"/[locale]/account/preferences">) {
  const locale = resolveLocale((await params).locale);
  const { customerId, t, shell } = await accountFrame(locale, "/account/preferences");
  const [preferences, sports] = await Promise.all([
    accountService.getPreferences(customerId),
    sportsService.list({ locale }),
  ]);

  const fallback = t("state.errorTitle");
  const saved = t("account.preferencesSaved");

  async function save(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const account = await requireAccount(locale, "customer", "/account/preferences");
    try {
      await accountService.updatePreferences(account.customerId!, {
        locale: formData.get("locale") === "ar" ? "ar" : "en",
        marketingOptIn: formData.get("marketing") === "on",
        favouriteSportIds: formData.getAll("sports").map(String),
      });
      revalidatePath(localePath(locale, "/account/preferences"));
      return succeeded(saved);
    } catch (error) {
      return failed(error, fallback);
    }
  }

  return (
    <PortalShell {...shell} active="/account/preferences" title={t("account.preferences")} lead={t("account.preferencesLead")}>
      <Panel id="preferences-form" title={t("account.howWeTalk")} className="max-w-3xl">
        <ActionForm action={save} submitLabel={t("account.savePreferences")} pendingLabel={t("account.working")} className="[&>button]:mt-7">
          <fieldset>
            <legend className="text-[15px] font-semibold text-ink">{t("account.language")}</legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {(["en", "ar"] as const).map((value) => (
                <label key={value} className="cursor-pointer">
                  <input type="radio" name="locale" value={value} defaultChecked={preferences.locale === value} className="peer sr-only" />
                  <span className={`${CHOICE} h-11 px-5 text-[14px] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary`}>
                    <span lang={value}>{value === "ar" ? "العربية" : "English"}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-7 flex cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-canvas p-4 transition-colors hover:border-primary/30 has-checked:border-primary/40 has-checked:bg-primary-05">
            <input type="checkbox" name="marketing" defaultChecked={preferences.marketingOptIn} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" />
            <span>
              <span className="block text-[15px] font-semibold text-ink">{t("account.marketing")}</span>
              <span className="mt-0.5 block text-[13.5px] leading-relaxed text-body">{t("account.marketingHint")}</span>
            </span>
          </label>

          <div className="mt-7 border-t border-line pt-7">
            <fieldset>
              <legend className="text-[15px] font-semibold text-ink">{t("account.favouriteSports")}</legend>
              <p className="mt-1 text-[13.5px] text-body">{t("account.favouriteSportsHint")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {sports.map((sport) => (
                  <label key={sport.id} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="sports"
                      value={sport.id}
                      // No live favouriteSportIds source (see CustomerPreferences in account/types.ts); treated as empty.
                      defaultChecked={(preferences.favouriteSportIds ?? []).includes(sport.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`${CHOICE} h-10 px-4 text-[13.5px] peer-checked:border-primary peer-checked:bg-primary-05 peer-checked:font-semibold peer-checked:text-primary-dark peer-checked:[&>svg]:block`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="hidden">
                        <path d="m3.3 7.3 2.4 2.4 5-5.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {sport.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </ActionForm>
      </Panel>
    </PortalShell>
  );
}
