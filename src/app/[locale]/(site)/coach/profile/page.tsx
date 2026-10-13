import Link from "next/link";

import { ArrowIcon, buttonClasses, Reveal, Rosette } from "@/components/ui";
import { coachPortalService } from "@/features/coach-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { Panel, PortalShell } from "../../_components/portal/portal-shell";
import { coachFrame } from "../_components/coach-frame";
import { ClockIcon, MailIcon } from "../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach/profile">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach/profile", title: getTranslator(locale)("coach.tabProfile"), noIndex: true });
}

/**
 * The profile and price list as the storefront sells them.
 *
 * Read-only on purpose. A coach's profile is verified by staff before it is
 * listed; letting it be edited here would publish unverified claims. Changes
 * go through the academy, and the page says how — on the deep panel, the one
 * dark block here, because it is the thing a coach looking for an "edit"
 * button needs to read.
 */
export default async function CoachProfilePage({ params }: PageProps<"/[locale]/coach/profile">) {
  const locale = resolveLocale((await params).locale);
  const { coachId, account, t, f, shell } = await coachFrame(locale, "/coach/profile");
  const [dashboard, packages] = await Promise.all([
    coachPortalService.getDashboard(coachId, locale),
    coachPortalService.listPackages(coachId, locale),
  ]);

  return (
    <PortalShell {...shell} active="/coach/profile" title={dashboard.coach.name} lead={dashboard.coach.headline}>
      <div className="grid gap-6">
        <Panel id="packages" title={t("coach.packages")} lead={t("coach.packagesLead")} className="min-w-0">
          <Reveal stagger as="ul" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, index) => {
              const lead = index === 0;
              return (
                <li key={pkg.id} className="flex">
                  <div
                    className={`relative flex w-full flex-col overflow-hidden rounded-2xl border p-6 ${
                      lead ? "border-primary/35 bg-primary-05" : "border-line bg-surface"
                    }`}
                  >
                    {lead ? (
                      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-primary" />
                    ) : null}
                    <span className="font-heading text-[17px] leading-snug font-semibold text-ink">{pkg.name}</span>
                    <span className="mt-2 flex-1 text-[13.5px] leading-relaxed text-body">
                      {`${t("booking.packageMinutes", { count: f.number(pkg.durationMinutes) })} · ${t(pkg.mode === "online" ? "booking.packageOnline" : "booking.packageInPerson")}`}
                      {pkg.sessionCount > 1 ? ` · ${t("booking.packageSessions", { count: f.number(pkg.sessionCount) })}` : ""}
                    </span>
                    {/* Two lines reserved, so a struck-through old price does not
                        lift this card's rule above its neighbours'. */}
                    <span className="mt-5 flex min-h-17 flex-wrap content-start items-baseline gap-x-3 gap-y-1 border-t border-line pt-4">
                      <span dir="ltr" className="font-heading text-[1.5rem] leading-none font-bold text-primary-dark">
                        {f.money(pkg.price)}
                      </span>
                      {pkg.compareAtPrice ? (
                        <s dir="ltr" className="text-[14px] text-body/60">
                          {f.money(pkg.compareAtPrice)}
                        </s>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </Reveal>
        </Panel>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel id="account" title={t("coach.yourAccount")}>
            <div className="grid gap-4 text-[14px]">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15">
                  <MailIcon size={15} />
                </span>
                <dl className="min-w-0">
                  <dt className="text-[12.5px] text-body">{t("signIn.email")}</dt>
                  <dd dir="ltr" className="mt-0.5 font-semibold break-all text-ink">
                    {account.email}
                  </dd>
                </dl>
              </div>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15">
                  <ClockIcon size={15} />
                </span>
                <dl>
                  <dt className="text-[12.5px] text-body">{t("coach.responseTime")}</dt>
                  {/* No live source — `CoachDashboard.coach.responseTimeHours`; shown as 0 rather than omitted. */}
                  <dd className="mt-0.5 font-semibold text-ink">{t("coach.hours", { count: f.number(dashboard.coach.responseTimeHours ?? 0) })}</dd>
                </dl>
              </div>
            </div>
            {/* No live source for the coach's own profile href — omit the link rather than guess one. */}
            {dashboard.coach.href ? (
              <Link
                href={localePath(locale, dashboard.coach.href)}
                className={buttonClasses({ variant: "outline", className: "mt-6 w-full" })}
              >
                {t("coach.viewProfile")}
                <ArrowIcon />
              </Link>
            ) : null}
          </Panel>

          <section
            aria-labelledby="changes"
            className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7"
          >
            <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
            <span aria-hidden="true" className="absolute -end-20 -bottom-20 -z-10 size-56 text-accent/16">
              <Rosette className="spin-slow size-full" />
            </span>
            <h2 id="changes" className="text-[1.2rem] leading-snug text-white">
              {t("coach.changesTitle")}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent/70" />
            <p className="mt-4 text-[14px] leading-relaxed text-white/75">{t("coach.changesBody")}</p>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "gold", className: "mt-6" })}>
              {t("nav.contact")}
            </Link>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
