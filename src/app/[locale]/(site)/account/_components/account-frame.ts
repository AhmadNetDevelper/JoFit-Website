import { accountService } from "@/features/account";
import { requireAccount } from "@/features/auth";
import { getFormatters, getTranslator, type Locale, type Translate } from "@/i18n";

import type { PortalTab } from "../../_components/portal/portal-shell";

/**
 * What every account page starts with: the signed-in customer (or a redirect
 * to sign-in that brings them back to `path`), the tabs, and the shell copy.
 *
 * The customer id used for every read comes from HERE — from the server
 * session — and never from a URL or a form.
 */
export async function accountFrame(locale: Locale, path: string) {
  const account = await requireAccount(locale, "customer", path);
  const customerId = account.customerId!;
  const t = getTranslator(locale);
  const reviewable = await accountService.listReviewable(customerId, locale);

  const tabs: readonly PortalTab[] = [
    { href: "/account", label: t("account.overview") },
    { href: "/account/orders", label: t("account.orders") },
    { href: "/account/bookings", label: t("account.bookings") },
    { href: "/account/enrolments", label: t("account.enrolments") },
    { href: "/account/rentals", label: t("account.rentals") },
    { href: "/account/reviews", label: t("account.reviews"), badge: reviewable.length || undefined },
    { href: "/account/applications", label: t("account.applications") },
    { href: "/account/addresses", label: t("account.addresses") },
    { href: "/account/preferences", label: t("account.preferences") },
    { href: "/account/settings", label: t("account.settings") },
  ];

  return {
    account,
    customerId,
    t,
    f: getFormatters(locale),
    shell: {
      locale,
      eyebrow: t("account.eyebrow"),
      tabs,
      signOutLabel: t("account.signOut"),
      navLabel: t("account.title"),
    },
  };
}

/** A lifecycle status in the reader's language. */
export function statusLabel(t: Translate, status: string): string {
  return t(`lifecycle.${status}` as Parameters<Translate>[0]);
}
