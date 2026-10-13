import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { SignInScreen } from "../_components/sign-in-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in/coach">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/sign-in/coach",
    title: t("signIn.kind.coach"),
    description: t("signIn.kindLead.coach"),
    noIndex: true,
  });
}

/** The coach door: see `SignInScreen`. */
export default async function CoachSignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in/coach">) {
  const locale = resolveLocale((await params).locale);
  return <SignInScreen kind="coach" locale={locale} next={(await searchParams).next} />;
}
