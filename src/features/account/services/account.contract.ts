import type { Locale } from "@/i18n";
import type { Address } from "@/types";

import type {
  AccountEnrolment,
  AccountOrder,
  AccountOverview,
  AccountRental,
  AccountReview,
  AccountSession,
  AddressInput,
  CustomerPreferences,
  CustomerProfile,
  ProfileInput,
  ReviewDraft,
  Reviewable,
} from "../types";

/**
 * Everything the account area reads and the few things it changes, always FOR
 * ONE CUSTOMER. The customer id comes from the server session — never from the
 * page or the form — so no call here can be pointed at somebody else's records.
 *
 * Orders, bookings and places are CREATED elsewhere (checkout, a coach profile,
 * a course page) and only read here; cancelling a session, reviewing, and
 * editing addresses and preferences are the account's own writes.
 */
export interface AccountService {
  getOverview(customerId: string, locale: Locale): Promise<AccountOverview>;

  listOrders(customerId: string, locale: Locale): Promise<readonly AccountOrder[]>;
  /** `null` when the order does not exist OR is not this customer's — the same answer. */
  getOrder(customerId: string, orderId: string, locale: Locale): Promise<AccountOrder | null>;
  /**
   * Cancels an order the customer placed that nobody has confirmed yet — the
   * only point at which cancelling needs no refund. Hires on it are released
   * with it. Later cancellations are an OPEN BUSINESS DECISION (refund rules).
   */
  cancelOrder(customerId: string, orderId: string): Promise<void>;

  listRentals(customerId: string, locale: Locale): Promise<readonly AccountRental[]>;

  listSessions(customerId: string, locale: Locale): Promise<readonly AccountSession[]>;
  /** A reason is required; the coach sees it. */
  cancelSession(customerId: string, sessionId: string, reason: string): Promise<void>;

  listEnrolments(customerId: string, locale: Locale): Promise<readonly AccountEnrolment[]>;

  listReviews(customerId: string, locale: Locale): Promise<readonly AccountReview[]>;
  listReviewable(customerId: string, locale: Locale): Promise<readonly Reviewable[]>;
  /** Lands `pending`: nothing a customer writes is public until staff approve it. */
  submitReview(customerId: string, draft: ReviewDraft): Promise<void>;

  listAddresses(customerId: string): Promise<readonly Address[]>;
  addAddress(customerId: string, input: AddressInput): Promise<Address>;
  removeAddress(customerId: string, addressId: string): Promise<void>;

  /** Name, email, phone and member-since, as the settings page shows them. */
  getProfile(customerId: string): Promise<CustomerProfile>;
  /**
   * The person's name and phone. The sign-in email is not changed here — it
   * needs the password, and is `authService.changeEmail`.
   */
  updateProfile(customerId: string, input: ProfileInput): Promise<CustomerProfile>;

  getPreferences(customerId: string): Promise<CustomerPreferences>;
  updatePreferences(customerId: string, next: Omit<CustomerPreferences, "currency">): Promise<void>;
}
