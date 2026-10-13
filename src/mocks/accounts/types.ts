import type { LocalizedText } from "@/i18n";
import type { Address, DateRange, Money } from "@/types";

/**
 * WHAT A SIGNED-IN PERSON HAS DONE WITH JOFIT, AS THE STOREFRONT RECEIVES IT.
 *
 * `scripts/sync-account-fixtures.cjs` writes `snapshot.ts` from the admin's
 * fixtures: the same forty customers, the same orders, hires, sessions, course
 * places and reviews staff see. The storefront never had any of this — its
 * account area was a boundary — and typing a second set by hand would have
 * given the customer on the site a different history from the customer in the
 * admin, which is exactly the drift the catalogue sync was built to end.
 *
 * `store.ts` loads it, shifts its dates to today, and is then the one place
 * every account write lands: a checkout, a booking, an enrolment, a review.
 */
export interface RawCustomer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly locale: "en" | "ar";
  readonly marketingOptIn: boolean;
  readonly favouriteSportIds: readonly string[];
  readonly joinedDaysAgo: number;
  readonly address?: Address;
}

export interface RawCoachAccount {
  readonly coachId: string;
  readonly email: string;
  readonly name: LocalizedText;
}

export type RawOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface RawOrderLine {
  readonly id: string;
  readonly kind: "shop" | "rental";
  readonly title: string;
  readonly description?: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
  readonly rentalPeriod?: DateRange;
  readonly productId?: string;
  readonly variantId?: string;
  readonly rentalItemId?: string;
}

export interface RawOrder {
  readonly id: string;
  readonly reference: string;
  readonly status: RawOrderStatus;
  readonly placedAt: string;
  readonly customerId: string;
  readonly lines: readonly RawOrderLine[];
  readonly itemsSubtotal: Money;
  readonly depositsTotal: Money;
  readonly shippingTotal: Money;
  readonly taxTotal: Money;
  readonly grandTotal: Money;
  readonly shippingAddress?: Address;
}

export type RawRentalStatus = "pending" | "confirmed" | "collected" | "returned" | "cancelled";

export interface RawRentalBooking {
  readonly id: string;
  readonly reference: string;
  readonly itemId: string;
  readonly itemTitle: LocalizedText;
  readonly customerId: string;
  readonly period: DateRange;
  readonly unit: "hour" | "day" | "week";
  readonly quantity: number;
  readonly status: RawRentalStatus;
  readonly total: Money;
  readonly deposit?: Money;
  readonly depositReleasedAt?: string;
  readonly orderId: string;
  readonly createdAt: string;
}

export type RawSessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface RawCoachBooking {
  readonly id: string;
  readonly reference: string;
  readonly coachId: string;
  readonly packageId: string;
  readonly packageName: LocalizedText;
  readonly mode: "in-person" | "online";
  readonly sessionCount: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly total: Money;
  readonly customerId: string;
  readonly contact: { readonly name: string; readonly email: string; readonly phone: string };
  readonly goal?: string;
  readonly status: RawSessionStatus;
  readonly statusNote?: string;
  readonly createdAt: string;
}

export type RawEnrolmentStatus = "pending" | "active" | "completed" | "cancelled";

export interface RawEnrolment {
  readonly id: string;
  readonly reference: string;
  readonly courseId: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly cohortStartsOn: string;
  readonly status: RawEnrolmentStatus;
  readonly progressPercent: number;
  readonly enrolledAt: string;
  readonly amountPaid: Money;
  readonly statusNote?: string;
}

export type RawReviewTargetType = "product" | "rental-item" | "coach" | "course";

export interface RawReview {
  readonly id: string;
  readonly targetType: RawReviewTargetType;
  readonly targetId: string;
  readonly customerId: string;
  readonly authorName: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title?: string;
  readonly body: string;
  readonly submittedAt: string;
  readonly moderationStatus: "pending" | "approved" | "rejected";
  readonly moderationNote?: string;
  readonly isVerifiedPurchase?: boolean;
}

/**
 * A business request for a quote, in the admin's own vocabulary — the admin
 * inbox is where it is worked, so the storefront writes it in the shape the
 * inbox reads.
 */
export interface RawQuotation {
  readonly id: string;
  readonly reference: string;
  readonly subjectKind: "gym-equipment" | "facility" | "bulk-order" | "custom-equipment" | "corporate";
  readonly organisationName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone?: string;
  readonly sportIds: readonly string[];
  readonly quantityEstimate?: number;
  readonly budgetRange?: { readonly min: Money; readonly max: Money };
  readonly message: string;
  readonly status: "new" | "in-review" | "quoted" | "won" | "lost";
  readonly assigneeId: string | null;
  readonly submittedAt: string;
  readonly internalNote?: string;
}

export interface AccountSnapshot {
  readonly takenAt: string;
  readonly customers: readonly RawCustomer[];
  readonly coachAccounts: readonly RawCoachAccount[];
  readonly staffEmails: readonly string[];
  readonly orders: readonly RawOrder[];
  readonly rentalBookings: readonly RawRentalBooking[];
  readonly coachBookings: readonly RawCoachBooking[];
  readonly enrolments: readonly RawEnrolment[];
  readonly reviews: readonly RawReview[];
  readonly quotations: readonly RawQuotation[];
}

/* ------------------------------------------------------------------------
 * LIVE CONTENT AND MESSAGING — records that staff and visitors both write,
 * mirrored to the admin through the bridge like everything above.
 * --------------------------------------------------------------------- */

/** Where a menu item goes: one of the managed pages, or any path on the site. */
export type RawMenuTarget =
  | { readonly kind: "page"; readonly pageId: string }
  | { readonly kind: "link"; readonly href: string };

export interface RawMenuItem {
  readonly id: string;
  readonly label: LocalizedText;
  readonly isVisible: boolean;
  readonly target: RawMenuTarget;
}

export interface RawMenuGroup {
  readonly id: string;
  readonly label: LocalizedText;
  readonly items: readonly RawMenuItem[];
}

/** A navigation menu staff edit in the admin. Order in the arrays IS the display order. */
export interface RawMenu {
  readonly key: string;
  readonly label: LocalizedText;
  /** Where the menu's own heading links to. */
  readonly href: string;
  readonly groups: readonly RawMenuGroup[];
  readonly updatedAt: string;
}

export interface RawMenuPageSection {
  readonly id: string;
  readonly heading: LocalizedText;
  readonly body: LocalizedText;
}

/** A page a menu item can open, served at `/specialisations/{slug}`. */
export interface RawMenuPage {
  readonly id: string;
  readonly slug: string;
  readonly eyebrow: LocalizedText;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly sections: readonly RawMenuPageSection[];
  readonly cta?: { readonly label: LocalizedText; readonly href: string };
  readonly status: "draft" | "published";
  readonly updatedAt: string;
}

export type RawNotificationAudience = "customer" | "coach" | "employer" | "staff";

export type RawNotificationKind =
  | "order-placed"
  | "order-status"
  | "rental-status"
  | "session-requested"
  | "session-status"
  | "enrolment-requested"
  | "enrolment-status"
  | "review-submitted"
  | "review-moderated"
  | "quotation-received"
  | "support-message"
  /* careers */
  | "employer-registered"
  | "employer-verification"
  | "job-submitted"
  | "job-moderated"
  | "job-application"
  | "application-status";

/**
 * One line in someone's bell. `recipientId` is the customer or coach id; staff
 * notifications have none and belong to the whole team. Text is stored in both
 * languages because the reader's language is only known when it is read.
 */
export interface RawNotification {
  readonly id: string;
  readonly audience: RawNotificationAudience;
  readonly recipientId?: string;
  readonly kind: RawNotificationKind;
  readonly title: LocalizedText;
  readonly body: LocalizedText;
  /** A path without the locale for the storefront (`/account/orders/x`), an admin path for staff. */
  readonly href: string;
  readonly createdAt: string;
  readonly readAt?: string;
}

export type RawConversationStatus = "open" | "closed";

export interface RawConversation {
  readonly id: string;
  readonly reference: string;
  /** Set when a signed-in customer or coach started it. */
  readonly accountId?: string;
  readonly customerId?: string;
  readonly name: string;
  readonly email: string;
  /**
   * The secret a GUEST's browser holds (in an httpOnly cookie) to reach this
   * conversation again. Never sent to the admin or shown anywhere.
   */
  readonly guestToken?: string;
  readonly status: RawConversationStatus;
  readonly createdAt: string;
  readonly lastMessageAt: string;
  readonly visitorReadAt?: string;
  readonly staffReadAt?: string;
  readonly assigneeId?: string | null;
}

export interface RawSupportMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly author: "visitor" | "staff";
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
}
