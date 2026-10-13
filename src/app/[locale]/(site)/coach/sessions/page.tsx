import { coachPortalService } from "@/features/coach-portal";
import { getTranslator, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { EmptyNote, Panel, PortalShell } from "../../_components/portal/portal-shell";
import { coachFrame } from "../_components/coach-frame";
import { SessionCard } from "../_components/session-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach/sessions">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach/sessions", title: getTranslator(locale)("coach.tabSessions"), noIndex: true });
}

/**
 * Every session, in three groups a coach thinks in: waiting on me, in my
 * diary, and done. Each group is a panel with its count at the far end, and
 * each session the same card with the moves open from where it is.
 */
export default async function CoachSessionsPage({ params }: PageProps<"/[locale]/coach/sessions">) {
  const locale = resolveLocale((await params).locale);
  const { coachId, t, f, shell } = await coachFrame(locale, "/coach/sessions");
  const sessions = await coachPortalService.listSessions(coachId, locale);

  const groups = [
    {
      id: "waiting",
      title: t("coach.groupWaiting"),
      rows: sessions.filter((row) => row.status === "pending").reverse(),
    },
    {
      id: "diary",
      title: t("coach.groupDiary"),
      rows: sessions.filter((row) => row.status === "confirmed").sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    },
    {
      id: "history",
      title: t("coach.groupHistory"),
      rows: sessions.filter((row) => row.status === "completed" || row.status === "cancelled"),
    },
  ];
  /* A confirmed session whose time has passed stays in the diary: it is waiting
     to be marked delivered, which is the coach's call, not the clock's. */

  return (
    <PortalShell {...shell} active="/coach/sessions" title={t("coach.tabSessions")} lead={t("coach.sessionsLead")}>
      {sessions.length === 0 ? (
        <EmptyNote text={t("coach.noSessions")} icon="sessions" />
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <Panel
              key={group.id}
              id={`group-${group.id}`}
              title={group.title}
              action={
                <span
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 font-heading text-[14px] font-bold ${
                    group.id === "waiting" && group.rows.length > 0
                      ? "bg-accent text-deep"
                      : "bg-primary-05 text-primary-dark ring-1 ring-primary/15"
                  }`}
                >
                  <span dir="ltr">{f.number(group.rows.length)}</span>
                </span>
              }
            >
              {group.rows.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-6 text-center text-[14.5px] text-body">
                  {t("coach.groupEmpty")}
                </p>
              ) : (
                <ul className="grid gap-4">
                  {group.rows.map((session) => (
                    <SessionCard key={session.id} session={session} locale={locale} />
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
