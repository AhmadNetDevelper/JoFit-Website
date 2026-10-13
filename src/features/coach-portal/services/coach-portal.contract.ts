import type { Locale } from "@/i18n";

import type {
  CoachDashboard,
  CoachPortalCourse,
  CoachPortalPackage,
  CoachPortalReview,
  CoachPortalSession,
  CoachSessionStatus,
} from "../types";

/**
 * The coach area, always FOR THE COACH THE SESSION NAMES. A session id that
 * belongs to another coach is "not found", exactly like one that does not
 * exist.
 */
export interface CoachPortalService {
  getDashboard(coachId: string, locale: Locale): Promise<CoachDashboard>;
  listSessions(coachId: string, locale: Locale): Promise<readonly CoachPortalSession[]>;
  /** Declining or cancelling needs a note: the customer is told why. */
  setSessionStatus(coachId: string, sessionId: string, status: CoachSessionStatus, note?: string): Promise<void>;
  listCourses(coachId: string, locale: Locale): Promise<readonly CoachPortalCourse[]>;
  /** Published reviews only — what the public sees on the profile. */
  listReviews(coachId: string): Promise<readonly CoachPortalReview[]>;
  listPackages(coachId: string, locale: Locale): Promise<readonly CoachPortalPackage[]>;
}
