/**
 * The coach area. SERVER ONLY — every call is made for the coach the session
 * names, from a page, a layout or a Server Action.
 */
export { coachPortalService, type CoachPortalService } from "./services";
export {
  COACH_SESSION_STATUSES,
  COACH_SESSION_TRANSITIONS,
  type CoachDashboard,
  type CoachPortalCohort,
  type CoachPortalCourse,
  type CoachPortalPackage,
  type CoachPortalReview,
  type CoachPortalSession,
  type CoachPortalStudent,
  type CoachSessionStatus,
} from "./types";
