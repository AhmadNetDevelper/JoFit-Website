import type { Address } from "@/types";

import {
  seedCvFiles,
  seedEmployerAccounts,
  seedEmployers,
  seedJobApplications,
  seedJobCategories,
  seedJobs,
  type RawCvFile,
  type RawEmployer,
  type RawEmployerAccount,
  type RawJob,
  type RawJobApplication,
  type RawJobCategory,
} from "../careers";
import { seedMenuPages, seedMenus } from "../menus";

import { accountSnapshot } from "./snapshot";
import type {
  AccountSnapshot,
  RawCoachBooking,
  RawConversation,
  RawCustomer,
  RawEnrolment,
  RawMenu,
  RawMenuPage,
  RawNotification,
  RawOrder,
  RawQuotation,
  RawRentalBooking,
  RawReview,
  RawSupportMessage,
} from "./types";

/**
 * THE ONE MUTABLE STORE BEHIND EVERY SIGNED-IN SCREEN.
 *
 * A customer's checkout, a coaching session booked on a profile page, the
 * coach confirming it from the coach area, a course place, a review — all of
 * them write here, and every screen reads from here. That is what makes the
 * lifecycle real inside the mock: book as a customer, sign in as the coach and
 * the session is waiting to be confirmed; confirm it, sign back in as the
 * customer and it says confirmed.
 *
 * HELD ON `globalThis`. Next compiles pages, layouts and Server Actions into
 * separate server bundles, and a plain module-level array can be instantiated
 * once per bundle — the action would write to one copy and the page read
 * another. One global is one store. It still resets when the dev server
 * restarts, which is the honest behaviour for a mock.
 *
 * DATES ARE SHIFTED ON LOAD. The snapshot was taken on `takenAt`; every ISO
 * date in it moves forward by however many days have passed since, so
 * "shipped two days ago" stays two days ago.
 */
export interface AccountStore {
  readonly customers: RawCustomer[];
  readonly addresses: Map<string, Address[]>;
  readonly orders: RawOrder[];
  readonly rentalBookings: RawRentalBooking[];
  readonly coachBookings: RawCoachBooking[];
  readonly enrolments: RawEnrolment[];
  readonly reviews: RawReview[];
  readonly quotations: RawQuotation[];
  /** Content staff manage: the header's Courses menu and the pages it opens. */
  readonly menus: RawMenu[];
  readonly menuPages: RawMenuPage[];
  /** Everyone's bell — customers', coaches' and the staff team's. */
  readonly notifications: RawNotification[];
  /** Support chat. */
  readonly conversations: RawConversation[];
  readonly supportMessages: RawSupportMessage[];
  /** The careers marketplace: employers and their sign-ins, jobs, applications. */
  readonly employers: RawEmployer[];
  readonly employerAccounts: RawEmployerAccount[];
  readonly jobCategories: RawJobCategory[];
  readonly jobs: RawJob[];
  readonly jobApplications: RawJobApplication[];
  /** CV bytes, by id. Private — never in a snapshot. */
  readonly cvFiles: Map<string, RawCvFile>;
  sequence: number;
  /**
   * Bumped by every write. The admin's bridge polls it and re-reads the store
   * only when it moved — see `app/api/dev/store/route.ts`.
   */
  version: number;
}

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(.*)$/;

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  if (typeof value === "string") {
    const match = ISO_DATE.exec(value);
    if (!match) return value;
    const shifted = new Date(Date.parse(match[1]!) + days * MS_PER_DAY).toISOString().slice(0, 10);
    return `${shifted}${match[2]}` as T;
  }
  if (Array.isArray(value)) return value.map((entry) => shiftDates(entry, days)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, shiftDates(entry, days)]),
    ) as T;
  }
  return value;
}

function createStore(): AccountStore {
  const days = Math.round((todayUtc() - Date.parse(accountSnapshot.takenAt)) / MS_PER_DAY);
  const data: AccountSnapshot = shiftDates(accountSnapshot, days);
  return {
    customers: [...data.customers],
    addresses: new Map(
      data.customers.map((customer) => [customer.id, customer.address ? [customer.address] : []]),
    ),
    orders: [...data.orders],
    rentalBookings: [...data.rentalBookings],
    coachBookings: [...data.coachBookings],
    enrolments: [...data.enrolments],
    reviews: [...data.reviews],
    quotations: [...data.quotations],
    menus: structuredClone([...seedMenus]),
    menuPages: structuredClone([...seedMenuPages]),
    notifications: [],
    conversations: [],
    supportMessages: [],
    employers: structuredClone([...seedEmployers]),
    employerAccounts: structuredClone([...seedEmployerAccounts]),
    jobCategories: structuredClone([...seedJobCategories]),
    jobs: structuredClone([...seedJobs]),
    jobApplications: structuredClone([...seedJobApplications]),
    cvFiles: new Map(seedCvFiles.map((file) => [file.id, file])),
    sequence: 1,
    version: 1,
  };
}

/* The key carries the store's shape version: a dev server that hot-reloads
   this file after the shape changed must build a new store, not keep serving
   one missing the new fields. */
const globalStore = globalThis as typeof globalThis & { __jofitAccountStoreV4?: AccountStore };

export function accountStore(): AccountStore {
  globalStore.__jofitAccountStoreV4 ??= createStore();
  return globalStore.__jofitAccountStoreV4;
}

/** A reference nobody else holds, in the format the admin uses for each kind. */
export function nextReference(
  prefix:
    | "JF-2"
    | "CB-9"
    | "EN-9"
    | "RB-2"
    | "rev-w"
    | "QR-9"
    | "cust-w"
    | "SC-9"
    | "msg-w"
    | "ntf-w"
    | "JB-2"
    | "JA-3"
    | "emp-w"
    | "cv-w"
    | "jc-w",
): string {
  const store = accountStore();
  const value = `${prefix}${String(store.sequence).padStart(4, "0")}`;
  store.sequence += 1;
  // Every write asks for a reference first, so this is also where it is counted.
  store.version += 1;
  return value;
}

/** Marks the store as changed by a write that needed no new reference. */
export function touch(): void {
  accountStore().version += 1;
}

/**
 * Puts a line in someone's bell. Every write that another person should hear
 * about calls this — a customer's order reaches the staff team, a coach's
 * confirmation reaches the customer — so the bell is a record of events, not a
 * recount of queues.
 */
export function notify(entry: Omit<RawNotification, "id" | "createdAt" | "readAt">): void {
  accountStore().notifications.unshift({
    ...entry,
    id: nextReference("ntf-w"),
    createdAt: new Date().toISOString(),
  });
}

export const coachAccounts = accountSnapshot.coachAccounts;
export const staffEmails = accountSnapshot.staffEmails;
