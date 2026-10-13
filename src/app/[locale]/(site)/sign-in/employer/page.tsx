import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { SignInScreen } from "../_components/sign-in-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in/employer">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/sign-in/employer",
    title: t("signIn.kind.employer"),
    description: t("signIn.kindLead.employer"),
    noIndex: true,
  });
}

/** The employer door: see `SignInScreen`. */
export default async function EmployerSignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in/employer">) {
  const locale = resolveLocale((await params).locale);
  return <SignInScreen kind="employer" locale={locale} next={(await searchParams).next} />;
}
