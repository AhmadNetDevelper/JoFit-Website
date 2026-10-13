import Link from "next/link";

import { ArrowIcon, buttonClasses } from "@/components/ui";
import { accountService } from "@/features/account";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { PortalIcon } from "../../_components/portal/portal-icons";
import { EmptyNote, PortalNotice, PortalShell, StatusChip } from "../../_components/portal/portal-shell";
import { accountFrame, statusLabel } from "../_components/account-frame";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/enrolments">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account/enrolments", title: getTranslator(locale)("account.enrolments"), noIndex: true });
}

/**
 * Course places. A pending place is held but not yet paid — the page says so
 * and that the academy confirms the fee, rather than leaving the customer to
 * wonder why it is not "active".
 *
 * No fee is printed: course fees in the fixtures are placeholders and the
 * academy gives them on enquiry (see the `jofit-design` skill).
 */
export default async function AccountEnrolmentsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account/enrolments">) {
  const locale = resolveLocale((await params).locale);
  const reserved = (await searchParams).reserved;
  const { customerId, t, f, shell } = await accountFrame(locale, "/account/enrolments");
  const places = await accountService.listEnrolments(customerId, locale);

  return (
    <PortalShell {...shell} active="/account/enrolments" title={t("account.enrolments")} lead={t("account.enrolmentsLead")}>
      {typeof reserved === "string" ? (
        <PortalNotice title={t("account.reservedTitle")} body={t("account.reservedBody", { reference: reserved })} />
      ) : null}
      {places.length === 0 ? (
        <EmptyNote icon="courses" text={t("account.noEnrolments")} href={localePath(locale, "/education")} action={t("account.browseCourses")} />
      ) : (
        <ul className="grid gap-5">
          {places.map((place) => {
            const underway = place.status === "active" || place.status === "completed";
            return (
              <li key={place.id} className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7">
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    {/* The certificate seal: the course is the certificate. */}
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-deep-2 text-accent ring-1 ring-accent/50 ring-offset-2 ring-offset-surface"
                    >
                      <PortalIcon name="courses" size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="font-heading text-[17px] leading-snug font-semibold">
                          <Link
                            href={localePath(locale, place.courseHref)}
                            className="text-ink underline-offset-4 hover:text-primary-dark hover:underline"
                          >
                            {place.courseTitle}
                          </Link>
                        </h2>
                        <StatusChip status={place.status} label={statusLabel(t, place.status)} />
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] text-body">
                        {/* No live cohortStartsOn when none is assigned yet (see AccountEnrolment in account/types.ts) — shown only when present. */}
                        {place.cohortStartsOn ? (
                          <>
                            <span>{t("account.cohortStarts", { date: f.date(place.cohortStartsOn) })}</span>
                            <span aria-hidden="true" className="text-body/40">
                              ·
                            </span>
                          </>
                        ) : null}
                        <span dir="ltr" className="text-[13px] text-body/70">
                          {place.reference}
                        </span>
                      </p>
                      {place.status === "pending" ? (
                        <p className="mt-3 rounded-xl bg-accent-10 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink">
                          {t("account.placeHeldNoFee")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {underway ? (
                    <div>
                      <div className="flex justify-between text-[13px] text-body">
                        <span>{t("account.progress")}</span>
                        <span dir="ltr" className="font-heading font-semibold text-ink">{`${place.progressPercent}%`}</span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-primary-10"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={place.progressPercent}
                        aria-label={t("account.progress")}
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${place.progressPercent}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={localePath(locale, place.courseHref)}
                      className={buttonClasses({ variant: "outline", size: "sm", className: "sm:justify-self-end" })}
                    >
                      {t("account.viewCourse")}
                      <ArrowIcon size={14} />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PortalShell>
  );
}
