import { requireAccount } from "@/features/auth";
import { coachPortalService } from "@/features/coach-portal";
import { getFormatters, getTranslator, type Locale } from "@/i18n";

import type { PortalTab } from "../../_components/portal/portal-shell";

/**
 * What every coach page starts with: the signed-in coach (or a redirect to
 * sign-in that returns to `path`), the tabs and the shell copy. The coach id
 * used for every read is the SESSION's — a URL can never name another coach.
 */
export async function coachFrame(locale: Locale, path: string) {
  const account = await requireAccount(locale, "coach", path);
  const coachId = account.coachId!;
  const t = getTranslator(locale);
  const sessions = await coachPortalService.listSessions(coachId, locale);
  const waiting = sessions.filter((row) => row.status === "pending").length;

  const tabs: readonly PortalTab[] = [
    { href: "/coach", label: t("coach.tabToday") },
    { href: "/coach/sessions", label: t("coach.tabSessions"), badge: waiting || undefined },
    { href: "/coach/courses", label: t("coach.tabCourses") },
    { href: "/coach/reviews", label: t("coach.tabReviews") },
    { href: "/coach/profile", label: t("coach.tabProfile") },
    { href: "/coach/settings", label: t("coach.tabSettings") },
  ];

  return {
    account,
    coachId,
    t,
    f: getFormatters(locale),
    shell: {
      locale,
      eyebrow: t("coach.eyebrow"),
      tabs,
      signOutLabel: t("account.signOut"),
      navLabel: t("coach.title"),
    },
  };
}
