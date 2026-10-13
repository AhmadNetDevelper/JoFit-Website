import type { Money } from "@/types";

/**
 * THE COACH'S SIDE OF THE PLATFORM.
 *
 * A coach who signs in manages what the storefront sells in their name: the
 * sessions customers have booked with them, the students on the courses they
 * teach, what those customers said, and what it all earned. Their public
 * profile itself is authored with staff and verified in the admin, so it is
 * shown here, not edited — the edit path is an OPEN BUSINESS DECISION about
 * who approves a changed profile.
 *
 * The session lifecycle is the other half of the customer's: a customer books
 * `pending`, the coach confirms or declines, the coach marks it delivered. The
 * customer sees each of those moves on their own account page.
 */
export const COACH_SESSION_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type CoachSessionStatus = (typeof COACH_SESSION_STATUSES)[number];

/**
 * What a coach may do from where a session is now. `completed` is offered only
 * once the session has started — marking a session delivered before it happens
 * is the one move that is always a mistake.
 */
export const COACH_SESSION_TRANSITIONS: Readonly<Record<CoachSessionStatus, readonly CoachSessionStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export interface CoachPortalSession {
  readonly id: string;
  readonly reference: string;
  /** Who the session is FOR, as the booking step collected it. */
  readonly athleteName: string;
  readonly athleteEmail: string;
  readonly athletePhone: string;
  readonly packageName: string;
  /** No live source (`CoachPortalSessionDto2` has no delivery-mode field) — optional since only the mock models in-person vs online. */
  readonly mode?: "in-person" | "online";
  /** No live source — the live DTO prices and books one session at a time, not a multi-session package count. */
  readonly sessionCount?: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly total: Money;
  readonly status: CoachSessionStatus;
  readonly statusNote?: string;
  /** The athlete's own words. Never translated. */
  readonly goal?: string;
  /** No live source — the live DTO doesn't track when the booking itself was made, only `startsAt`/`endsAt`. */
  readonly bookedAt?: string;
  /** The moves open to the coach right now, already filtered by time. */
  readonly next: readonly CoachSessionStatus[];
}

export interface CoachPortalStudent {
  readonly name: string;
  readonly status: "pending" | "active" | "completed" | "cancelled";
  readonly progressPercent: number;
}

export interface CoachPortalCohort {
  readonly startsOn: string;
  readonly students: readonly CoachPortalStudent[];
}

export interface CoachPortalCourse {
  readonly id: string;
  readonly title: string;
  /**
   * Built from the slug (`/education/courses/{slug}`) — `CoachPortalCourseDto`
   * has no `href`, and `education` has no shared path-builder helper to call
   * instead (every other caller, e.g. `education.mock.ts`, inlines the same
   * literal), so this mirrors that convention rather than inventing a new one.
   */
  readonly href: string;
  /** No live source — `CoachPortalCourseDto` has no format/duration fields at all. */
  readonly format?: string;
  readonly durationHours?: number;
  /** Only known when a next intake exists — `CoachPortalCourseDto.nextIntake` is nullable. */
  readonly seatsTotal?: number;
  /**
   * No live source at all — `CoachPortalCourseDto` gives only an
   * `enrolmentCount` total, no per-student roster to group into cohorts.
   * Always empty against the live API.
   */
  readonly cohorts: readonly CoachPortalCohort[];
}

export interface CoachPortalReview {
  readonly id: string;
  readonly authorName: string;
  readonly rating: number;
  readonly title?: string;
  readonly body: string;
  readonly submittedAt: string;
  /** No live source — `CoachPortalReviewDto` has no verified-purchase flag. */
  readonly isVerifiedPurchase?: boolean;
}

export interface CoachPortalPackage {
  readonly id: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: "in-person" | "online";
  readonly price: Money;
  readonly compareAtPrice?: Money;
}

export interface CoachDashboard {
  readonly coach: {
    readonly id: string;
    readonly name: string;
    /** No live source — `CoachDashboardDto` returns only `name`, no profile marketing copy. */
    readonly headline?: string;
    readonly href?: string;
    readonly ratingAverage?: number;
    readonly ratingCount?: number;
    readonly completedSessions: number;
    readonly responseTimeHours?: number;
  };
  readonly counts: {
    readonly awaitingConfirmation: number;
    readonly upcoming: number;
    readonly deliveredThisMonth: number;
    /** No live source — `CoachDashboardCounts` tracks sessions/courses/reviews, not distinct students. */
    readonly students?: number;
  };
  /**
   * GROSS takings — what customers paid. JoFit's commission and the payout
   * schedule are OPEN BUSINESS DECISIONS, so no net figure is shown.
   *
   * No live source at all — `CoachDashboardDto` has no payments/earnings block
   * whatsoever. Optional so the live-backed dashboard can simply omit the
   * earnings panel instead of showing fabricated zeros.
   */
  readonly earnings?: {
    readonly thisMonth: Money;
    readonly lastMonth: Money;
    /** Confirmed sessions still to happen. */
    readonly booked: Money;
  };
  readonly requests: readonly CoachPortalSession[];
  readonly nextSessions: readonly CoachPortalSession[];
}
