import type { LocalizedText } from "@/i18n";

import { notify } from "./store";

/**
 * WHAT EACH EVENT SAYS, AND TO WHOM.
 *
 * Every write that someone else should hear about goes through one of these,
 * so the wording lives in one place and in both languages. The real backend
 * owns this at go-live (it is where the order is placed and the status moved);
 * this file is the specification of which event notifies whom.
 *
 * Paths: storefront paths carry no locale, staff paths are admin routes.
 */

type StatusKind = "order" | "rental" | "session" | "enrolment" | "review";

const STATUS: Readonly<Record<StatusKind, Readonly<Record<string, LocalizedText>>>> = {
  order: {
    confirmed: { en: "confirmed", ar: "تم تأكيده" },
    processing: { en: "being prepared", ar: "قيد التجهيز" },
    shipped: { en: "on its way", ar: "في الطريق إليك" },
    completed: { en: "completed", ar: "مكتمل" },
    cancelled: { en: "cancelled", ar: "ملغى" },
    refunded: { en: "refunded", ar: "مسترد" },
  },
  rental: {
    confirmed: { en: "confirmed", ar: "تم تأكيده" },
    collected: { en: "collected", ar: "تم استلامه" },
    returned: { en: "returned", ar: "تم إرجاعه" },
    cancelled: { en: "cancelled", ar: "ملغى" },
  },
  session: {
    confirmed: { en: "confirmed", ar: "تم تأكيدها" },
    completed: { en: "completed", ar: "مكتملة" },
    cancelled: { en: "cancelled", ar: "ملغاة" },
  },
  enrolment: {
    active: { en: "confirmed", ar: "تم تأكيده" },
    completed: { en: "completed", ar: "مكتمل" },
    cancelled: { en: "cancelled", ar: "ملغى" },
  },
  review: {
    approved: { en: "published", ar: "تم نشره" },
    rejected: { en: "not published", ar: "لم يُنشر" },
  },
};

const SUBJECT: Readonly<Record<StatusKind, LocalizedText>> = {
  order: { en: "Your order", ar: "طلبك" },
  rental: { en: "Your hire", ar: "حجز الإيجار" },
  session: { en: "Your coaching session", ar: "جلستك التدريبية" },
  enrolment: { en: "Your course place", ar: "مقعدك في الدورة" },
  review: { en: "Your review", ar: "تقييمك" },
};

const CUSTOMER_PATH: Readonly<Record<StatusKind, (id: string) => string>> = {
  order: (id) => `/account/orders/${id}`,
  rental: () => "/account/rentals",
  session: () => "/account/bookings",
  enrolment: () => "/account/enrolments",
  review: () => "/account/reviews",
};

const KIND = {
  order: "order-status",
  rental: "rental-status",
  session: "session-status",
  enrolment: "enrolment-status",
  review: "review-moderated",
} as const;

/** A status moved (by staff or a coach): tell the customer it concerns. */
export function notifyStatusChange(
  kind: StatusKind,
  record: { readonly id: string; readonly reference?: string; readonly customerId?: string },
  status: string,
): void {
  const label = STATUS[kind][status];
  if (!label || !record.customerId || record.customerId === "guest") return;
  const ref = record.reference ? ` ${record.reference}` : "";
  notify({
    audience: "customer",
    recipientId: record.customerId,
    kind: KIND[kind],
    title: { en: `${SUBJECT[kind].en}${ref} is ${label.en}`, ar: `${SUBJECT[kind].ar}${ref} ${label.ar}` },
    body: {
      en: status === "cancelled" ? "Open it to see why." : "Open it for the details.",
      ar: status === "cancelled" ? "افتحه لتعرف السبب." : "افتحه للتفاصيل.",
    },
    href: CUSTOMER_PATH[kind](record.id),
  });
}

/** A customer placed a reservation: tell them what happens next, and tell staff. */
export function notifyOrderPlaced(order: { id: string; reference: string; customerId: string }, customerName: string): void {
  notify({
    audience: "customer",
    recipientId: order.customerId,
    kind: "order-placed",
    title: { en: `Reservation ${order.reference} received`, ar: `استلمنا حجزك ${order.reference}` },
    body: {
      en: "We will confirm it shortly. You pay on collection or delivery.",
      ar: "سنؤكده قريباً. الدفع عند الاستلام أو التوصيل.",
    },
    href: `/account/orders/${order.id}`,
  });
  notify({
    audience: "staff",
    kind: "order-placed",
    title: { en: `New order ${order.reference}`, ar: `طلب جديد ${order.reference}` },
    body: { en: `From ${customerName}. Waiting to be confirmed.`, ar: `من ${customerName}. بانتظار التأكيد.` },
    href: `/orders/${order.id}`,
  });
}

/** A session was requested: the coach and staff both need to act on it. */
export function notifySessionRequested(booking: { id: string; reference: string; coachId: string }, clientName: string): void {
  notify({
    audience: "coach",
    recipientId: booking.coachId,
    kind: "session-requested",
    title: { en: `New session request ${booking.reference}`, ar: `طلب جلسة جديد ${booking.reference}` },
    body: { en: `From ${clientName}. Confirm or decline it.`, ar: `من ${clientName}. أكّده أو اعتذر عنه.` },
    href: "/coach/sessions",
  });
  notify({
    audience: "staff",
    kind: "session-requested",
    title: { en: `Session requested ${booking.reference}`, ar: `طلب جلسة ${booking.reference}` },
    body: { en: `${clientName} booked a coach.`, ar: `${clientName} حجز مع مدرب.` },
    href: `/coaches/bookings/${booking.id}`,
  });
}

/** Something new is waiting in a staff queue. */
export function notifyStaff(
  kind: "enrolment-requested" | "review-submitted" | "quotation-received" | "order-status" | "session-status",
  title: LocalizedText,
  body: LocalizedText,
  href: string,
): void {
  notify({ audience: "staff", kind, title, body, href });
}

/** The customer cancelled a session: the coach loses a slot and should know. */
export function notifyCoach(coachId: string, title: LocalizedText, body: LocalizedText): void {
  notify({ audience: "coach", recipientId: coachId, kind: "session-status", title, body, href: "/coach/sessions" });
}
