import Link from "next/link";

import { ArrowIcon, buttonClasses } from "@/components/ui";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { AccountSecurity } from "../../_components/portal/account-security";
import { Panel, PortalShell } from "../../_components/portal/portal-shell";
import { coachFrame } from "../_components/coach-frame";
import { MailIcon, ShieldIcon } from "../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach/settings">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach/settings", title: getTranslator(locale)("coach.tabSettings"), noIndex: true });
}

const PATH = "/coach/settings";

/**
 * A coach's account & security: the password and the other sessions.
 *
 * The coach's name, photo and sign-in email are part of the profile staff
 * verify before it is listed, so they are not edited here — the page says
 * who changes them, in the same way the profile tab does.
 */
export default async function CoachSettingsPage({ params }: PageProps<"/[locale]/coach/settings">) {
  const locale = resolveLocale((await params).locale);
  const { account, t, shell } = await coachFrame(locale, PATH);
  const contact = t("site.contactEmail");

  return (
    <PortalShell {...shell} active={PATH} title={t("coach.tabSettings")} lead={t("coach.settingsLead")}>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid min-w-0 gap-6">
          <AccountSecurity locale={locale} role="coach" path={PATH} />
        </div>
        <div className="grid min-w-0 gap-6">
          <Panel id="coach-email" title={t("account.emailTitle")}>
            <div className="flex items-center gap-4 rounded-2xl bg-primary-05 px-4 py-4 ring-1 ring-primary/15">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary ring-1 ring-primary/15">
                <MailIcon size={16} />
              </span>
              <dl className="min-w-0">
                <dt className="text-[12.5px] font-semibold text-body">{t("account.currentEmail")}</dt>
                <dd className="mt-0.5 font-semibold break-all text-ink" dir="ltr">
                  {account.email}
                </dd>
              </dl>
            </div>
            <p className="mt-5 text-[14px] leading-relaxed text-body">{t("coach.emailManaged", { email: account.email, contact })}</p>
            <a href={`mailto:${contact}`} className={buttonClasses({ variant: "outline", size: "sm", className: "mt-5" })}>
              <MailIcon size={14} />
              <span dir="ltr">{contact}</span>
            </a>
          </Panel>

          <div className="flex items-start gap-4 rounded-3xl border border-line bg-surface p-6 shadow-soft">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-10 text-accent-strong ring-1 ring-accent/30">
              <ShieldIcon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] leading-relaxed text-body">{t("account.securityNote")}</p>
              <Link
                href={localePath(locale, "/coach/profile")}
                className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary-dark underline-offset-4 hover:underline"
              >
                {t("coach.tabProfile")}
                <ArrowIcon size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
