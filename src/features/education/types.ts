import type { SportId } from "@/features/sports";
import type { ListQuery, Media, Paginated, Price, PublishStatus, RatingSummary, SeoMeta } from "@/types";

/**
 * Education is prepared as a *catalogue* domain: discovery, detail and
 * enrolment intent. Course delivery (lessons, progress, assessments) is an LMS
 * and is explicitly out of scope — `CourseModule` describes a syllabus entry for
 * the marketing page, not a playable unit.
 */
export type CourseFormat = "online" | "in-person" | "hybrid" | "self-paced";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly seo?: SeoMeta;
}

export interface CourseModule {
  readonly id: string;
  readonly title: string;
  readonly summary?: string;
  readonly durationMinutes?: number;
}

export interface CourseCertification {
  readonly name: string;
  readonly issuedBy: string;
}

/**
 * How a course's next cohort stands today.
 *
 * Four states rather than a seat count, for the same reason the shop models
 * stock as a signal: what a reader can act on is "can I still get in", not
 * "fourteen of eighteen". Both the index and the detail page render these
 * through the shared `.stock-signal` class, so availability reads identically
 * across the site.
 */
/** `soon` is pinned by staff in the admin: the course is shown, but nobody can reserve a seat yet. */
export type CourseEnrolmentState = "open" | "closing" | "full" | "upcoming" | "soon";

/**
 * The next cohort of a course.
 *
 * `startsOn` is a calendar date (`YYYY-MM-DD`) and is GENERATED RELATIVE TO
 * TODAY by the mock adapter — a hardcoded intake makes the whole catalogue look
 * abandoned a fortnight after it was written.
 *
 * Seat counts are what the state is derived FROM; nothing displays them, because
 * whether JoFit wants to publish remaining places is an open business decision.
 */
export interface CourseIntake {
  readonly startsOn: string;
  readonly seatsTotal: number;
  readonly seatsTaken: number;
  readonly state: CourseEnrolmentState;
  /** Staff chose the state by hand (anything but "automatic"); the start date is then not shown. */
  readonly pinned?: boolean;
}

/**
 * The catalogue's sort vocabulary. Shared `ListQuery.sort` is a plain `string`
 * because every domain has its own set, so a page narrows against this list
 * before it can render an exhaustive set of pressed states.
 */
export const COURSE_SORT_KEYS = [
  "newest",
  "price-asc",
  "price-desc",
  "rating-desc",
  "duration-asc",
] as const;

export type CourseSortKey = (typeof COURSE_SORT_KEYS)[number];

export interface Course {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly categoryIds: readonly string[];
  /** The live API has no `sportIds` field at all — empty until it does. */
  readonly sportIds: readonly SportId[];
  readonly format: CourseFormat;
  readonly level: CourseLevel;
  readonly durationHours: number;
  readonly price: Price;
  /**
   * Coach ids — courses are taught by the same people the coaches domain lists.
   * The live API's `instructors` field is untyped in its own spec (no reliable
   * shape to read an id from), so this is empty until the API defines one.
   */
  readonly instructorIds: readonly string[];
  /** Filled from the live API's `modules` array once the backend sends it; empty until then. */
  readonly modules: readonly CourseModule[];
  /** How many modules the syllabus has. The live API has a count but no module list. */
  readonly moduleCount?: number;
  /**
   * What the holder is able to DO afterwards, in their own words — the first
   * question a course page has to answer, and the one a syllabus answers badly.
   * Localized at the adapter like every other displayed string. The live API
   * has no `outcomes` field at all — empty until it does.
   */
  readonly outcomes: readonly string[];
  /** Who the course was written for. Short phrases, not sentences. No live source — empty. */
  readonly audience: readonly string[];
  /** How the place is earned. One sentence; the marking policy is the academy's. */
  readonly assessment?: string;
  /** Languages of delivery, resolved from BCP-47 codes at the adapter. */
  readonly languages: readonly string[];
  /** Where it is taught. Absent for an online course — the format says the rest. */
  readonly venue?: string;
  readonly certification?: CourseCertification;
  /** The next cohort. Generated relative to today — see `CourseIntake`. */
  readonly nextIntake: CourseIntake;
  readonly media: readonly Media[];
  /** The live API has no `rating` field at all; defaults to a zero summary until it does. */
  readonly rating: RatingSummary;
  readonly status: PublishStatus;
  readonly publishedAt: string;
  readonly seo?: SeoMeta;
}

export interface CourseListQuery extends ListQuery {
  readonly categorySlugs?: readonly string[];
  readonly sportSlugs?: readonly string[];
  readonly formats?: readonly CourseFormat[];
  readonly levels?: readonly CourseLevel[];
  readonly minRating?: number;
}

export type CourseListResult = Paginated<Course>;

export type EnrolmentStatus = "pending" | "active" | "completed" | "cancelled";

/**
 * Enrolment record as the account area will read it. Eligibility, payment and
 * refund rules are OPEN BUSINESS DECISIONS.
 */
export interface Enrolment {
  readonly id: string;
  readonly reference: string;
  readonly courseId: string;
  /** Which cohort the place is on. */
  readonly cohortStartsOn: string;
  readonly courseTitle: string;
  readonly status: EnrolmentStatus;
  readonly enrolledAt: string;
  readonly progressPercent: number;
}
