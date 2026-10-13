import type { Address, CurrencyCode, DateRange, Money } from "@/types";

/**
 * THE CUSTOMER'S SIDE OF EVERY DOMAIN.
 *
 * The account area is where the platform converges for one person: what they
 * bought, hired, booked and enrolled in, and what they said about it. It owns
 * none of those records — orders, hires, sessions and places each belong to
 * their domain — it reads them for one customer, resolved into the language
 * the page is in, with the links that take the person back to the thing.
 *
 * Every string here is already in the reader's language; every `href` is a
 * locale-free path the page prefixes.
 *
 * OPEN BUSINESS DECISIONS: guest-to-account merging, whether community
 * identity is the same account, and data retention.
 */
export interface CustomerProfile {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone?: string;
  readonly avatarUrl?: string;
  readonly createdAt: string;
}

/** What a customer may change about themselves; the email is an auth change. */
export interface ProfileInput {
  readonly name: string;
  readonly phone?: string;
}

export interface CustomerPreferences {
  readonly currency: CurrencyCode;
  readonly locale: "en" | "ar";
  /**
   * No live source — `CustomerPreferencesDto` has no favourite-sports field at
   * all. Optional; reads default it to `[]` rather than fabricate a list.
   */
  readonly favouriteSportIds?: readonly string[];
  readonly marketingOptIn: boolean;
}

export type AccountOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface AccountOrderLine {
  readonly id: string;
  readonly kind: "shop" | "rental";
  readonly title: string;
  readonly description?: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
  readonly rentalPeriod?: DateRange;
  /** The product or hire item's public page, when it is still listed. */
  readonly href?: string;
}

/**
 * The order's delivery address as the API freezes it on the order: the live
 * `OrderAddressDto` is a snapshot, not a saved address record — it carries no
 * `id` or `countryCode`. Widened from the shared `Address` type for just this
 * field rather than fabricating either value.
 */
export type OrderShippingAddress = Omit<Address, "id" | "countryCode"> & {
  readonly id?: string;
  readonly countryCode?: string;
};

export interface AccountOrder {
  readonly id: string;
  readonly reference: string;
  readonly status: AccountOrderStatus;
  readonly placedAt: string;
  readonly lines: readonly AccountOrderLine[];
  readonly itemsSubtotal: Money;
  readonly depositsTotal: Money;
  readonly shippingTotal: Money;
  readonly taxTotal: Money;
  readonly grandTotal: Money;
  readonly shippingAddress?: OrderShippingAddress;
  /** The storefront's own reading of the status — where the order is in its life. */
  readonly progress: readonly { readonly step: AccountOrderStatus; readonly done: boolean }[];
}

export type AccountRentalStatus = "pending" | "confirmed" | "collected" | "returned" | "cancelled";

export interface AccountRental {
  readonly id: string;
  readonly reference: string;
  readonly itemTitle: string;
  /** No live source — `AccountRentalDto2` gives only a numeric `itemId`, no slug to build a public item page path from. */
  readonly itemHref?: string;
  readonly period: DateRange;
  readonly unit: "hour" | "day" | "week";
  readonly quantity: number;
  readonly status: AccountRentalStatus;
  readonly total: Money;
  readonly deposit?: Money;
  /** No live source — `AccountRentalDto2` has only a `depositReleased` boolean, no timestamp. */
  readonly depositReleasedAt?: string;
  readonly orderId: string;
  /** No live source — `AccountRentalDto2` gives only `orderId`, no reference string. */
  readonly orderReference?: string;
}

export type AccountSessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface AccountSession {
  readonly id: string;
  readonly reference: string;
  readonly coachId: string;
  readonly coachName: string;
  /** No live source — `AccountSessionDto2` gives only a numeric `coachId`, no slug to build the coach's public page path from. */
  readonly coachHref?: string;
  readonly packageName: string;
  /** No live source — `AccountSessionDto2` has no delivery-mode field. */
  readonly mode?: "in-person" | "online";
  /** No live source — the live DTO books one session at a time, not a multi-session package count. */
  readonly sessionCount?: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly total: Money;
  readonly status: AccountSessionStatus;
  readonly statusNote?: string;
  readonly goal?: string;
  /**
   * Whether the customer may cancel it from here. A structural rule only —
   * still to happen, not already cancelled — the cancellation WINDOW and any
   * refund are OPEN BUSINESS DECISIONS.
   */
  readonly canCancel: boolean;
}

export type AccountEnrolmentStatus = "pending" | "active" | "completed" | "cancelled";

export interface AccountEnrolment {
  readonly id: string;
  readonly reference: string;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly courseHref: string;
  /** `YYYY-MM-DD`. Optional — live `AccountEnrolmentDto.cohortStartsOn` is nullable (no cohort assigned yet). */
  readonly cohortStartsOn?: string;
  readonly status: AccountEnrolmentStatus;
  readonly progressPercent: number;
  readonly enrolledAt: string;
  readonly amountPaid: Money;
  /**
   * The full price, so a pending place can say what is still owed. Optional —
   * `AccountEnrolmentDto` has no price field at all; no live source to
   * fabricate it from.
   */
  readonly price?: Money;
}

export type ReviewTargetType = "product" | "rental-item" | "coach" | "course";

export interface AccountReview {
  readonly id: string;
  readonly targetType: ReviewTargetType;
  readonly targetTitle: string;
  readonly targetHref?: string;
  readonly rating: number;
  readonly title?: string;
  readonly body: string;
  readonly submittedAt: string;
  /** Held until staff moderate it; only `approved` reviews are public. */
  readonly status: "pending" | "approved" | "rejected";
  /** Live `AccountReviewDto` has no verified-purchase flag; reads default this to `false` rather than fabricate `true`. */
  readonly isVerifiedPurchase: boolean;
}

/**
 * Something the customer has bought, hired, trained with or studied and has
 * not reviewed yet — the only things they may review. Eligibility beyond that
 * ("a verified purchase") is an OPEN BUSINESS DECISION.
 */
export interface Reviewable {
  readonly type: ReviewTargetType;
  readonly id: string;
  readonly title: string;
}

export interface ReviewDraft {
  readonly type: ReviewTargetType;
  readonly id: string;
  readonly rating: number;
  readonly title?: string;
  readonly body: string;
}

export interface AddressInput {
  readonly label?: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly line1: string;
  readonly city: string;
}

/** The overview's read model: who, and what is coming up next in each domain. */
export interface AccountOverview {
  readonly profile: CustomerProfile;
  readonly preferences: CustomerPreferences;
  readonly counts: {
    /** No live source — the overview's `OverviewCounts` sends only `openOrders`, no running total of all orders. */
    readonly orders?: number;
    readonly openOrders: number;
    /**
     * No live source — `OverviewCounts.activeRentals` is a narrower, different
     * figure ("active" hires, not a total count) and isn't reused here to
     * avoid mislabelling it.
     */
    readonly rentals?: number;
    /** No live source — `OverviewCounts.upcomingSessions` is "upcoming", not a total count, and isn't reused here to avoid mislabelling it. */
    readonly sessions?: number;
    /** No live source at all on the overview endpoint. */
    readonly enrolments?: number;
    readonly reviewsToWrite: number;
  };
  readonly nextSession?: AccountSession;
  readonly nextRental?: AccountRental;
  readonly nextCohort?: AccountEnrolment;
  readonly recentOrders: readonly AccountOrder[];
}
