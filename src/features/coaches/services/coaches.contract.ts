import type { Locale } from "@/i18n";
import type { DateRange, SitemapEntry } from "@/types";

import type {
  Coach,
  CoachAvailabilitySlot,
  CoachBooking,
  CoachBookingRequest,
  CoachListQuery,
  CoachListResult,
  CoachSpecialisation,
} from "../types";

export interface CoachesService {
  listCoaches(query: CoachListQuery): Promise<CoachListResult>;
  getCoachBySlug(slug: string, locale: Locale): Promise<Coach | null>;
  /** Resolves coaches referenced by id from other domains (e.g. course instructors). */
  getManyByIds(ids: readonly string[], locale: Locale): Promise<readonly Coach[]>;
  /** The filter vocabulary, resolved for display. Ids are what a query carries. */
  listSpecializations(locale: Locale): Promise<readonly CoachSpecialisation[]>;
  listAvailability(coachId: string, range: DateRange): Promise<readonly CoachAvailabilitySlot[]>;
  /**
   * Places a booking and returns what was actually booked.
   *
   * It takes ids, not prices: a browser that could name its own total would be
   * a payment bug waiting to happen, so the server resolves the package and
   * prices it. Rejects with an `AppError` when the slot is gone — which is the
   * normal case under contention, not an exception.
   *
   * OPEN BUSINESS DECISION: payment. Nothing here takes money. A real
   * implementation either returns a payment intent to redirect to, or books
   * `pending` and settles later; both are a backend decision and the UI is
   * written so either one fits.
   */
  createBooking(request: CoachBookingRequest, locale: Locale): Promise<CoachBooking>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;
}
