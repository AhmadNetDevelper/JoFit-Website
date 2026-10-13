/**
 * The customer's account area. SERVER ONLY — every call is made for the
 * customer the session names, from a page, a layout or a Server Action.
 */
export { accountService, type AccountService } from "./services";
export type {
  AccountEnrolment,
  AccountEnrolmentStatus,
  AccountOrder,
  AccountOrderLine,
  AccountOrderStatus,
  AccountOverview,
  AccountRental,
  AccountRentalStatus,
  AccountReview,
  AccountSession,
  AccountSessionStatus,
  AddressInput,
  CustomerPreferences,
  CustomerProfile,
  ProfileInput,
  ReviewDraft,
  Reviewable,
  ReviewTargetType,
} from "./types";
