import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonClasses, Field, inputClasses, PageHero, Rosette, Section, selectClasses } from "@/components/ui";
import { authService, homePathFor } from "@/features/auth";
import { careersService, EMPLOYER_KINDS, JOB_CITIES, type EmployerKind, type JobCity } from "@/features/careers";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata, fieldErrorsOf, isAppError } from "@/lib";

import { ActionForm, type FormState } from "../../../_components/portal/action-form";
import { signOutAction } from "../../../_components/portal/auth-actions";
import { failed } from "../../../_components/portal/form-state";
import { PasswordField } from "../../../_components/portal/password-field";
import { ShieldIcon } from "../../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/careers/employers/join">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/careers/employers/join",
    title: t("careers.join.metaTitle"),
    description: t("careers.join.metaDescription"),
  });
}

/* A URL inside an Arabic sentence is reordered by the bidi algorithm
   ("//:https") unless it is isolated as a left-to-right run. */
const URL_EXAMPLE = "\u2066https://\u2069";

/**
 * OPENING AN EMPLOYER ACCOUNT — the other half of the marketplace.
 *
 *   PageHero compact  who this is for
 *   the form          in a card, beside the DEEP PANEL: the three steps on
 *                     numbered seals (open the account → JoFit verifies the
 *                     company → the jobs go live after review), what the
 *                     company can do while it waits, and the way to sign in
 *
 * `registerEmployer` creates the company `pending` verification and signs the
 * new account in, so success goes straight to the employer area. The obvious
 * mistakes are caught here first, in the reader's language; the service still
 * decides, and an address that already has an account comes back as a
 * translated field error too.
 */
export default async function EmployerJoinPage({ params }: PageProps<"/[locale]/careers/employers/join">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const session = await authService.getSession();
  if (session?.account.role === "employer") redirect(localePath(locale, homePathFor("employer")));
  const cities = await careersService.listCities(locale);

  const copy = {
    fallback: t("state.errorTitle"),
    fix: t("account.fixFields"),
    taken: t("account.errorEmailTaken"),
    fields: {
      companyName: t("careers.join.errorCompany"),
      kind: t("careers.join.errorKind"),
      cityId: t("careers.join.errorCity"),
      contactName: t("careers.join.errorContact"),
      email: t("account.errorEmail"),
      phone: t("account.errorPhone"),
      website: t("careers.join.errorWebsite", { example: URL_EXAMPLE }),
      password: t("account.errorPasswordShort"),
    } as Record<string, string>,
  };

  async function register(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const text = (key: string) => String(formData.get(key) ?? "").trim();
    const input = {
      companyName: text("companyName").replace(/\s+/g, " "),
      kind: text("kind") as EmployerKind,
      cityId: text("cityId") as JobCity,
      contactName: text("contactName").replace(/\s+/g, " "),
      email: text("email").toLowerCase(),
      phone: text("phone"),
      website: text("website") || undefined,
      password: String(formData.get("password") ?? ""),
      locale,
    };

    /* The same checks the service makes, answered in the reader's language. */
    const fieldErrors: Record<string, string> = {};
    if (input.companyName.length < 2) fieldErrors.companyName = copy.fields.companyName;
    if (!(EMPLOYER_KINDS as readonly string[]).includes(input.kind)) fieldErrors.kind = copy.fields.kind;
    if (!(JOB_CITIES as readonly string[]).includes(input.cityId)) fieldErrors.cityId = copy.fields.cityId;
    if (input.contactName.length < 3 || !input.contactName.includes(" ")) fieldErrors.contactName = copy.fields.contactName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) fieldErrors.email = copy.fields.email;
    if (!/^\+?[\d\s]{8,}$/.test(input.phone)) fieldErrors.phone = copy.fields.phone;
    if (input.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(input.website)) fieldErrors.website = copy.fields.website;
    if (input.password.length < 8) fieldErrors.password = copy.fields.password;
    if (Object.keys(fieldErrors).length > 0) return { status: "error", message: copy.fix, fieldErrors };

    try {
      await authService.registerEmployer(input);
    } catch (error) {
      if (isAppError(error) && error.code === "conflict") {
        return { status: "error", message: copy.taken, fieldErrors: { email: copy.taken } };
      }
      if (isAppError(error) && error.code === "validation") {
        const translated = Object.fromEntries(
          Object.keys(fieldErrorsOf(error)).map((key) => [key, copy.fields[key] ?? copy.fix]),
        );
        return { status: "error", message: copy.fix, fieldErrors: translated };
      }
      return failed(error, copy.fallback);
    }
    /* `redirect` throws to navigate, so it sits outside the try. */
    redirect(localePath(locale, homePathFor("employer")));
  }

  const steps = [
    { title: t("careers.join.step1"), body: t("careers.join.step1Body") },
    { title: t("careers.join.step2"), body: t("careers.join.step2Body") },
    { title: t("careers.join.step3"), body: t("careers.join.step3Body") },
  ];
  const optional = <span className="font-normal text-body/70">{t("booking.goalOptional")}</span>;
  const signInHref = `${localePath(locale, "/sign-in/employer")}?next=${encodeURIComponent("/employer")}`;

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("nav.careers"), href: localePath(locale, "/careers") },
          { label: t("careers.join.eyebrow") },
        ]}
        eyebrow={t("careers.join.eyebrow")}
        title={t("careers.join.heroTitle")}
        lead={t("careers.join.heroLead")}
      />

      <Section labelledBy="join-form">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
            <h2 id="join-form" className="text-[1.6rem] leading-tight sm:text-[1.85rem]">
              {t("careers.join.formTitle")}
            </h2>

            {session ? (
              <div className="mt-6 rounded-2xl border border-line bg-canvas px-5 py-5">
                <p className="font-heading text-[1.05rem] font-semibold text-ink">{t("careers.join.signedInTitle")}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-body">{t("careers.join.signedInBody")}</p>
                <form action={signOutAction} className="mt-5">
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className={buttonClasses({ variant: "outline" })}>
                    {t("account.signOut")}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <p className="mt-3 text-[15px] leading-relaxed text-body">{t("careers.join.formLead")}</p>
                <ActionForm
                  action={register}
                  submitLabel={t("careers.join.submit")}
                  pendingLabel={t("account.working")}
                  className="mt-8 [&>button]:mt-8"
                  submitSize="lg" submitClassName="w-full"
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={t("careers.join.companyName")} htmlFor="join-company" className="sm:col-span-2">
                      <input
                        id="join-company"
                        name="companyName"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="organization"
                        dir="auto"
                        className={inputClasses()}
                      />
                    </Field>

                    <Field label={t("careers.join.kind")} htmlFor="join-kind">
                      <select id="join-kind" name="kind" required defaultValue="" className={selectClasses()}>
                        <option value="" disabled>
                          {t("careers.join.choose")}
                        </option>
                        {EMPLOYER_KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {t(`careers.kind.${kind}`)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={t("careers.join.city")} htmlFor="join-city">
                      <select id="join-city" name="cityId" required defaultValue="" className={selectClasses()}>
                        <option value="" disabled>
                          {t("careers.join.choose")}
                        </option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      label={t("careers.join.contactName")}
                      htmlFor="join-contact"
                      hint={t("careers.join.contactHint")}
                      className="sm:col-span-2"
                    >
                      <input
                        id="join-contact"
                        name="contactName"
                        required
                        autoComplete="name"
                        dir="auto"
                        aria-describedby="join-contact-hint"
                        className={inputClasses()}
                      />
                    </Field>

                    <Field label={t("careers.join.email")} htmlFor="join-email" hint={t("careers.join.emailHint")}>
                      <input
                        id="join-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        dir="ltr"
                        aria-describedby="join-email-hint"
                        className={inputClasses()}
                      />
                    </Field>

                    <Field label={t("careers.join.phone")} htmlFor="join-phone">
                      <input id="join-phone" name="phone" type="tel" required autoComplete="tel" dir="ltr" className={inputClasses()} />
                    </Field>

                    <Field
                      label={
                        <>
                          {t("careers.join.website")} {optional}
                        </>
                      }
                      htmlFor="join-website"
                      hint={t("careers.join.websiteHint", { example: URL_EXAMPLE })}
                      className="sm:col-span-2"
                    >
                      <input
                        id="join-website"
                        name="website"
                        type="url"
                        autoComplete="url"
                        placeholder="https://"
                        dir="ltr"
                        aria-describedby="join-website-hint"
                        className={inputClasses()}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <PasswordField
                        id="join-password"
                        name="password"
                        label={t("careers.join.password")}
                        hint={t("careers.join.passwordHint")}
                        autoComplete="new-password"
                        showLabel={t("signIn.showPassword")}
                        hideLabel={t("signIn.hidePassword")}
                      />
                    </div>
                  </div>
                </ActionForm>
              </>
            )}
          </div>

          {/* THE DEEP PANEL: what happens after the form — the three steps on
              numbered seals, what the company can do while it waits, and the
              way back in for an employer who already has an account. */}
          <aside className="relative isolate overflow-hidden rounded-[2rem] bg-deep p-7 text-white/75 sm:p-8 lg:sticky lg:top-28">
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.04]" />
            <span aria-hidden="true" className="absolute -end-32 -bottom-32 -z-10 size-80 text-accent/[0.12]">
              <Rosette className="spin-slow size-full" />
            </span>

            <h2 id="join-steps" className="text-[1.3rem] leading-snug text-white">
              {t("careers.join.stepsTitle")}
            </h2>
            <ol aria-labelledby="join-steps" className="mt-6 space-y-5">
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

            <div className="mt-8 rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10">
              <p className="flex items-center gap-2.5 text-accent">
                <ShieldIcon size={18} />
                <span className="font-heading text-[15px] font-semibold text-white">{t("careers.join.asideTitle")}</span>
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/70">{t("careers.join.asideBody")}</p>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-[14px] text-white/70">{t("careers.join.haveAccount")}</p>
              <Link href={signInHref} className={buttonClasses({ variant: "ghostDark", className: "mt-3" })}>
                {t("careers.join.signIn")}
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
