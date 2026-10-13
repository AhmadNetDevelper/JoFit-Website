import { httpClient } from "@/services";
import type { Money } from "@/types";

import type {
  CoachDashboard,
  CoachPortalCourse,
  CoachPortalPackage,
  CoachPortalReview,
  CoachPortalSession,
  CoachSessionStatus,
} from "../types";
import type { CoachPortalService } from "./coach-portal.contract";

const coach = { auth: true } as const;

/** `CoachBookingContactDto` — `client` on a live session. */
interface LiveCoachContact {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
}

/** `CoachPortalSessionDto` / `CoachPortalSessionDto2` — same shape live, used both singly (`nextSession`) and as an array (`pendingSessions`, `GET /coach/sessions`). */
interface LiveCoachSession {
  readonly id: number;
  readonly reference: string;
  readonly client: LiveCoachContact;
  readonly packageName: string;
  readonly goal?: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total: Money;
  readonly note?: string;
  readonly next: readonly string[];
}

/** `CoachDashboardCounts`. */
interface LiveCoachDashboardCounts {
  readonly pendingSessions: number;
  readonly upcomingSessions: number;
  readonly completedSessions: number;
  readonly courses: number;
  readonly reviews: number;
}

/** `CoachDashboardDto`. */
interface LiveCoachDashboard {
  readonly coachId: number;
  readonly name: string;
  readonly verificationStatus: string;
  readonly verificationNote?: string;
  readonly counts: LiveCoachDashboardCounts;
  readonly nextSession?: LiveCoachSession | null;
  readonly pendingSessions: readonly LiveCoachSession[];
}

/** `NextIntakeRefDto` — nullable; absent when nothing is scheduled. */
interface LiveNextIntakeRef {
  readonly startsOn: string;
  readonly seatsTotal: number;
}

/** `CoachPortalCourseDto` — no roster, no format/duration; only a headcount. */
interface LiveCoachCourse {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly status: string;
  readonly nextIntake?: LiveNextIntakeRef | null;
  readonly enrolmentCount: number;
}

/** `CoachPortalReviewDto`. */
interface LiveCoachReview {
  readonly id: number;
  readonly rating: number;
  readonly title?: string;
  readonly body: string;
  readonly authorName: string;
  readonly createdAt: string;
}

/** `CoachPortalPackageDto`. */
interface LiveCoachPackage {
  readonly id: number;
  readonly name: string;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: string;
  readonly price: Money;
  readonly compareAtPrice?: Money;
}

function toSession(dto: LiveCoachSession): CoachPortalSession {
  return {
    id: String(dto.id),
    reference: dto.reference,
    athleteName: dto.client.name,
    athleteEmail: dto.client.email,
    athletePhone: dto.client.phone ?? "",
    packageName: dto.packageName,
    // No live `mode`/`sessionCount`/`bookedAt` — see the optional fields' doc
    // comments on `CoachPortalSession`.
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    total: dto.total,
    status: dto.status as CoachSessionStatus,
    // Live names this `note`; the contract calls it `statusNote`.
    statusNote: dto.note,
    goal: dto.goal,
    next: dto.next as readonly CoachSessionStatus[],
  };
}

function toDashboard(dto: LiveCoachDashboard): CoachDashboard {
  return {
    coach: {
      id: String(dto.coachId),
      name: dto.name,
      // headline/href/ratingAverage/ratingCount/responseTimeHours: no live
      // source on `CoachDashboardDto`, left undefined (see types.ts).
      // Only live lifetime counter available; reused here and in
      // `counts.deliveredThisMonth` below — the live API doesn't split it by
      // period.
      completedSessions: dto.counts.completedSessions,
    },
    counts: {
      awaitingConfirmation: dto.counts.pendingSessions,
      upcoming: dto.counts.upcomingSessions,
      // Best available proxy: a lifetime completed count, not actually scoped
      // to "this month" — the live API has no period-scoped counter.
      deliveredThisMonth: dto.counts.completedSessions,
      // No live source for a distinct-student count — left undefined.
    },
    // No live `earnings` block at all — left undefined (see types.ts).
    requests: dto.pendingSessions.map(toSession),
    nextSessions: dto.nextSession ? [toSession(dto.nextSession)] : [],
  };
}

function toCourse(dto: LiveCoachCourse): CoachPortalCourse {
  return {
    id: String(dto.id),
    title: dto.title,
    href: `/education/courses/${dto.slug}`,
    // format/durationHours: no live source.
    seatsTotal: dto.nextIntake?.seatsTotal,
    // No live per-student roster — only `enrolmentCount` exists, which can't
    // be split into dated cohorts of named students.
    cohorts: [],
  };
}

function toReview(dto: LiveCoachReview): CoachPortalReview {
  return {
    id: String(dto.id),
    authorName: dto.authorName,
    rating: dto.rating,
    title: dto.title,
    body: dto.body,
    // Live names this `createdAt`; the contract calls it `submittedAt`.
    submittedAt: dto.createdAt,
    // No live verified-purchase flag.
  };
}

function toPackage(dto: LiveCoachPackage): CoachPortalPackage {
  return {
    id: String(dto.id),
    name: dto.name,
    durationMinutes: dto.durationMinutes,
    sessionCount: dto.sessionCount,
    mode: dto.mode as CoachPortalPackage["mode"],
    price: dto.price,
    compareAtPrice: dto.compareAtPrice,
  };
}

/**
 * The coach area over `/v1/coach/*`. As with `/v1/me`, the coach is whoever the
 * bearer token belongs to; the `coachId` argument is the mock adapter's need.
 * A customer's token here answers 403.
 *
 * Every response shape below is substantially different from the contract's —
 * see the per-field doc comments on `../types` for what the live API simply
 * doesn't have.
 */
export const httpCoachPortalService: CoachPortalService = {
  getDashboard: async (_coachId, locale) => {
    const dto = await httpClient.get<LiveCoachDashboard>("/v1/coach/dashboard", {
      query: { language: locale },
      ...coach,
    });
    return toDashboard(dto);
  },

  // `GET /coach/sessions` has no `language` query parameter at all — nothing
  // to send, unlike the other list endpoints here.
  listSessions: async (_coachId) => {
    const dtos = await httpClient.get<LiveCoachSession[]>("/v1/coach/sessions", coach);
    return dtos.map(toSession);
  },

  setSessionStatus: async (_coachId, sessionId, status, note) => {
    await httpClient.post<void>(`/v1/coach/sessions/${encodeURIComponent(sessionId)}/status`, { status, note }, coach);
  },

  listCourses: async (_coachId, locale) => {
    const dtos = await httpClient.get<LiveCoachCourse[]>("/v1/coach/courses", { query: { language: locale }, ...coach });
    return dtos.map(toCourse);
  },

  // `GET /coach/reviews` also has no `language` query parameter.
  listReviews: async () => {
    const dtos = await httpClient.get<LiveCoachReview[]>("/v1/coach/reviews", coach);
    return dtos.map(toReview);
  },

  listPackages: async (_coachId, locale) => {
    const dtos = await httpClient.get<LiveCoachPackage[]>("/v1/coach/packages", { query: { language: locale }, ...coach });
    return dtos.map(toPackage);
  },
};
