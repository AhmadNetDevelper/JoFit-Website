import { requireAccount } from "@/features/auth";
import type { EmployerVerificationStatus } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getFormatters, getTranslator, localePath, type Locale } from "@/i18n";

import type { PortalTab } from "../../_components/portal/portal-shell";

/** What the verification banner says, resolved on the server. Absent once verified. */
export interface VerificationBannerCopy {
  readonly status: Exclude<EmployerVerificationStatus, "verified">;
  readonly title: string;
  readonly body: string;
  readonly noteLabel: string;
  /** Why staff rejected or suspended it, as staff wrote it. */
  readonly note?: string;
  readonly contactLabel: string;
  readonly contactHref: string;
}

/**
 * What every employer page starts with: the signed-in employer (or a redirect
 * to sign-in that returns to `path`; a customer or coach goes to their own
 * area), the tabs with what is waiting, and the shell copy — including the
 * verification banner, which every page shows until JoFit has verified the
 * company.
 *
 * The employer id used for every read is the SESSION's. A URL or a form can
 * never name another company.
 */
export async function employerFrame(locale: Locale, path: string) {
  const account = await requireAccount(locale, "employer", path);
  const employerId = account.employerId!;
  const t = getTranslator(locale);
  /* One read gives the tabs their counts AND the company's standing. */
  const dashboard = await employerPortalService.getDashboard(employerId, locale);
  const { employer, counts } = dashboard;

  const tabs: readonly PortalTab[] = [
    { href: "/employer", label: t("employer.tabDashboard") },
    { href: "/employer/jobs", label: t("employer.tabJobs"), badge: counts.pendingJobs || undefined },
    { href: "/employer/applications", label: t("employer.tabApplications"), badge: counts.newApplications || undefined },
    { href: "/employer/profile", label: t("employer.tabProfile") },
    { href: "/employer/settings", label: t("employer.tabSettings") },
  ];

  const status = employer.verificationStatus;
  const banner: VerificationBannerCopy | undefined =
    status === "verified"
      ? undefined
      : {
          status,
          title: t(
            status === "pending"
              ? "employer.bannerPendingTitle"
              : status === "rejected"
                ? "employer.bannerRejectedTitle"
                : "employer.bannerSuspendedTitle",
          ),
          body: t(
            status === "pending"
              ? "employer.bannerPending"
              : status === "rejected"
                ? "employer.bannerRejected"
                : "employer.bannerSuspended",
          ),
          noteLabel: t("employer.bannerNote"),
          note: status === "pending" ? undefined : employer.verificationNote,
          contactLabel: t("employer.contactJoFit"),
          contactHref: localePath(locale, "/contact"),
        };

  return {
    account,
    employerId,
    employer,
    dashboard,
    /** The company may not send jobs to review: suspended or refused verification. */
    blocked: status === "rejected" || status === "suspended",
    t,
    f: getFormatters(locale),
    shell: {
      locale,
      eyebrow: t("employer.eyebrow"),
      tabs,
      signOutLabel: t("account.signOut"),
      navLabel: t("employer.title"),
      banner,
    },
  };
}
