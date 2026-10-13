import { httpClient, orNull } from "@/services";
import type { Address, Money } from "@/types";

import type {
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
  OrderShippingAddress,
  ReviewTargetType,
  Reviewable,
} from "../types";
import type { AccountService } from "./account.contract";

const enc = encodeURIComponent;
const me = { auth: true } as const;

/*
 * Every `/v1/me/*` endpoint behind this adapter (tags Me, MeOrders,
 * MeEngagement) resolves the customer AND the response language from the
 * bearer token — grepped, zero `parameters` blocks on any of them. So unlike
 * every other domain, nothing here sends `language` (or `locale`) as a query
 * parameter; the `locale` argument on each contract method only exists to
 * satisfy `AccountService` (the mock adapter needs it to resolve text).
 */

/* ------------------------------------------------------------ live shapes */

interface LiveOrderAddress {
  readonly recipient: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
}

interface LiveOrderLine {
  readonly id: number;
  readonly kind: string;
  readonly title: string;
  readonly sku?: string | null;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
}

interface LiveOrderTotals {
  readonly itemsSubtotal: Money;
  readonly shipping: Money;
  readonly tax: Money;
  readonly depositsTotal: Money;
  readonly grandTotal: Money;
}

/** `AccountOrderDto`. */
interface LiveOrder {
  readonly id: number;
  readonly reference: string;
  readonly status: string;
  readonly address?: LiveOrderAddress | null;
  readonly lines: readonly LiveOrderLine[];
  readonly totals: LiveOrderTotals;
  readonly placedAt: string;
  readonly progress: readonly { readonly status: string; readonly done: boolean }[];
}

/** `AccountRentalDto2` (also reused for the overview's `nextRental: AccountRentalDto` — same shape). */
interface LiveRental {
  readonly id: number;
  readonly reference: string;
  readonly itemId: number;
  readonly itemTitle: string;
  readonly from: string;
  readonly to: string;
  readonly unit: string;
  readonly quantity: number;
  readonly status: string;
  readonly subtotal: Money;
  readonly deposit?: Money | null;
  readonly depositReleased: boolean;
  readonly orderId?: number | null;
}

/** `AccountSessionDto2` (also reused for the overview's `nextSession: AccountSessionDto` — same shape). */
interface LiveSession {
  readonly id: number;
  readonly reference: string;
  readonly coachId: number;
  readonly coachName: string;
  readonly packageName: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total: Money;
  readonly note?: string | null;
  readonly canCancel: boolean;
}

interface LiveCourseRef {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
}

/** `AccountEnrolmentDto`. */
interface LiveEnrolment {
  readonly id: number;
  readonly reference: string;
  readonly course: LiveCourseRef;
  readonly courseHref?: string | null;
  readonly status: string;
  readonly cohortStartsOn?: string | null;
  readonly amountPaid: Money;
  readonly progressPercent: number;
  readonly enrolledAt: string;
}

/** `AccountReviewDto`. */
interface LiveReview {
  readonly id: number;
  readonly targetType: string;
  readonly targetId: number;
  readonly targetTitle: string;
  readonly rating: number;
  readonly title?: string | null;
  readonly body: string;
  readonly status: string;
  readonly moderationNote?: string | null;
  readonly submittedAt: string;
}

/** `ReviewableDto`. */
interface LiveReviewable {
  readonly type: string;
  readonly id: number;
  readonly title: string;
}

/** `CustomerProfileDto`. */
interface LiveProfile {
  readonly id: number;
  readonly displayName: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly avatarUrl?: string | null;
  readonly createdAt: string;
}

/** `CustomerPreferencesDto` — no `favouriteSportIds` at all. */
interface LivePreferences {
  readonly locale: string;
  readonly marketingOptIn: boolean;
  readonly currency?: string;
}

/** `AddressDto` — no `label`/`region`/`postalCode`/`countryCode`/`geo`. */
interface LiveAddress {
  readonly id: number;
  readonly recipient: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
  readonly notes?: string | null;
}

/** `AddressRequest` — no `label` field at all. */
interface LiveAddressRequest {
  readonly recipient?: string;
  readonly phone?: string;
  readonly line1?: string;
  readonly line2?: string;
  readonly city?: string;
  readonly notes?: string;
}

interface LiveOverviewCounts {
  readonly openOrders: number;
  readonly upcomingSessions: number;
  readonly activeRentals: number;
}

/**
 * `AccountOverviewDto`. `nextCohort`'s schema in the live spec is an empty
 * object (`{}` — looks like a spec-generation artifact, not an intentional
 * "any"); treated defensively here as `LiveEnrolment`-shaped when present,
 * since that's the overview's analogue to `nextSession`/`nextRental`.
 */
interface LiveOverview {
  readonly nextSession?: LiveSession | null;
  readonly nextRental?: LiveRental | null;
  readonly nextCohort?: LiveEnrolment | null;
  readonly recentOrders: readonly LiveOrder[];
  readonly counts: LiveOverviewCounts;
  readonly reviewsToWrite: number;
}

/* -------------------------------------------------------------- mappers */

function toOrder(dto: LiveOrder): AccountOrder {
  return {
    id: String(dto.id),
    reference: dto.reference,
    status: dto.status as AccountOrderStatus,
    placedAt: dto.placedAt,
    lines: dto.lines.map(
      (line): AccountOrderLine => ({
        id: String(line.id),
        kind: line.kind as AccountOrderLine["kind"],
        title: line.title,
        // Closest live field to a line description — AccountOrderLineDto has
        // no separate description.
        description: line.sku ?? undefined,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.lineTotal,
        // rentalPeriod/href: no live source — the line carries no product or
        // rental-item reference (slug/id) to build either from.
      }),
    ),
    itemsSubtotal: dto.totals.itemsSubtotal,
    depositsTotal: dto.totals.depositsTotal,
    // Live names this `shipping`; the contract calls it `shippingTotal`.
    shippingTotal: dto.totals.shipping,
    taxTotal: dto.totals.tax,
    grandTotal: dto.totals.grandTotal,
    shippingAddress: dto.address
      ? ({
          // Live names this `recipient`; the contract calls it `recipientName`.
          recipientName: dto.address.recipient,
          phone: dto.address.phone,
          line1: dto.address.line1,
          line2: dto.address.line2 ?? undefined,
          city: dto.address.city,
          // id/countryCode: no live source — see `OrderShippingAddress`.
        } satisfies OrderShippingAddress)
      : undefined,
    progress: dto.progress.map((step) => ({ step: step.status as AccountOrderStatus, done: step.done })),
  };
}

function toRental(dto: LiveRental): AccountRental {
  return {
    id: String(dto.id),
    reference: dto.reference,
    itemTitle: dto.itemTitle,
    // itemHref: no live source (see types.ts).
    period: { from: dto.from, to: dto.to },
    unit: dto.unit as AccountRental["unit"],
    quantity: dto.quantity,
    status: dto.status as AccountRentalStatus,
    total: dto.subtotal,
    deposit: dto.deposit ?? undefined,
    // depositReleasedAt: no live source — only a `depositReleased` boolean (see types.ts).
    // `orderId` is nullable live even though a rental is, in practice, always
    // tied to an order; falls back to an empty string rather than the
    // literal "null"/"undefined" `String()` would otherwise produce.
    orderId: dto.orderId != null ? String(dto.orderId) : "",
    // orderReference: no live source (see types.ts).
  };
}

function toSession(dto: LiveSession): AccountSession {
  return {
    id: String(dto.id),
    reference: dto.reference,
    coachId: String(dto.coachId),
    coachName: dto.coachName,
    // coachHref: no live source (see types.ts).
    packageName: dto.packageName,
    // mode/sessionCount/goal: no live source (see types.ts).
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    total: dto.total,
    status: dto.status as AccountSessionStatus,
    // Live names this `note`; the contract calls it `statusNote`.
    statusNote: dto.note ?? undefined,
    canCancel: dto.canCancel,
  };
}

function toEnrolment(dto: LiveEnrolment): AccountEnrolment {
  return {
    id: String(dto.id),
    reference: dto.reference,
    courseId: String(dto.course.id),
    courseTitle: dto.course.title,
    // Live sends courseHref directly (nullable); built from the course slug
    // on the rare response that omits it.
    courseHref: dto.courseHref ?? `/education/courses/${dto.course.slug}`,
    cohortStartsOn: dto.cohortStartsOn ?? undefined,
    status: dto.status as AccountEnrolmentStatus,
    progressPercent: dto.progressPercent,
    enrolledAt: dto.enrolledAt,
    amountPaid: dto.amountPaid,
    // price: no live source — AccountEnrolmentDto has no full-price field (see types.ts).
  };
}

function toReview(dto: LiveReview): AccountReview {
  return {
    id: String(dto.id),
    targetType: dto.targetType as ReviewTargetType,
    targetTitle: dto.targetTitle,
    // targetHref: no live source — only a numeric targetId, no slug to build a page path from.
    rating: dto.rating,
    title: dto.title ?? undefined,
    body: dto.body,
    submittedAt: dto.submittedAt,
    status: dto.status as AccountReview["status"],
    // Live has no verified-purchase flag; default `false` rather than fabricate `true` (see types.ts).
    isVerifiedPurchase: false,
  };
}

function toReviewable(dto: LiveReviewable): Reviewable {
  return { type: dto.type as ReviewTargetType, id: String(dto.id), title: dto.title };
}

function toProfile(dto: LiveProfile): CustomerProfile {
  return {
    id: String(dto.id),
    displayName: dto.displayName,
    email: dto.email,
    phone: dto.phone ?? undefined,
    avatarUrl: dto.avatarUrl ?? undefined,
    createdAt: dto.createdAt,
  };
}

function toPreferences(dto: LivePreferences): CustomerPreferences {
  return {
    currency: (dto.currency as CustomerPreferences["currency"]) ?? "JOD",
    locale: dto.locale as CustomerPreferences["locale"],
    // No live source — CustomerPreferencesDto has no favourite-sports field (see types.ts).
    favouriteSportIds: [],
    marketingOptIn: dto.marketingOptIn,
  };
}

function toAddress(dto: LiveAddress): Address {
  return {
    id: String(dto.id),
    // Live names this `recipient`; the domain calls it `recipientName`.
    recipientName: dto.recipient,
    phone: dto.phone,
    line1: dto.line1,
    line2: dto.line2 ?? undefined,
    city: dto.city,
    // label/region/postalCode/countryCode/geo: no live source on AddressDto.
  };
}

/** The real bug this fixes: posting `input` as-is sent `recipientName`, which `AddressRequest` doesn't have — the name was silently dropped server-side. */
function toAddressRequest(input: AddressInput): LiveAddressRequest {
  return {
    recipient: input.recipientName,
    phone: input.phone,
    line1: input.line1,
    city: input.city,
    // Live AddressRequest has no `label` field at all — input.label has nowhere to go.
  };
}

/**
 * The account area over `/v1/me/*`.
 *
 * The `customerId` every method takes is IGNORED here: the API identifies the
 * customer from the bearer token, which is the only source it may trust. The
 * parameter stays on the contract because the mock adapter has no token to
 * read and needs to be told.
 */
export const httpAccountService: AccountService = {
  getOverview: async (customerId, _locale) => {
    const [dto, profile, preferences] = await Promise.all([
      httpClient.get<LiveOverview>("/v1/me/overview", me),
      httpAccountService.getProfile(customerId),
      httpAccountService.getPreferences(customerId),
    ]);
    return {
      profile,
      preferences,
      counts: {
        openOrders: dto.counts.openOrders,
        reviewsToWrite: dto.reviewsToWrite,
        // orders/rentals/sessions/enrolments: no live total-count source on
        // the overview endpoint — see the field comments on `AccountOverview`.
      },
      nextSession: dto.nextSession ? toSession(dto.nextSession) : undefined,
      nextRental: dto.nextRental ? toRental(dto.nextRental) : undefined,
      nextCohort: dto.nextCohort ? toEnrolment(dto.nextCohort) : undefined,
      recentOrders: dto.recentOrders.map(toOrder),
    } satisfies AccountOverview;
  },

  listOrders: async () => (await httpClient.get<LiveOrder[]>("/v1/me/orders", me)).map(toOrder),

  getOrder: (_customerId, orderId) =>
    orNull(httpClient.get<LiveOrder>(`/v1/me/orders/${enc(orderId)}`, me)).then((dto) => (dto ? toOrder(dto) : null)),

  cancelOrder: async (_customerId, orderId) => {
    await httpClient.post<void>(`/v1/me/orders/${enc(orderId)}/cancel`, undefined, me);
  },

  listRentals: async () => (await httpClient.get<LiveRental[]>("/v1/me/rentals", me)).map(toRental),

  listSessions: async () => (await httpClient.get<LiveSession[]>("/v1/me/sessions", me)).map(toSession),

  cancelSession: async (_customerId, sessionId, reason) => {
    await httpClient.post<void>(`/v1/me/sessions/${enc(sessionId)}/cancel`, { reason }, me);
  },

  listEnrolments: async () => (await httpClient.get<LiveEnrolment[]>("/v1/me/enrolments", me)).map(toEnrolment),

  listReviews: async () => (await httpClient.get<LiveReview[]>("/v1/me/reviews", me)).map(toReview),

  listReviewable: async () => (await httpClient.get<LiveReviewable[]>("/v1/me/reviewable", me)).map(toReviewable),

  submitReview: async (_customerId, draft) => {
    // `SubmitReviewRequest.id` (the target's id) is int64: sent as a JSON number.
    await httpClient.post<void>("/v1/me/reviews", { ...draft, id: Number(draft.id) }, me);
  },

  listAddresses: async () => (await httpClient.get<LiveAddress[]>("/v1/me/addresses", me)).map(toAddress),

  addAddress: async (_customerId, input) =>
    toAddress(await httpClient.post<LiveAddress>("/v1/me/addresses", toAddressRequest(input), me)),

  removeAddress: async (_customerId, addressId) => {
    await httpClient.delete<void>(`/v1/me/addresses/${enc(addressId)}`, me);
  },

  getProfile: async () => toProfile(await httpClient.get<LiveProfile>("/v1/me/profile", me)),

  updateProfile: async (_customerId, input) => toProfile(await httpClient.put<LiveProfile>("/v1/me/profile", input, me)),

  getPreferences: async () => toPreferences(await httpClient.get<LivePreferences>("/v1/me/preferences", me)),

  updatePreferences: async (_customerId, next) => {
    // favouriteSportIds has no live field to write to — dropped, not fabricated.
    await httpClient.put<void>("/v1/me/preferences", { locale: next.locale, marketingOptIn: next.marketingOptIn }, me);
  },
};
