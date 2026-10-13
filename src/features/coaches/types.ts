import type { SportId } from "@/features/sports";
import type { ListQuery, Media, MediaImage, Money, Paginated, RatingSummary, SeoMeta } from "@/types";

export interface Certification {
  readonly id: string;
  readonly name: string;
  readonly issuedBy: string;
  readonly issuedAt?: string;
  readonly expiresAt?: string;
}

/**
 * A bookable slot is an explicit window published by the coach, not a rule the
 * frontend infers from working hours. Slot generation, cancellation windows and
 * commission are OPEN BUSINESS DECISIONS owned by the backend.
 */
export interface CoachAvailabilitySlot {
  readonly id: string;
  /** ISO-8601 date-time with offset. */
  readonly startsAt: string;
  readonly endsAt: string;
  readonly isBooked: boolean;
}

/**
 * A specialisation, resolved. The id is what a filter and a URL carry; the name
 * is what a person reads, in their own language.
 */
export interface CoachSpecialisation {
  readonly id: string;
  readonly name: string;
}

export type CoachSessionMode = "in-person" | "online";

/**
 * WHAT IS ACTUALLY BOOKED.
 *
 * A slot is a window in a calendar; it says nothing about what happens inside
 * it. The same coach sells an hour face to face, a shorter online form review
 * and a discounted block of eight — different lengths, different prices,
 * different places. Booking therefore needs a package *and* a slot, and a
 * package is what carries the price.
 *
 * OPEN BUSINESS DECISION: whether a multi-session package reserves every slot
 * up front or only the first. The mock reserves the first and treats the rest
 * as scheduled later with the coach, which is what the confirmation copy says.
 */
export interface CoachSessionPackage {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly durationMinutes: number;
  /** 1 for a single session; higher for a block sold at a reduced rate. */
  readonly sessionCount: number;
  readonly mode: CoachSessionMode;
  readonly price: Money;
  /** Struck-through reference price, present only where a block is discounted. */
  readonly compareAtPrice?: Money;
}

/**
 * A coach's location, as the live API actually returns it (`LocationRef`:
 * `{id, slug, name}`). No `city`/`countryCode` breakdown exists on that
 * endpoint — unlike the shared `Location` type (addresses, rental depots),
 * so this is a coaches-local shape rather than widening everyone else's.
 */
export interface CoachLocation {
  readonly id: string;
  readonly name: string;
  /** No live source — `LocationRef` has no city/country fields. */
  readonly city?: string;
  readonly countryCode?: string;
}

export interface Coach {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly headline: string;
  readonly bio: string;
  readonly sportIds: readonly SportId[];
  /**
   * Live `PublicCoachDto.specializations` is a plain `string[]` of names, not
   * id+name pairs — there is no per-coach id to key a filter chip on. Widened
   * from `readonly CoachSpecialisation[]` to match; a consumer that needs the
   * id (e.g. to re-select a matching filter chip) can no longer do so against
   * the live API without a second name→id lookup through `listSpecializations`.
   */
  readonly specializations: readonly string[];
  readonly certifications: readonly Certification[];
  readonly yearsOfExperience: number;
  readonly languages: readonly string[];
  readonly location: CoachLocation;
  /** No live source — `PublicCoachDto` has no remote-availability flag. */
  readonly isRemoteAvailable?: boolean;
  /** Indicative session price; the quoted price is settled at booking. */
  readonly sessionRate?: Money;
  /** What the coach offers, cheapest first. Empty means enquiry-only. */
  readonly packages: readonly CoachSessionPackage[];
  /** Sessions delivered through the platform — social proof, not a rating. */
  readonly completedSessions: number;
  /** Typical time to answer a booking request, in hours. */
  readonly responseTimeHours: number;
  readonly avatar?: MediaImage;
  readonly gallery: readonly Media[];
  /**
   * No live source on `PublicCoachDto` — `coaches` may only depend on
   * `sports` per `ARCHITECTURE.md` §7, so this can't be filled from the
   * `reviews` domain's summary endpoint either. Defaults to a zero summary
   * rather than being made optional, since every current caller renders a
   * rating unconditionally.
   */
  readonly rating: RatingSummary;
  /** No live source — `PublicCoachDto` has no publish timestamp. */
  readonly publishedAt?: string;
  readonly seo?: SeoMeta;
}

export interface CoachListQuery extends ListQuery {
  readonly sportSlugs?: readonly string[];
  /** Specialisation IDS, not labels — see `CoachSpecialisation`. */
  readonly specializations?: readonly string[];
  readonly locationIds?: readonly string[];
  readonly languages?: readonly string[];
  readonly minRating?: number;
  readonly remoteOnly?: boolean;
}

export type CoachListResult = Paginated<Coach>;

export type CoachBookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

/**
 * Who the session is for. Collected at booking rather than read from an
 * account, because coaching is bought for a child or a team as often as for
 * oneself, and because there is no account system yet.
 */
export interface CoachBookingContact {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

/** What the browser sends. The server decides price, reference and status. */
export interface CoachBookingRequest {
  readonly coachId: string;
  readonly packageId: string;
  readonly slotId: string;
  readonly contact: CoachBookingContact;
  /** What the athlete wants out of it, in their own words. */
  readonly goal?: string;
  /**
   * The signed-in customer paying for it, supplied by the SERVER from the
   * session — never from the form. Absent for a guest, whose booking still
   * reaches the coach but appears in no account.
   */
  readonly customerId?: string;
}

export interface CoachBooking {
  readonly id: string;
  readonly reference: string;
  readonly coachId: string;
  readonly coachName: string;
  /** No live source — `CoachBookingDto` returns `coachId`/`coachName` only, no slug; a confirmation screen needing a profile link would need a second lookup. */
  readonly coachSlug?: string;
  readonly packageName: string;
  readonly slot: CoachAvailabilitySlot;
  readonly total: Money;
  readonly contact: CoachBookingContact;
  readonly status: CoachBookingStatus;
  readonly createdAt: string;
}

export const COACH_SORT_KEYS = ["relevance", "rating-desc", "experience-desc", "price-asc"] as const;
export type CoachSortKey = (typeof COACH_SORT_KEYS)[number];
