import Link from "next/link";
import { redirect } from "next/navigation";

import { Container, Field, inputClasses, labelClasses } from "@/components/ui";
import { authService, homePathFor, safeReturnPath } from "@/features/auth";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { ActionForm, type FormState } from "../_components/portal/action-form";
import { failed } from "../_components/portal/form-state";
import { AuthPanel } from "../sign-in/_components/auth-panel";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-up">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({ locale, path: "/sign-up", title: t("signUp.title"), description: t("signUp.lead") });
}

/**
 * OPENING A CUSTOMER ACCOUNT.
 *
 * The sign-in screen's twin — the same deep panel beside the same form card on
 * the canvas — because the two are one decision seen from either side. The
 * panel adds the three reasons to open an account. Only customers register
 * here: a coach exists once staff have verified them, so there is no coach
 * option to pick.
 *
 * The new account is written to the same store the admin mirrors, so the
 * person appears in the admin's customer list on its next poll.
 */
export default async function SignUpPage({ params, searchParams }: PageProps<"/[locale]/sign-up">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  const nextParam = (await searchParams).next;
  const returnTo = safeReturnPath(typeof nextParam === "string" ? nextParam : null);

  const existing = await authService.getSession();
  if (existing) redirect(localePath(locale, returnTo ?? homePathFor(existing.account.role)));

  const fallback = t("state.errorTitle");

  async function register(_state: FormState, formData: FormData): Promise<FormState> {
    "use server";
    try {
      await authService.register({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
        locale: formData.get("locale") === "ar" ? "ar" : "en",
        marketingOptIn: formData.get("marketing") === "on",
      });
    } catch (error) {
      return failed(error, fallback);
    }
    redirect(`${localePath(locale, returnTo ?? "/account")}${returnTo ? "" : "?welcome=1"}`);
  }

  const fields = [
    { name: "name", label: t("signUp.name"), type: "text", autoComplete: "name", required: true },
    { name: "email", label: t("signIn.email"), type: "email", autoComplete: "email", required: true, dir: "ltr" as const },
    { name: "phone", label: t("signUp.phone"), type: "tel", autoComplete: "tel", required: false, dir: "ltr" as const },
    { name: "password", label: t("signIn.password"), type: "password", autoComplete: "new-password", required: true, dir: "ltr" as const },
  ];

  return (
    <section data-band aria-labelledby="sign-up-title" className="bg-canvas py-10 sm:py-14 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <AuthPanel locale={locale} t={t} className="max-lg:hidden">
            <ul className="mt-8 max-w-[40ch] space-y-3.5 text-[15px] leading-relaxed text-white/75">
              {[t("signUp.perk1"), t("signUp.perk2"), t("signUp.perk3")].map((perk) => (
                <li key={perk} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/40"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path d="m3 8.4 3.4 3.3L13 4.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </AuthPanel>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-10">
            <p className="eyebrow">{t("nav.account")}</p>
            <h1 id="sign-up-title" className="mt-3 text-[2rem] leading-tight">
              {t("signUp.title")}
            </h1>
            <p className="mt-2 mb-8 text-[15px] text-body">{t("signUp.lead")}</p>

            <ActionForm
              action={register}
              submitLabel={t("signUp.submit")}
              pendingLabel={t("account.working")}
              className="space-y-5"
              submitSize="lg" submitClassName="w-full"
            >
              {fields.map((field) => (
                <Field
                  key={field.name}
                  htmlFor={`signup-${field.name}`}
                  label={
                    <>
                      {field.label}
                      {field.required ? null : (
                        <span className="ms-2 text-[12.5px] font-normal text-body/60">{t("booking.goalOptional")}</span>
                      )}
                    </>
                  }
                >
                  <input
                    id={`signup-${field.name}`}
                    name={field.name}
                    type={field.type}
                    required={field.required}
                    minLength={field.name === "password" ? 8 : undefined}
                    autoComplete={field.autoComplete}
                    dir={field.dir ?? "auto"}
                    className={inputClasses()}
                  />
                </Field>
              ))}

              <fieldset>
                <legend className={labelClasses}>{t("account.language")}</legend>
                <div className="flex gap-2">
                  {(["ar", "en"] as const).map((value) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name="locale" value={value} defaultChecked={value === locale} className="peer sr-only" />
                      <span className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-5 text-[14px] font-semibold text-ink transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:border-primary/50">
                        <span lang={value}>{value === "ar" ? "العربية" : "English"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-body select-none">
                <input type="checkbox" name="marketing" className="size-4 cursor-pointer accent-primary" />
                {t("account.marketing")}
              </label>
            </ActionForm>

            <p className="mt-8 border-t border-line pt-6 text-[14px] text-body">
              {t("signUp.haveAccount")}{" "}
              <Link
                href={`${localePath(locale, "/sign-in")}${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`}
                className="font-semibold text-primary-dark underline decoration-1 underline-offset-4 hover:text-primary"
              >
                {t("signIn.title")}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
