import { resolveText } from "@/i18n";
import { AppError } from "@/lib";
import { accountStore, notifyStatusChange, touch, type RawCoachBooking } from "@/mocks/accounts";
import { coachRef } from "@/mocks/accounts/catalogue";
import { buildCourseIntake, mockCourses } from "@/mocks/education";
import { simulateLatency } from "@/mocks/runtime";
import type { Money } from "@/types";

import {
  COACH_SESSION_TRANSITIONS,
  type CoachPortalCohort,
  type CoachPortalSession,
} from "../types";
import type { CoachPortalService } from "./coach-portal.contract";

/**
 * The coach area against the same store the customer's account reads — which
 * is the whole point: a customer's booking made on a profile page arrives here
 * as a request, and the coach's decision is what the customer then sees.
 */
const jod = (amount: number): Money => ({ amount, currency: "JOD" });

function requireCoach(coachId: string, locale: "en" | "ar" = "en") {
  const coach = coachRef(coachId, locale);
  if (!coach) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
  return coach;
}

function toSession(raw: RawCoachBooking, locale: "en" | "ar"): CoachPortalSession {
  const started = raw.startsAt <= new Date().toISOString();
  return {
    id: raw.id,
    reference: raw.reference,
    athleteName: raw.contact.name,
    athleteEmail: raw.contact.email,
    athletePhone: raw.contact.phone,
    packageName: resolveText(raw.packageName, locale),
    mode: raw.mode,
    sessionCount: raw.sessionCount,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    total: raw.total,
    status: raw.status,
    statusNote: raw.statusNote,
    goal: raw.goal,
    bookedAt: raw.createdAt,
    next: COACH_SESSION_TRANSITIONS[raw.status].filter((status) => status !== "completed" || started),
  };
}

const mine = (coachId: string) => accountStore().coachBookings.filter((row) => row.coachId === coachId);

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function sumTotals(rows: readonly RawCoachBooking[]): Money {
  return jod(rows.reduce((sum, row) => sum + row.total.amount, 0));
}

export const mockCoachPortalService: CoachPortalService = {
  async getDashboard(coachId, locale) {
    await simulateLatency();
    const coach = requireCoach(coachId, locale);
    const rows = mine(coachId);
    const now = new Date();
    const nowIso = now.toISOString();
    const thisMonth = monthKey(nowIso);
    const lastMonth = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString());

    const upcoming = rows
      .filter((row) => row.startsAt >= nowIso && (row.status === "pending" || row.status === "confirmed"))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const delivered = rows.filter((row) => row.status === "completed");
    const courses = mockCourses.filter((course) => course.instructorIds.includes(coachId)).map((course) => course.id);
    const students = new Set(
      accountStore()
        .enrolments.filter((row) => courses.includes(row.courseId) && row.status !== "cancelled")
        .map((row) => row.customerId),
    );

    return {
      coach: {
        id: coachId,
        name: coach.title,
        headline: resolveText(coach.raw.headline, locale),
        href: coach.href,
        ratingAverage: coach.raw.rating.average,
        ratingCount: coach.raw.rating.count,
        completedSessions: coach.raw.completedSessions,
        responseTimeHours: coach.raw.responseTimeHours,
      },
      counts: {
        awaitingConfirmation: rows.filter((row) => row.status === "pending").length,
        upcoming: upcoming.length,
        deliveredThisMonth: delivered.filter((row) => monthKey(row.startsAt) === thisMonth).length,
        students: students.size,
      },
      earnings: {
        thisMonth: sumTotals(delivered.filter((row) => monthKey(row.startsAt) === thisMonth)),
        lastMonth: sumTotals(delivered.filter((row) => monthKey(row.startsAt) === lastMonth)),
        booked: sumTotals(upcoming.filter((row) => row.status === "confirmed")),
      },
      requests: rows
        .filter((row) => row.status === "pending")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map((row) => toSession(row, locale)),
      nextSessions: upcoming.filter((row) => row.status === "confirmed").slice(0, 5).map((row) => toSession(row, locale)),
    };
  },

  async listSessions(coachId, locale) {
    await simulateLatency();
    requireCoach(coachId);
    return mine(coachId)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((row) => toSession(row, locale));
  },

  async setSessionStatus(coachId, sessionId, status, note) {
    await simulateLatency();
    const store = accountStore();
    const index = store.coachBookings.findIndex((row) => row.id === sessionId && row.coachId === coachId);
    const booking = store.coachBookings[index];
    if (!booking) throw new AppError("not-found", "That session could not be found.", { status: 404 });

    if (!toSession(booking, "en").next.includes(status)) {
      throw new AppError("conflict", `A ${booking.status} session cannot move to ${status}.`, { status: 409 });
    }
    if (status === "cancelled" && (note ?? "").trim().length < 3) {
      const message = "Tell the customer why, in a few words.";
      throw new AppError("validation", message, { status: 422, details: { fieldErrors: { note: message } } });
    }
    store.coachBookings[index] = {
      ...booking,
      status,
      statusNote: status === "cancelled" ? note!.trim() : booking.statusNote,
    };
    notifyStatusChange("session", booking, status);
    touch();
  },

  async listCourses(coachId, locale) {
    await simulateLatency();
    requireCoach(coachId);
    const enrolments = accountStore().enrolments;
    return mockCourses
      .filter((course) => course.instructorIds.includes(coachId))
      .map((course) => {
        const own = enrolments.filter((row) => row.courseId === course.id);
        const dates = [...new Set(own.map((row) => row.cohortStartsOn))].sort().reverse();
        const cohorts: CoachPortalCohort[] = dates.map((startsOn) => ({
          startsOn,
          students: own
            .filter((row) => row.cohortStartsOn === startsOn)
            .map((row) => ({ name: row.customerName, status: row.status, progressPercent: row.progressPercent })),
        }));
        return {
          id: course.id,
          title: resolveText(course.title, locale),
          href: `/education/courses/${course.slug}`,
          format: course.format,
          durationHours: course.durationHours,
          seatsTotal: buildCourseIntake(course.id).seatsTotal,
          cohorts,
        };
      });
  },

  async listReviews(coachId) {
    await simulateLatency();
    return accountStore()
      .reviews.filter((row) => row.targetType === "coach" && row.targetId === coachId && row.moderationStatus === "approved")
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((row) => ({
        id: row.id,
        authorName: row.authorName,
        rating: row.rating,
        title: row.title,
        body: row.body,
        submittedAt: row.submittedAt,
        isVerifiedPurchase: Boolean(row.isVerifiedPurchase),
      }));
  },

  async listPackages(coachId, locale) {
    await simulateLatency();
    const coach = requireCoach(coachId, locale);
    return coach.raw.packages.map((pkg) => ({
      id: pkg.id,
      name: resolveText(pkg.name, locale),
      durationMinutes: pkg.durationMinutes,
      sessionCount: pkg.sessionCount,
      mode: pkg.mode,
      price: pkg.price,
      compareAtPrice: pkg.compareAtPrice,
    }));
  },
};
