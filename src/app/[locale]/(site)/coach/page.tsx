import Link from "next/link";

import { ArrowIcon, buttonClasses, Reveal, Rosette } from "@/components/ui";
import { coachPortalService } from "@/features/coach-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { EmptyNote, Panel, PortalShell } from "../_components/portal/portal-shell";
import { coachFrame } from "./_components/coach-frame";
import { FigureTile } from "./_components/figure-tile";
import { CalendarIcon, DoneIcon, InboxIcon, StarIcon, UsersIcon } from "./_components/icons";
import { SessionCard } from "./_components/session-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach", title: getTranslator(locale)("coach.title"), noIndex: true });
}

/**
 * THE COACH'S DAY.
 *
 * Requests first, because a customer is waiting on each one and the profile
 * promises a reply within N hours. Then what is confirmed and coming up, then
 * the month's figures. A coach who opens this at 7am should be able to act on
 * everything that needs them without leaving the page.
 *
 * The figures are a row of tiles; the one that means somebody is waiting takes
 * the deep green while it is above zero, so it is the first thing read. The
 * takings sit on the deep panel with the rosette, the one dark block here.
 */
export default async function CoachDashboardPage({ params }: PageProps<"/[locale]/coach">) {
  const locale = resolveLocale((await params).locale);
  const { coachId, t, f, shell } = await coachFrame(locale, "/coach");
  const dashboard = await coachPortalService.getDashboard(coachId, locale);
  const firstName = dashboard.coach.name.split(" ")[0] ?? dashboard.coach.name;

  const figures = [
    {
      icon: <InboxIcon size={18} />,
      value: f.number(dashboard.counts.awaitingConfirmation),
      label: t("coach.figureRequests"),
      highlight: dashboard.counts.awaitingConfirmation > 0,
    },
    { icon: <CalendarIcon size={18} />, value: f.number(dashboard.counts.upcoming), label: t("coach.figureUpcoming") },
    { icon: <DoneIcon size={18} />, value: f.number(dashboard.counts.deliveredThisMonth), label: t("coach.figureDelivered") },
    // No live source for a distinct-student count — see `CoachDashboard.counts.students`; shown as 0 rather than omitted.
    { icon: <UsersIcon size={18} />, value: f.number(dashboard.counts.students ?? 0), label: t("coach.figureStudents") },
  ];

  return (
    <PortalShell
      {...shell}
      active="/coach"
      title={t("coach.greeting", { name: firstName })}
      // No live source for response-time — see `CoachDashboard.coach.responseTimeHours`; shown as 0 rather than omitted.
      lead={t("coach.dashboardLead", { hours: f.number(dashboard.coach.responseTimeHours ?? 0) })}
      actions={
        // No live source for the coach's own profile href — omit the link rather than guess one.
        dashboard.coach.href ? (
          <Link href={localePath(locale, dashboard.coach.href)} className={buttonClasses({ variant: "ghostDark" })}>
            {t("coach.viewProfile")}
            <ArrowIcon />
          </Link>
        ) : undefined
      }
    >
      <Reveal stagger as="ul" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {figures.map((figure) => (
          <li key={figure.label} className="flex">
            <FigureTile {...figure} />
          </li>
        ))}
      </Reveal>

      <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-6">
          <Panel id="requests" title={t("coach.requests")}>
            {dashboard.requests.length === 0 ? (
              <EmptyNote text={t("coach.noRequests")} icon="sessions" />
            ) : (
              <ul className="grid gap-4">
                {dashboard.requests.map((session) => (
                  <SessionCard key={session.id} session={session} locale={locale} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            id="next-sessions"
            title={t("coach.nextSessions")}
            action={
              <Link href={localePath(locale, "/coach/sessions")} className={buttonClasses({ variant: "outline", size: "sm" })}>
                {t("coach.allSessions")}
                <ArrowIcon size={14} />
              </Link>
            }
          >
            {dashboard.nextSessions.length === 0 ? (
              <EmptyNote text={t("coach.noUpcoming")} icon="sessions" />
            ) : (
              <ul className="-my-1 divide-y divide-line">
                {dashboard.nextSessions.map((session) => (
                  <li key={session.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                    >
                      <CalendarIcon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold text-ink">{f.dateTime(session.startsAt)}</span>
                      <span className="mt-0.5 block text-[13.5px] text-body">
                        <span dir="auto">{session.athleteName}</span>
                        {" · "}
                        {session.packageName}
                      </span>
                    </span>
                    <span className="font-heading text-[15px] font-bold text-ink tabular-nums">
                      <span dir="ltr">{f.money(session.total)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="grid min-w-0 gap-6">
          {/* Gross, and labelled as gross: the commission is an open decision.
              No live source at all for earnings — see `CoachDashboard.earnings`;
              the panel is omitted entirely rather than showing fabricated zeros. */}
          {dashboard.earnings ? (
            <section
              aria-labelledby="earnings"
              className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7"
            >
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/4" />
              <span aria-hidden="true" className="absolute -end-24 -top-24 -z-10 size-64 text-accent/16">
                <Rosette className="spin-slow size-full" />
              </span>
              <h2 id="earnings" className="text-[1.35rem] leading-tight text-white">
                {t("coach.earnings")}
              </h2>
              <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent/70" />
              <dl className="mt-6">
                <div className="border-b border-white/10 pb-5">
                  <dt className="text-[13px] text-white/60">{t("coach.thisMonth")}</dt>
                  <dd className="mt-2 font-heading text-[2rem] leading-none font-bold text-accent tabular-nums">
                    <span dir="ltr">{f.money(dashboard.earnings.thisMonth)}</span>
                  </dd>
                </div>
                {[
                  { label: t("coach.lastMonth"), value: dashboard.earnings.lastMonth },
                  { label: t("coach.booked"), value: dashboard.earnings.booked },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3.5 last:border-b-0">
                    <dt className="text-[14px] text-white/70">{row.label}</dt>
                    <dd className="font-heading text-[16px] font-semibold text-white tabular-nums">
                      <span dir="ltr">{f.money(row.value)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[12.5px] leading-relaxed text-white/55">{t("coach.grossNote")}</p>
            </section>
          ) : null}

          <Panel id="standing" title={t("coach.standing")}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              <div className="bg-surface px-4 py-4">
                <dt className="text-[12.5px] text-body">{t("coach.rating")}</dt>
                <dd className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {dashboard.coach.ratingCount ? (
                    <>
                      <span className="text-accent">
                        <StarIcon size={15} />
                      </span>
                      <span className="font-heading text-[1.4rem] leading-none font-bold text-ink" dir="ltr">
                        {dashboard.coach.ratingAverage}
                      </span>
                      <span className="text-[12.5px] text-body" dir="ltr">
                        {`/ 5 (${f.number(dashboard.coach.ratingCount)})`}
                      </span>
                    </>
                  ) : (
                    <span className="font-heading text-[1.4rem] leading-none font-bold text-ink">—</span>
                  )}
                </dd>
              </div>
              <div className="bg-surface px-4 py-4">
                <dt className="text-[12.5px] text-body">{t("coaches.sessionsDone")}</dt>
                <dd className="mt-2 font-heading text-[1.4rem] leading-none font-bold text-ink">
                  <span dir="ltr">{f.number(dashboard.coach.completedSessions)}</span>
                </dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </PortalShell>
  );
}
