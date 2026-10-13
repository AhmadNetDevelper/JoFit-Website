import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui";
import { apiConfig, siteConfig } from "@/config";
import {
  authService,
  FIXTURE_EMAIL,
  FIXTURE_PASSWORD,
  homePathFor,
  safeReturnPath,
  type AccountRole,
} from "@/features/auth";
import { getTranslator, localePath, type Locale, type TranslationKey } from "@/i18n";
import { isAppError } from "@/lib";

import { ACCOUNT_KIND_TONE, ACCOUNT_KINDS, AccountKindIcon } from "../../../_components/account-kind";
import { SignInForm } from "../sign-in-form";
import { AuthPanel, type AuthPanelTone } from "./auth-panel";

/**
 * ONE SIGN-IN DOOR PER KIND OF ACCOUNT.
 *
 * The header offers three — customer, coach, employer — and each has its own
 * page (`/sign-in`, `/sign-in/coach`, `/sign-in/employer`) drawn by this one
 * component, so they cannot drift apart. What differs is the words, the demo
 * accounts offered, where "no account yet" leads — and THE COLOUR. Each door
 * owns one of the palette's three grounds (`account-kind.tsx`): the stripe on
 * the card, the badge with the glyph, the filled pill and the glow in the deep
 * panel all take it, so a coach never wonders whether this is the right room.
 *
 * A door only opens for its own kind. Someone who signs in to the wrong one is
 * signed straight out again and told which door is theirs: letting a coach in
 * through the customer page would leave two screens that both claim to be the
 * front door.
 */
const KINDS: Record<
  AccountRole,
  {
    path: string;
    title: TranslationKey;
    eyebrow: TranslationKey;
    lead: TranslationKey;
    noAccount: TranslationKey;
    createAccount: TranslationKey;
    createHref: string;
    role: TranslationKey;
    panel: AuthPanelTone;
  }
> = {
  customer: {
    path: "/sign-in",
    title: "signIn.kind.customer",
    eyebrow: "signIn.doorEyebrow.customer",
    lead: "signIn.kindLead.customer",
    noAccount: "signIn.noAccount",
    createAccount: "signIn.createAccount",
    createHref: "/sign-up",
    role: "signIn.role.customer",
    panel: "primary",
  },
  coach: {
    path: "/sign-in/coach",
    title: "signIn.kind.coach",
    eyebrow: "signIn.doorEyebrow.coach",
    lead: "signIn.kindLead.coach",
    noAccount: "signIn.noAccount.coach",
    createAccount: "signIn.createAccount.coach",
    createHref: "/coaches/join",
    role: "signIn.role.coach",
    panel: "accent",
  },
  employer: {
    path: "/sign-in/employer",
    title: "signIn.kind.employer",
    eyebrow: "signIn.doorEyebrow.employer",
    lead: "signIn.kindLead.employer",
    noAccount: "signIn.noAccount.employer",
    createAccount: "signIn.createAccount.employer",
    createHref: "/careers/employers/join",
    role: "signIn.role.employer",
    panel: "deep",
  },
};

export const signInPath = (kind: AccountRole) => KINDS[kind].path;

export async function SignInScreen({
  kind,
  locale,
  next,
}: {
  kind: AccountRole;
  locale: Locale;
  next: string | string[] | undefined;
}) {
  const t = getTranslator(locale);
  const config = KINDS[kind];
  const tone = ACCOUNT_KIND_TONE[kind];
  const returnTo = safeReturnPath(typeof next === "string" ? next : null);
  const query = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";

  /* Someone already signed in has nothing to do here. */
  const existing = await authService.getSession();
  if (existing) redirect(localePath(locale, returnTo ?? homePathFor(existing.account.role)));

  const demoAccounts =
    apiConfig.dataSource === "mock"
      ? (await authService.listDemoAccounts(locale)).filter((demo) => demo.role === kind)
      : [];

  /* Strings, not the translator: an inline Server Action's closure is bound
     into the action reference and has to be serialisable. */
  const genericErrorMessage = t("state.errorTitle");
  const staffMessage = t("signIn.staff", { url: siteConfig.adminConsoleUrl });
  const roleName = t(config.role);
  const wrongRoleMessages: Partial<Record<AccountRole, string>> = {
    customer: t("signIn.wrongRole", { role: t("signIn.role.customer") }),
    coach: t("signIn.wrongRole", { role: t("signIn.role.coach") }),
    employer: t("signIn.wrongRole", { role: t("signIn.role.employer") }),
  };

  /* ON SUCCESS IT REDIRECTS, after the try block — `redirect` works by
     throwing, and inside it the catch would swallow the navigation. */
  async function signIn(email: string, password: string): Promise<string | null> {
    "use server";
    let destination: string;
    try {
      const session = await authService.signIn({ email, password });
      if (session.account.role !== kind) {
        await authService.signOut();
        return wrongRoleMessages[session.account.role] ?? roleName;
      }
      destination = returnTo ?? homePathFor(session.account.role);
    } catch (error) {
      if (isAppError(error) && error.code === "forbidden") return staffMessage;
      return isAppError(error) ? error.message : genericErrorMessage;
    }
    redirect(localePath(locale, destination));
  }

  const others = ACCOUNT_KINDS.filter((entry) => entry !== kind);

  return (
    <section data-band aria-labelledby="sign-in-title" className="bg-canvas py-10 sm:py-14 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <AuthPanel
            locale={locale}
            t={t}
            tone={config.panel}
            className="max-lg:hidden"
            badge={
              <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 py-1.5 ps-1.5 pe-4 text-[13px] font-semibold text-white ring-1 ring-white/20">
                <span className={`grid size-8 place-items-center rounded-full ${tone.badge}`}>
                  <AccountKindIcon kind={kind} size={16} />
                </span>
                {t(config.eyebrow)}
              </span>
            }
          />

          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-10">
            {/* The door's colour, as a stripe along the head of the card. */}
            <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${tone.stripe}`} />

            <div className="flex items-center gap-3">
              <span className={`grid size-12 shrink-0 place-items-center rounded-full ${tone.badge} shadow-soft`}>
                <AccountKindIcon kind={kind} size={22} />
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-semibold ${tone.chip}`}>
                {t(config.eyebrow)}
              </span>
            </div>

            <h1 id="sign-in-title" className="mt-5 text-[2rem] leading-tight">
              {t(config.title)}
            </h1>
            <p className="mt-2 mb-8 text-[15px] text-body">{t(config.lead)}</p>

            <SignInForm
              action={signIn}
              variant={tone.button}
              /* Prefilled ONLY while the mock adapter answers, and only with
                 the demo account of THIS door's kind. */
              defaults={
                apiConfig.dataSource === "mock"
                  ? {
                      email: demoAccounts[0]?.email ?? FIXTURE_EMAIL,
                      password: FIXTURE_PASSWORD,
                    }
                  : { email: "", password: "" }
              }
              createAccountHref={`${localePath(locale, config.createHref)}${kind === "customer" ? query : ""}`}
              demoAccounts={demoAccounts.map((demo) => ({ email: demo.email, label: demo.name }))}
              copy={{
                demoTitle: t("signIn.demoTitle"),
                emailLabel: t("signIn.email"),
                emailPlaceholder: t("signIn.emailPlaceholder"),
                passwordLabel: t("signIn.password"),
                passwordPlaceholder: t("signIn.passwordPlaceholder"),
                submit: t("signIn.submit"),
                submitting: t("signIn.submitting"),
                showPassword: t("signIn.showPassword"),
                hidePassword: t("signIn.hidePassword"),
                fixtureNotice: t("signIn.fixtureNotice", { email: FIXTURE_EMAIL }),
                success: t("signIn.success"),
                remember: t("signIn.remember"),
                noAccount: t(config.noAccount),
                createAccount: t(config.createAccount),
              }}
            />

            {/* The other two doors, each in its own colour, for whoever came
                through the wrong one. */}
            <div className="mt-8 border-t border-line pt-6 text-[14px] text-body">
              <p>{t("signIn.otherDoors")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {others.map((entry) => (
                  <li key={entry}>
                    <Link
                      href={`${localePath(locale, KINDS[entry].path)}${query}`}
                      className={`inline-flex items-center gap-2 rounded-full py-1.5 ps-1.5 pe-3.5 text-[13px] font-semibold transition-[filter] hover:brightness-95 ${ACCOUNT_KIND_TONE[entry].chip}`}
                    >
                      <span className={`grid size-6 place-items-center rounded-full ${ACCOUNT_KIND_TONE[entry].badge}`}>
                        <AccountKindIcon kind={entry} size={13} />
                      </span>
                      {t(KINDS[entry].title)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-[14px]">
              <Link
                href={localePath(locale, "/")}
                className="font-medium text-primary-dark underline-offset-4 hover:underline"
              >
                {t("signIn.backHome")}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
