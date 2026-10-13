/**
 * Regenerates `src/mocks/accounts/snapshot.ts` from the admin's fixtures.
 *
 *   node scripts/sync-account-fixtures.cjs
 *
 * The mirror image of `admin/scripts/sync-website-mocks.cjs`. The storefront
 * owns the CATALOGUE and the admin copies it; the admin owns the TRANSACTIONS —
 * customers, orders, hires, sessions, enrolments, reviews — and the storefront
 * copies those, so that Hussein signing in on the site sees the same nine
 * orders staff see on his customer record.
 *
 * Every date in the output is shifted at load time by however many days have
 * passed since `takenAt` (see `src/mocks/accounts/store.ts`), so a snapshot
 * taken today still reads as "last week" next month.
 *
 * Deleted with `src/mocks` when both apps read the same backend.
 */
const fs = require("node:fs");
const path = require("node:path");

const website = path.resolve(__dirname, "..");
const admin = path.resolve(website, "../admin");
const jiti = require(path.join(website, "node_modules/jiti"))(__filename, {
  alias: { "@": path.join(admin, "src") },
});
const load = (file) => jiti(path.join(admin, "src/mocks", file));

const { mockPeople, personAddress } = load("people/index.ts");
const { mockOrders } = load("orders/index.ts");
const { mockRentalBookings } = load("rental/index.ts");
const { mockCoachBookings, mockCoaches } = load("coaches/index.ts");
const { mockEnrolments } = load("education/index.ts");
const { mockReviews } = load("reviews/index.ts");
const { mockAdminUsers } = load("auth/index.ts");
const { mockQuotationRequests } = load("quotations/index.ts");

const clean = (value) => JSON.parse(JSON.stringify(value));

const snapshot = {
  takenAt: new Date().toISOString().slice(0, 10),

  customers: mockPeople.map((person) => ({
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    locale: person.locale,
    marketingOptIn: person.marketingOptIn,
    favouriteSportIds: person.favouriteSportIds,
    joinedDaysAgo: person.joinedDaysAgo,
    address: personAddress(person),
  })),

  /* Only the coaches the storefront lists can sign in to the coach area. */
  coachAccounts: mockCoaches
    .filter((coach) => coach.verificationStatus === "approved")
    .map((coach) => ({ coachId: coach.id, email: coach.email, name: coach.name })),

  staffEmails: mockAdminUsers.map((user) => user.email),

  orders: mockOrders.map((order) => ({
    id: order.id,
    reference: order.reference,
    status: order.status,
    placedAt: order.placedAt,
    customerId: order.customer.id,
    lines: order.lines.map((line) => ({
      id: line.id,
      kind: line.kind,
      title: line.title,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
      rentalPeriod: line.rentalPeriod,
      productId: line.productId,
      variantId: line.variantId,
      rentalItemId: line.rentalItemId,
    })),
    itemsSubtotal: order.itemsSubtotal,
    depositsTotal: order.depositsTotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    grandTotal: order.grandTotal,
    shippingAddress: order.shippingAddress,
  })),

  rentalBookings: mockRentalBookings.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    itemId: booking.itemId,
    itemTitle: booking.itemTitle,
    customerId: booking.customerId,
    period: booking.period,
    unit: booking.unit,
    quantity: booking.quantity,
    status: booking.status,
    total: booking.total,
    deposit: booking.deposit,
    depositReleasedAt: booking.depositReleasedAt,
    orderId: booking.orderId,
    createdAt: booking.audit.createdAt,
  })),

  coachBookings: mockCoachBookings.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    coachId: booking.coachId,
    packageId: booking.packageId,
    packageName: booking.packageName,
    mode: booking.mode,
    sessionCount: booking.sessionCount,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    total: booking.total,
    customerId: booking.customerId,
    contact: booking.contact,
    goal: booking.goal,
    status: booking.status,
    statusNote: booking.statusNote,
    createdAt: booking.audit.createdAt,
  })),

  enrolments: mockEnrolments.map((enrolment) => ({
    id: enrolment.id,
    reference: enrolment.reference,
    courseId: enrolment.courseId,
    customerId: enrolment.customerId,
    customerName: enrolment.customerName,
    cohortStartsOn: enrolment.cohortStartsOn,
    status: enrolment.status,
    progressPercent: enrolment.progressPercent,
    enrolledAt: enrolment.enrolledAt,
    amountPaid: enrolment.amountPaid,
    statusNote: enrolment.statusNote,
  })),

  quotations: mockQuotationRequests.map((request) => {
    const { audit, ...rest } = request;
    return rest;
  }),

  reviews: mockReviews.map((review) => ({
    id: review.id,
    targetType: review.target.type,
    targetId: review.target.id,
    customerId: review.customerId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    submittedAt: review.submittedAt,
    moderationStatus: review.moderationStatus,
    moderationNote: review.moderationNote,
    isVerifiedPurchase: review.isVerifiedPurchase,
  })),
};

const header = `/*
 * GENERATED — do not edit by hand.
 *
 * Written by \`node scripts/sync-account-fixtures.cjs\` from the admin's
 * fixtures in ../admin/src/mocks. See \`./types.ts\` for why it exists.
 */
import type { AccountSnapshot } from "./types";

export const accountSnapshot: AccountSnapshot = `;

const target = path.join(website, "src/mocks/accounts/snapshot.ts");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${header}${JSON.stringify(clean(snapshot), null, 2)};\n`);

const counts = Object.entries(snapshot)
  .filter(([, value]) => Array.isArray(value))
  .map(([key, value]) => `${key}=${value.length}`)
  .join(" ");
console.log(`Wrote ${path.relative(website, target)}: ${counts}`);
