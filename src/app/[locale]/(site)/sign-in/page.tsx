import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { SignInScreen } from "./_components/sign-in-screen";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/sign-in",
    title: t("signIn.kind.customer"),
    description: t("signIn.description"),
  });
}

/**
 * THE CUSTOMER DOOR. Coaches and employers have their own (`/sign-in/coach`,
 * `/sign-in/employer`); all three are drawn by `SignInScreen`.
 */
export default async function SignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in">) {
  const locale = resolveLocale((await params).locale);
  return <SignInScreen kind="customer" locale={locale} next={(await searchParams).next} />;
}
