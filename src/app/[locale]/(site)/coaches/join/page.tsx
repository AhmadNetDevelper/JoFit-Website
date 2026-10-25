import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonClasses, PageHero, Rosette, Section } from "@/components/ui";
import { authService, homePathFor } from "@/features/auth";
import { coachRegistrationService, DIAL_CODES } from "@/features/coach-registration";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { signOutAction } from "../../_components/portal/auth-actions";
import { CoachRegistrationForm } from "./_components/coach-registration-form";
import { loadCities, registerCoachAction } from "./actions";
import { COPY_KEYS, type FormCopy } from "./form-copy";
import { ERROR_KEYS, type ErrorMessages } from "./parse-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/coaches/join">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/coaches/join",
    title: t("coachJoin.metaTitle"),
    description: t("coachJoin.metaDescription"),
  });
}

/**
 * REGISTER AS A COACH — `POST /v1/auth/register-coach`.
 *
 *   PageHero compact  who this is for
 *   the form          seven numbered cards (personal information, the coach
 *                     page, education, certificates, experience, skills,
 *                     photo), beside the DEEP PANEL: what happens after
 *                     sending, a jump list to each part, and the way to sign in
 *
 * The structure is Mudarrib's (`docs/mudarrib-coach-registration.md`), which
 * the live API copies; the faults that page has are fixed in the form. The
 * account is created but not signed in — the API answers the new user, not a
 * session — so success points to the coach sign-in.
 */
export default async function CoachJoinPage({ params }: PageProps<"/[locale]/coaches/join">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const session = await authService.getSession();
  if (session?.account.role === "coach") redirect(localePath(locale, homePathFor("coach")));
  const options = session ? undefined : await coachRegistrationService.listOptions(locale);

  const copy = Object.fromEntries(COPY_KEYS.map((key) => [key, t(`coachJoin.${key}`)])) as FormCopy;
  const messages = Object.fromEntries(ERROR_KEYS.map((key) => [key, t(`coachJoin.err.${key}`)])) as ErrorMessages;
  const regions = new Intl.DisplayNames([locale], { type: "region" });
  /* The code in its own left-to-right isolate, or the Arabic name beside it flips the "+" to the far end ("962+"). */
  const dialCodes = DIAL_CODES.map(({ region, code }) => ({
    code,
    label: `⁦${code}⁩ ‎· ${regions.of(region) ?? region}`,
  }));

  const signInHref = localePath(locale, "/sign-in/coach");
  const steps = [
    { title: t("coachJoin.step1"), body: t("coachJoin.step1Body") },
    { title: t("coachJoin.step2"), body: t("coachJoin.step2Body") },
    { title: t("coachJoin.step3"), body: t("coachJoin.step3Body") },
  ];
  const parts = [
    { id: "personal", label: t("coachJoin.personalTitle") },
    { id: "profile", label: t("coachJoin.profileTitle") },
    { id: "education", label: t("coachJoin.educationTitle") },
    { id: "certificates", label: t("coachJoin.certificatesTitle") },
    { id: "experience", label: t("coachJoin.experienceTitle") },
    { id: "skills", label: t("coachJoin.skillsTitle") },
    { id: "photo", label: t("coachJoin.photoTitle") },
  ];

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("coaches.title"), href: localePath(locale, "/coaches") },
          { label: t("coachJoin.eyebrow") },
        ]}
        eyebrow={t("coachJoin.eyebrow")}
        title={t("coachJoin.heroTitle")}
        lead={t("coachJoin.heroLead")}
      />

      <Section tone="muted">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10">
          <div className="min-w-0">
            {options ? (
              <CoachRegistrationForm
                locale={locale}
                options={options}
                dialCodes={dialCodes}
                copy={copy}
                messages={messages}
                action={registerCoachAction}
                loadCities={loadCities.bind(null, locale)}
                termsHref={localePath(locale, "/terms")}
                privacyHref={localePath(locale, "/privacy")}
                signInHref={signInHref}
                homeHref={localePath(locale, "/")}
              />
            ) : (
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
                <p className="font-heading text-[1.15rem] font-semibold text-ink">{t("coachJoin.signedInTitle")}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-body">{t("coachJoin.signedInBody")}</p>
                <form action={signOutAction} className="mt-6">
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className={buttonClasses({ variant: "outline" })}>
                    {t("account.signOut")}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* THE DEEP PANEL: what happens after sending and the way in for a
              registered coach; under it, a jump list to the seven parts of a
              long form, which stays in view while the form scrolls (the column
              stretches the full row so the list has room to stick). */}
          <div className="space-y-6 lg:self-stretch">
            <aside className="relative isolate overflow-hidden rounded-[2rem] bg-deep p-7 text-white/75 sm:p-8">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
              <span aria-hidden="true" className="absolute -end-32 -bottom-32 -z-10 size-80 text-accent/[0.12]">
                <Rosette className="spin-slow size-full" />
              </span>

              <h2 id="coach-join-steps" className="text-[1.3rem] leading-snug text-white">
                {t("coachJoin.stepsTitle")}
              </h2>
              <ol aria-labelledby="coach-join-steps" className="mt-6 space-y-5">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-4">
                    <span
                      dir="ltr"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[14px] font-bold text-accent ring-1 ring-accent/50 ring-offset-2 ring-offset-deep"
                    >
                      {number(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 pt-1">
                      <span className="block font-heading text-[15.5px] leading-snug font-semibold text-white">{step.title}</span>
                      <span className="mt-1 block text-[14px] leading-relaxed text-white/65">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-[14px] text-white/70">{t("coachJoin.haveAccount")}</p>
                <Link href={signInHref} className={buttonClasses({ variant: "ghostDark", className: "mt-3" })}>
                  {t("coachJoin.signIn")}
                </Link>
              </div>
            </aside>
            {options ? (
              <nav aria-labelledby="coach-join-parts" className="rounded-3xl border border-line bg-surface p-6 shadow-soft max-lg:hidden lg:sticky lg:top-28">
                <p id="coach-join-parts" className="font-heading text-[15px] font-semibold text-ink">
                  {t("coachJoin.partsTitle")}
                </p>
                <ol className="mt-3 space-y-0.5">
                  {parts.map((part, index) => (
                    <li key={part.id}>
                      <a
                        href={`#${part.id}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[14px] text-body transition-colors hover:bg-primary-05 hover:text-primary-dark"
                      >
                        <span dir="ltr" className="w-6 shrink-0 font-heading text-[12.5px] font-bold text-accent-strong">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {part.label}
                        {index > 1 ? <span className="text-[12.5px] text-body/55">{t("coachJoin.optional")}</span> : null}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
          </div>
        </div>
      </Section>
    </>
  );
}
