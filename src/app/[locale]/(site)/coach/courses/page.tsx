import Link from "next/link";

import { ArrowIcon, buttonClasses } from "@/components/ui";
import { coachPortalService } from "@/features/coach-portal";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { EmptyNote, Panel, PortalShell, StatusChip } from "../../_components/portal/portal-shell";
import { statusLabel } from "../../account/_components/account-frame";
import { coachFrame } from "../_components/coach-frame";
import { CalendarIcon, UsersIcon } from "../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/coach/courses">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/coach/courses", title: getTranslator(locale)("coach.tabCourses"), noIndex: true });
}

/**
 * The academy courses this coach teaches, cohort by cohort, with the students
 * on each. Names only: a student's contact details stay with the academy until
 * JoFit decides what an instructor may see (an OPEN BUSINESS DECISION).
 *
 * The first cohort is the current one: it carries the brand tint and the seats
 * taken, counted from the students still on it.
 */
export default async function CoachCoursesPage({ params }: PageProps<"/[locale]/coach/courses">) {
  const locale = resolveLocale((await params).locale);
  const { coachId, t, f, shell } = await coachFrame(locale, "/coach/courses");
  const courses = await coachPortalService.listCourses(coachId, locale);

  return (
    <PortalShell {...shell} active="/coach/courses" title={t("coach.tabCourses")} lead={t("coach.coursesLead")}>
      {courses.length === 0 ? (
        <EmptyNote text={t("coach.noCourses")} icon="courses" />
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <Panel
              key={course.id}
              id={`course-${course.id}`}
              title={course.title}
              action={
                <Link href={localePath(locale, course.href)} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  {t("coach.coursePage")}
                  <ArrowIcon size={14} />
                </Link>
              }
            >
              {course.cohorts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-6 text-center text-[14.5px] text-body">
                  {t("coach.noStudents")}
                </p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {course.cohorts.map((cohort, index) => {
                    const live = cohort.students.filter((row) => row.status === "pending" || row.status === "active").length;
                    const current = index === 0;
                    return (
                      <section
                        key={cohort.startsOn}
                        aria-label={f.date(cohort.startsOn)}
                        className={`rounded-2xl border p-5 ${current ? "border-primary/30 bg-primary-05" : "border-line bg-surface"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="flex items-center gap-2.5 font-heading text-[15px] font-semibold text-ink">
                            <span
                              aria-hidden="true"
                              className={`grid size-8 place-items-center rounded-full ring-1 ${
                                current ? "bg-primary text-on-primary ring-primary" : "bg-canvas text-primary ring-line"
                              }`}
                            >
                              <CalendarIcon size={14} />
                            </span>
                            {t("account.cohortStarts", { date: f.date(cohort.startsOn) })}
                          </p>
                          {current ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-primary-dark ring-1 ring-primary/20">
                              <UsersIcon size={13} />
                              {/* No live seatsTotal when there's no next intake — falls back to 0; dead branch against the live API anyway since cohorts are always empty there. */}
                              <span dir="ltr">{`${f.number(live)} / ${f.number(course.seatsTotal ?? 0)}`}</span>
                            </span>
                          ) : null}
                        </div>
                        <ul className="mt-4 divide-y divide-line text-[14px]">
                          {cohort.students.map((student, row) => (
                            <li key={`${student.name}-${row}`} className="flex items-center justify-between gap-3 py-2.5">
                              <span dir="auto" className="min-w-0 text-ink">
                                {student.name}
                              </span>
                              <span className="flex shrink-0 items-center gap-3">
                                {student.status === "active" && student.progressPercent > 0 ? (
                                  <span className="flex items-center gap-2">
                                    <span aria-hidden="true" className="h-1.5 w-14 overflow-hidden rounded-full bg-line max-sm:hidden">
                                      <span
                                        className="block h-full rounded-full bg-primary"
                                        style={{ width: `${Math.min(100, student.progressPercent)}%` }}
                                      />
                                    </span>
                                    <span dir="ltr" className="text-[12.5px] text-body tabular-nums">{`${student.progressPercent}%`}</span>
                                  </span>
                                ) : null}
                                <StatusChip status={student.status} label={statusLabel(t, student.status)} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
