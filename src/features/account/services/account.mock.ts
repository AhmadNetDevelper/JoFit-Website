import type { Locale } from "@/i18n";
import { AppError } from "@/lib";
import { accountStore, nextReference, notifyCoach, notifyStaff, touch } from "@/mocks/accounts";
import {
  coachRef,
  courseRef,
  productRef,
  rentalItemRef,
  targetRef,
  text,
} from "@/mocks/accounts/catalogue";
import type {
  RawCoachBooking,
  RawEnrolment,
  RawOrder,
  RawRentalBooking,
} from "@/mocks/accounts";
import { simulateLatency } from "@/mocks/runtime";
import type { Address } from "@/types";

import type {
  AccountEnrolment,
  AccountOrder,
  AccountOrderStatus,
  AccountRental,
  AccountReview,
  AccountSession,
  CustomerProfile,
  Reviewable,
} from "../types";
import type { AccountService } from "./account.contract";

/**
 * The account area against the shared account store.
 *
 * Every read filters by the customer id the SESSION supplied, and every
 * single-record read answers `null` for a record that exists but belongs to
 * someone else — "not yours" and "not there" must look the same, or the
 * difference is an enumeration oracle.
 */
const FLOW: readonly AccountOrderStatus[] = ["pending", "confirmed", "processing", "shipped", "completed"];

const byNewest = <T,>(pick: (row: T) => string) => (a: T, b: T) => pick(b).localeCompare(pick(a));

function toOrder(raw: RawOrder, locale: Locale): AccountOrder {
  const reached = FLOW.indexOf(raw.status);
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    placedAt: raw.placedAt,
    lines: raw.lines.map((line) => {
      const ref = line.kind === "shop" ? productRef(line.productId, locale) : rentalItemRef(line.rentalItemId, locale);
      return {
        id: line.id,
        kind: line.kind,
        // In the reader's language when the thing is still listed; as sold otherwise.
        title: ref?.title ?? line.title,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
        rentalPeriod: line.rentalPeriod,
        href: ref?.href,
      };
    }),
    itemsSubtotal: raw.itemsSubtotal,
    depositsTotal: raw.depositsTotal,
    shippingTotal: raw.shippingTotal,
    taxTotal: raw.taxTotal,
    grandTotal: raw.grandTotal,
    shippingAddress: raw.shippingAddress,
    progress: reached < 0 ? [] : FLOW.map((step, index) => ({ step, done: index <= reached })),
  };
}

function toRental(raw: RawRentalBooking, locale: Locale): AccountRental {
  const order = accountStore().orders.find((entry) => entry.id === raw.orderId);
  return {
    id: raw.id,
    reference: raw.reference,
    itemTitle: text(raw.itemTitle, locale),
    itemHref: rentalItemRef(raw.itemId, locale)?.href,
    period: raw.period,
    unit: raw.unit,
    quantity: raw.quantity,
    status: raw.status,
    total: raw.total,
    deposit: raw.deposit,
    depositReleasedAt: raw.depositReleasedAt,
    orderId: raw.orderId,
    orderReference: order?.reference ?? raw.orderId,
  };
}

function toSession(raw: RawCoachBooking, locale: Locale): AccountSession {
  const coach = coachRef(raw.coachId, locale);
  const ahead = raw.startsAt > new Date().toISOString();
  return {
    id: raw.id,
    reference: raw.reference,
    coachId: raw.coachId,
    coachName: coach?.title ?? raw.coachId,
    coachHref: coach?.href ?? "/coaches",
    packageName: text(raw.packageName, locale),
    mode: raw.mode,
    sessionCount: raw.sessionCount,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    total: raw.total,
    status: raw.status,
    statusNote: raw.statusNote,
    goal: raw.goal,
    canCancel: ahead && (raw.status === "pending" || raw.status === "confirmed"),
  };
}

function toEnrolment(raw: RawEnrolment, locale: Locale): AccountEnrolment {
  const course = courseRef(raw.courseId, locale);
  return {
    id: raw.id,
    reference: raw.reference,
    courseId: raw.courseId,
    courseTitle: course?.title ?? raw.courseId,
    courseHref: course?.href ?? "/education",
    cohortStartsOn: raw.cohortStartsOn,
    status: raw.status,
    progressPercent: raw.progressPercent,
    enrolledAt: raw.enrolledAt,
    amountPaid: raw.amountPaid,
    price: course?.price ?? raw.amountPaid,
  };
}

function ownedBy(customerId: string) {
  const store = accountStore();
  return {
    orders: store.orders.filter((row) => row.customerId === customerId),
    rentals: store.rentalBookings.filter((row) => row.customerId === customerId),
    sessions: store.coachBookings.filter((row) => row.customerId === customerId),
    seats: store.enrolments.filter((row) => row.customerId === customerId),
    reviews: store.reviews.filter((row) => row.customerId === customerId),
  };
}

function toProfile(customer: ReturnType<typeof requireCustomer>): CustomerProfile {
  return {
    id: customer.id,
    displayName: customer.name,
    email: customer.email,
    phone: customer.phone,
    createdAt: new Date(Date.now() - customer.joinedDaysAgo * 86_400_000).toISOString(),
  };
}

function requireCustomer(customerId: string) {
  const customer = accountStore().customers.find((entry) => entry.id === customerId);
  if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
  return customer;
}

function reviewable(customerId: string, locale: Locale): Reviewable[] {
  const mine = ownedBy(customerId);
  const already = new Set(mine.reviews.map((review) => `${review.targetType}:${review.targetId}`));
  const candidates = new Map<string, Reviewable>();
  const offer = (type: Reviewable["type"], id: string | undefined) => {
    if (!id || already.has(`${type}:${id}`)) return;
    const ref = targetRef(type, id, locale);
    if (ref) candidates.set(`${type}:${id}`, { type, id, title: ref.title });
  };

  mine.orders
    .filter((order) => order.status === "completed")
    .forEach((order) => order.lines.forEach((line) => offer("product", line.productId)));
  mine.rentals.filter((row) => row.status === "returned").forEach((row) => offer("rental-item", row.itemId));
  mine.sessions.filter((row) => row.status === "completed").forEach((row) => offer("coach", row.coachId));
  mine.seats
    .filter((row) => row.status === "active" || row.status === "completed")
    .forEach((row) => offer("course", row.courseId));

  return [...candidates.values()];
}

export const mockAccountService: AccountService = {
  async getOverview(customerId, locale) {
    await simulateLatency();
    const customer = requireCustomer(customerId);
    const mine = ownedBy(customerId);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const upcomingSessions = mine.sessions
      .filter((row) => row.startsAt >= now && (row.status === "pending" || row.status === "confirmed"))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const upcomingRentals = mine.rentals
      .filter((row) => row.period.to >= today && row.status !== "cancelled" && row.status !== "returned")
      .sort((a, b) => a.period.from.localeCompare(b.period.from));
    const upcomingSeats = mine.seats
      .filter((row) => row.cohortStartsOn >= today && (row.status === "pending" || row.status === "active"))
      .sort((a, b) => a.cohortStartsOn.localeCompare(b.cohortStartsOn));

    return {
      profile: {
        id: customer.id,
        displayName: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: new Date(Date.now() - customer.joinedDaysAgo * 86_400_000).toISOString(),
      },
      preferences: {
        currency: "JOD",
        locale: customer.locale,
        favouriteSportIds: customer.favouriteSportIds,
        marketingOptIn: customer.marketingOptIn,
      },
      counts: {
        orders: mine.orders.length,
        openOrders: mine.orders.filter((row) => ["pending", "confirmed", "processing", "shipped"].includes(row.status)).length,
        rentals: mine.rentals.length,
        sessions: mine.sessions.length,
        enrolments: mine.seats.length,
        reviewsToWrite: reviewable(customerId, locale).length,
      },
      nextSession: upcomingSessions[0] ? toSession(upcomingSessions[0], locale) : undefined,
      nextRental: upcomingRentals[0] ? toRental(upcomingRentals[0], locale) : undefined,
      nextCohort: upcomingSeats[0] ? toEnrolment(upcomingSeats[0], locale) : undefined,
      recentOrders: [...mine.orders].sort(byNewest((row) => row.placedAt)).slice(0, 3).map((row) => toOrder(row, locale)),
    };
  },

  async listOrders(customerId, locale) {
    await simulateLatency();
    return [...ownedBy(customerId).orders].sort(byNewest((row) => row.placedAt)).map((row) => toOrder(row, locale));
  },

  async getOrder(customerId, orderId, locale) {
    await simulateLatency();
    const raw = accountStore().orders.find((row) => row.id === orderId && row.customerId === customerId);
    return raw ? toOrder(raw, locale) : null;
  },

  async cancelOrder(customerId, orderId) {
    await simulateLatency();
    const store = accountStore();
    const index = store.orders.findIndex((row) => row.id === orderId && row.customerId === customerId);
    const order = store.orders[index];
    if (!order) throw new AppError("not-found", "That order could not be found.", { status: 404 });
    if (order.status !== "pending") {
      throw new AppError("conflict", "This order is already being prepared — contact us to change it.", { status: 409 });
    }
    store.orders[index] = { ...order, status: "cancelled" };
    notifyStaff(
      "order-status",
      { en: `Order ${order.reference} cancelled by the customer`, ar: `ألغى الزبون الطلب ${order.reference}` },
      { en: "Nothing needs preparing.", ar: "لا حاجة لتجهيزه." },
      `/orders/${order.id}`,
    );
    store.rentalBookings.forEach((booking, position) => {
      if (booking.orderId === orderId) store.rentalBookings[position] = { ...booking, status: "cancelled" };
    });
    touch();
  },

  async listRentals(customerId, locale) {
    await simulateLatency();
    return [...ownedBy(customerId).rentals]
      .sort(byNewest((row) => row.period.from))
      .map((row) => toRental(row, locale));
  },

  async listSessions(customerId, locale) {
    await simulateLatency();
    return [...ownedBy(customerId).sessions]
      .sort(byNewest((row) => row.startsAt))
      .map((row) => toSession(row, locale));
  },

  async cancelSession(customerId, sessionId, reason) {
    await simulateLatency();
    if (reason.trim().length < 3) {
      throw new AppError("validation", "Tell the coach why, in a few words.", {
        status: 422,
        details: { fieldErrors: { reason: "Tell the coach why, in a few words." } },
      });
    }
    const store = accountStore();
    const index = store.coachBookings.findIndex((row) => row.id === sessionId && row.customerId === customerId);
    const booking = store.coachBookings[index];
    if (!booking) throw new AppError("not-found", "That session could not be found.", { status: 404 });
    if (!toSession(booking, "en").canCancel) {
      throw new AppError("conflict", "That session can no longer be cancelled here.", { status: 409 });
    }
    store.coachBookings[index] = { ...booking, status: "cancelled", statusNote: reason.trim() };
    notifyCoach(
      booking.coachId,
      { en: `Session ${booking.reference} cancelled by the client`, ar: `ألغى العميل الجلسة ${booking.reference}` },
      { en: reason.trim(), ar: reason.trim() },
    );
    touch();
  },

  async listEnrolments(customerId, locale) {
    await simulateLatency();
    return [...ownedBy(customerId).seats]
      .sort(byNewest((row) => row.cohortStartsOn))
      .map((row) => toEnrolment(row, locale));
  },

  async listReviews(customerId, locale) {
    await simulateLatency();
    return [...ownedBy(customerId).reviews]
      .sort(byNewest((row) => row.submittedAt))
      .map((row): AccountReview => {
        const ref = targetRef(row.targetType, row.targetId, locale);
        return {
          id: row.id,
          targetType: row.targetType,
          targetTitle: ref?.title ?? row.targetId,
          targetHref: ref?.href,
          rating: row.rating,
          title: row.title,
          body: row.body,
          submittedAt: row.submittedAt,
          status: row.moderationStatus,
          isVerifiedPurchase: Boolean(row.isVerifiedPurchase),
        };
      });
  },

  async listReviewable(customerId, locale) {
    await simulateLatency();
    return reviewable(customerId, locale);
  },

  async submitReview(customerId, draft) {
    await simulateLatency();
    const customer = requireCustomer(customerId);
    const fieldErrors: Record<string, string> = {};
    if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
      fieldErrors.rating = "Choose a rating from one to five.";
    }
    if (draft.body.trim().length < 10) fieldErrors.body = "Write at least a sentence.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    // Only what they actually bought, hired, trained with or studied.
    if (!reviewable(customerId, "en").some((entry) => entry.type === draft.type && entry.id === draft.id)) {
      throw new AppError("forbidden", "You can review things you have bought or booked.", { status: 403 });
    }
    accountStore().reviews.push({
      id: nextReference("rev-w"),
      targetType: draft.type,
      targetId: draft.id,
      customerId,
      authorName: `${customer.name.split(" ")[0]} ${customer.name.split(" ")[1]?.[0] ?? ""}.`.trim(),
      rating: draft.rating as 1 | 2 | 3 | 4 | 5,
      title: draft.title?.trim() || undefined,
      body: draft.body.trim(),
      submittedAt: new Date().toISOString(),
      moderationStatus: "pending",
      isVerifiedPurchase: true,
    });
    notifyStaff(
      "review-submitted",
      { en: "A review is waiting for moderation", ar: "تقييم بانتظار المراجعة" },
      { en: `${draft.rating}★ from ${customer.name}`, ar: `${draft.rating}★ من ${customer.name}` },
      "/reviews",
    );
  },

  async listAddresses(customerId) {
    await simulateLatency();
    requireCustomer(customerId);
    return accountStore().addresses.get(customerId) ?? [];
  },

  async addAddress(customerId, input) {
    await simulateLatency();
    requireCustomer(customerId);
    const fieldErrors: Record<string, string> = {};
    if (input.recipientName.trim().length < 2) fieldErrors.recipientName = "Who should we hand it to?";
    if (!/^\+?[\d\s]{8,}$/.test(input.phone.trim())) fieldErrors.phone = "A number the courier can call.";
    if (input.line1.trim().length < 3) fieldErrors.line1 = "Street and building.";
    if (input.city.trim().length < 2) fieldErrors.city = "Which city?";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    const address: Address = {
      id: `addr-${Date.now().toString(36)}`,
      label: input.label?.trim() || undefined,
      recipientName: input.recipientName.trim(),
      phone: input.phone.trim(),
      line1: input.line1.trim(),
      city: input.city.trim(),
      countryCode: "JO",
    };
    const store = accountStore();
    store.addresses.set(customerId, [...(store.addresses.get(customerId) ?? []), address]);
    touch();
    return address;
  },

  async removeAddress(customerId, addressId) {
    await simulateLatency();
    const store = accountStore();
    store.addresses.set(
      customerId,
      (store.addresses.get(customerId) ?? []).filter((address) => address.id !== addressId),
    );
    touch();
  },

  async getProfile(customerId) {
    await simulateLatency();
    return toProfile(requireCustomer(customerId));
  },

  async updateProfile(customerId, input) {
    await simulateLatency();
    const name = input.name.trim().replace(/\s+/g, " ");
    const phone = input.phone?.trim() || undefined;
    const fieldErrors: Record<string, string> = {};
    if (name.length < 3 || !name.includes(" ")) fieldErrors.name = "Your first and last name.";
    if (phone && !/^\+?[\d\s]{8,}$/.test(phone)) fieldErrors.phone = "A phone number, digits only.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    const store = accountStore();
    const index = store.customers.findIndex((entry) => entry.id === customerId);
    const customer = store.customers[index];
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    const next = { ...customer, name, phone };
    store.customers[index] = next;
    touch();
    return toProfile(next);
  },

  async getPreferences(customerId) {
    await simulateLatency();
    const customer = requireCustomer(customerId);
    return {
      currency: "JOD",
      locale: customer.locale,
      favouriteSportIds: customer.favouriteSportIds,
      marketingOptIn: customer.marketingOptIn,
    };
  },

  async updatePreferences(customerId, next) {
    await simulateLatency();
    const store = accountStore();
    const index = store.customers.findIndex((entry) => entry.id === customerId);
    const customer = store.customers[index];
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    store.customers[index] = {
      ...customer,
      locale: next.locale,
      marketingOptIn: next.marketingOptIn,
      // `favouriteSportIds` is optional on the contract now (the live API has
      // nowhere to persist it); the mock still has a real place to store it,
      // so an omitted value here just keeps what was there.
      favouriteSportIds: next.favouriteSportIds ?? customer.favouriteSportIds,
    };
    touch();
  },
};
