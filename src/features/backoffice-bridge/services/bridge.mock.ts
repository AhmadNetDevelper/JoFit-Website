import { AppError } from "@/lib";
import {
  accountStore,
  notify,
  notifyCoach,
  notifyStatusChange,
  touch,
  type RawMenu,
  type RawMenuPage,
  type RawSupportMessage,
} from "@/mocks/accounts";

import { EMPLOYER_VERIFICATION_STATUSES, JOB_STATUSES } from "@/features/careers/types";
import type { LocalizedText } from "@/i18n";
import type { RawEmployer, RawJob, RawJobCategory } from "@/mocks/careers";
import { cvOf, downloadOf, toCvFile } from "@/mocks/careers/resolve";
import type { DownloadedFile } from "@/services";

import {
  CATALOGUE_IMAGE_FIELDS,
  setCatalogueImage,
  type CatalogueImageValue,
} from "@/mocks/catalogue-images";
import { mockCoaches } from "@/mocks/coaches";
import { mockArticles, mockAuthors } from "@/mocks/content";
import { mockCourses } from "@/mocks/education";
import { mockRentalItems } from "@/mocks/rental";
import { mockBrands, mockProductCategories, mockProducts } from "@/mocks/shop";
import { mockSports } from "@/mocks/sports";
import type { Media, MediaImage, MediaVideo } from "@/types";

import type { BridgeKind, BridgePatch, BridgeSnapshot, CatalogueImagePatch, CatalogueImageRecord } from "../types";

/**
 * Which fields the admin may change on each kind of record. A whitelist, not a
 * merge of whatever arrives: even a development endpoint should not let a
 * request rewrite a price or reassign an order to another customer.
 */
const WRITABLE: Readonly<Partial<Record<BridgeKind, readonly string[]>>> = {
  customer: ["name", "email", "phone", "locale", "marketingOptIn"],
  order: ["status"],
  rental: ["status", "depositReleasedAt"],
  session: ["status", "statusNote"],
  enrolment: ["status", "statusNote", "amountPaid", "progressPercent"],
  review: ["moderationStatus", "moderationNote"],
  quotation: ["status", "assigneeId", "internalNote"],
  conversation: ["status", "assigneeId", "staffReadAt"],
  notification: ["readAt"],
  /* Careers: staff decide; everything the employer wrote stays theirs. */
  employer: ["verificationStatus", "verificationNote"],
  job: ["status", "moderationNote", "featured", "postedAt"],
};

/** The status field of the kinds whose change the customer is told about. */
const NOTIFIED = { order: "status", rental: "status", session: "status", enrolment: "status", review: "moderationStatus" } as const;

/* ------------------------------------------------------- catalogue images */

/*
 * `catalogue-image` carries one image field of one catalogue record. The same
 * rule as `WRITABLE`, one level down: a whitelist of fields PER RECORD
 * (`CATALOGUE_IMAGE_FIELDS`), so a picture can be replaced and nothing else
 * about a product can. The value is re-checked here rather than trusted from
 * the admin, and only an image's own keys are kept.
 */
const IMAGE_URL = /^(https?:\/\/|data:image\/)/;
const VIDEO_URL = /^https?:\/\//;
const ALT_MAX = 300;
const GALLERY_MAX = 12;

/** The ids the storefront holds, per record. Read on each patch: the fixtures are the source. */
const CATALOGUE_IDS: Readonly<Record<CatalogueImageRecord, () => readonly { readonly id: string }[]>> = {
  product: () => mockProducts,
  "product-category": () => mockProductCategories,
  brand: () => mockBrands,
  sport: () => mockSports,
  "rental-item": () => mockRentalItems,
  coach: () => mockCoaches,
  course: () => mockCourses,
  article: () => mockArticles,
  author: () => mockAuthors,
};

const refuse = (message: string) => new AppError("validation", message, { status: 422 });

const dimension = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

function cleanImage(value: unknown, where: string): MediaImage {
  const image = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  if (image.kind !== "image") throw refuse(`${where} is not an image.`);
  if (typeof image.id !== "string" || image.id.trim() === "") throw refuse(`${where} has no id.`);
  if (typeof image.url !== "string" || !IMAGE_URL.test(image.url)) {
    throw refuse(`${where}: the address must start with https://, http:// or data:image/.`);
  }
  if (image.alt !== undefined && (typeof image.alt !== "string" || image.alt.length > ALT_MAX)) {
    throw refuse(`${where}: alt text is text of at most ${ALT_MAX} characters.`);
  }
  const width = dimension(image.width);
  const height = dimension(image.height);
  return {
    kind: "image",
    id: image.id.trim(),
    url: image.url,
    alt: typeof image.alt === "string" ? image.alt.trim() : "",
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

/** A video already on a gallery is kept (the admin does not upload them). */
function cleanVideo(value: Record<string, unknown>, where: string): MediaVideo {
  if (typeof value.id !== "string" || value.id.trim() === "") throw refuse(`${where} has no id.`);
  if (typeof value.url !== "string" || !VIDEO_URL.test(value.url)) {
    throw refuse(`${where}: a video address must start with https:// or http://.`);
  }
  if (value.posterUrl !== undefined && (typeof value.posterUrl !== "string" || !IMAGE_URL.test(value.posterUrl))) {
    throw refuse(`${where}: the poster address must start with https://, http:// or data:image/.`);
  }
  const seconds = dimension(value.durationSeconds);
  return {
    kind: "video",
    id: value.id.trim(),
    url: value.url,
    ...(typeof value.posterUrl === "string" ? { posterUrl: value.posterUrl } : {}),
    ...(seconds ? { durationSeconds: seconds } : {}),
  };
}

function cleanGallery(value: unknown): readonly Media[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw refuse("A gallery is a list of images.");
  if (value.length > GALLERY_MAX) throw refuse(`A gallery holds at most ${GALLERY_MAX} images.`);
  const seen = new Set<string>();
  return value.map((entry: unknown, index) => {
    const where = `Image ${index + 1}`;
    const raw = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    const media = raw.kind === "video" ? cleanVideo(raw, where) : cleanImage(raw, where);
    if (seen.has(media.id)) throw refuse(`${where} is already in the gallery.`);
    seen.add(media.id);
    return media;
  });
}

/**
 * Applies one `catalogue-image` patch. Returns whether anything was stored: a
 * record the storefront does not have — one staff created in the admin — is
 * not an error, because only existing records are synced.
 */
function applyCatalogueImage(patch: BridgePatch): boolean {
  const { record, field, value } = (patch.changes ?? {}) as Partial<CatalogueImagePatch>;
  if (typeof record !== "string" || !Object.hasOwn(CATALOGUE_IMAGE_FIELDS, record)) {
    throw refuse(`"${String(record)}" has no images the storefront shows.`);
  }
  const fields: Readonly<Record<string, "single" | "gallery">> = CATALOGUE_IMAGE_FIELDS[record as CatalogueImageRecord];
  const shape = typeof field === "string" && Object.hasOwn(fields, field) ? fields[field] : undefined;
  if (!shape || typeof field !== "string") {
    throw refuse(`"${String(field)}" is not an image field of a ${record}.`);
  }
  const next: CatalogueImageValue =
    shape === "gallery" ? cleanGallery(value) : value === null || value === undefined ? undefined : cleanImage(value, "The image");

  const known = CATALOGUE_IDS[record as CatalogueImageRecord]().some((row) => row.id === patch.id);
  if (!known) return false;
  setCatalogueImage(record as CatalogueImageRecord, patch.id, field, next);
  return true;
}

/* ---------------------------------------------------------------- careers */

/*
 * Staff verify employers and review jobs in the admin; these are the checks
 * and the employer's side of those decisions. The admin's own service already
 * refused anything the graph does not allow — this re-checks the VALUES, as
 * `cleanImage` does for pictures, so a development endpoint cannot store a
 * status that does not exist.
 */
const NOTE_MAX = 1000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkCareersChanges(kind: "employer" | "job", changes: Readonly<Record<string, unknown>>): void {
  const note = kind === "employer" ? changes.verificationNote : changes.moderationNote;
  if (note !== undefined && note !== null && (typeof note !== "string" || note.length > NOTE_MAX)) {
    throw refuse(`A note is text of at most ${NOTE_MAX} characters.`);
  }
  if (kind === "employer") {
    const status = changes.verificationStatus;
    if (status !== undefined && !(EMPLOYER_VERIFICATION_STATUSES as readonly unknown[]).includes(status)) {
      throw refuse(`"${String(status)}" is not a verification status.`);
    }
    return;
  }
  if (changes.status !== undefined && !(JOB_STATUSES as readonly unknown[]).includes(changes.status)) {
    throw refuse(`"${String(changes.status)}" is not a job status.`);
  }
  if (changes.featured !== undefined && typeof changes.featured !== "boolean") throw refuse("`featured` is true or false.");
  if (changes.postedAt !== undefined && (typeof changes.postedAt !== "string" || Number.isNaN(Date.parse(changes.postedAt)))) {
    throw refuse("`postedAt` is an ISO date and time.");
  }
}

/** A staff note, quoted in the employer's bell in both languages. */
const withNote = (en: string, ar: string, note: unknown): LocalizedText =>
  typeof note === "string" && note.trim()
    ? { en: `${en} JoFit's note: ${note.trim()}`, ar: `${ar} ملاحظة جوفِت: ${note.trim()}` }
    : { en, ar };

/** Staff moved a job: the employer hears it is live, needs changes, or was closed. */
function notifyJobModerated(job: RawJob, status: string, note: unknown): void {
  const copy =
    status === "open"
      ? {
          title: { en: `Your job is live: ${job.title}`, ar: `وظيفتك منشورة الآن: ${job.title}` },
          body: {
            en: `JoFit approved ${job.reference}. Candidates can apply from today.`,
            ar: `وافقت جوفِت على ${job.reference}، ويمكن للمرشّحين التقدّم لها من اليوم.`,
          },
        }
      : status === "rejected"
        ? {
            title: { en: `Your job needs changes: ${job.title}`, ar: `وظيفتك تحتاج تعديلات: ${job.title}` },
            body: withNote(
              `Edit ${job.reference} and send it for review again.`,
              `عدّل ${job.reference} وأرسلها للمراجعة من جديد.`,
              note,
            ),
          }
        : status === "closed"
          ? {
              title: { en: `JoFit closed your job: ${job.title}`, ar: `أغلقت جوفِت وظيفتك: ${job.title}` },
              body: {
                en: "It no longer takes applications. Everyone who applied is kept.",
                ar: "لم تعد تستقبل طلبات، ويبقى كل من تقدّم لها محفوظاً.",
              },
            }
          : undefined;
  if (!copy) return;
  notify({ audience: "employer", recipientId: job.employerId, kind: "job-moderated", ...copy, href: `/employer/jobs/${job.id}` });
}

/** Staff decided on an employer: verified (or reinstated), rejected or suspended. */
function notifyEmployerVerification(employer: RawEmployer, status: string, note: unknown): void {
  const copy =
    status === "verified"
      ? employer.verificationStatus === "suspended"
        ? {
            title: { en: "Your company is reinstated", ar: "أُعيد تفعيل حساب شركتك" },
            body: { en: "Your open jobs are back on the careers board.", ar: "عادت وظائفك المفتوحة إلى لوحة الوظائف." },
          }
        : {
            title: { en: "Your company is verified", ar: "تم توثيق شركتك" },
            body: {
              en: "Jobs you send for review can now go live on the careers board.",
              ar: "يمكن الآن نشر الوظائف التي ترسلها للمراجعة على لوحة الوظائف.",
            },
          }
      : status === "rejected"
        ? {
            title: { en: "JoFit could not verify your company", ar: "تعذّر على جوفِت توثيق شركتك" },
            body: withNote("Your jobs cannot go live yet.", "لا يمكن نشر وظائفك بعد.", note),
          }
        : status === "suspended"
          ? {
              title: { en: "Your company is suspended", ar: "حساب شركتك موقوف" },
              body: withNote("Your jobs are hidden from the careers board.", "وظائفك مخفيّة عن لوحة الوظائف.", note),
            }
          : undefined;
  if (!copy) return;
  notify({ audience: "employer", recipientId: employer.id, kind: "employer-verification", ...copy, href: "/employer" });
}

/** A category as staff saved it: a well-formed slug and a name in both languages. */
function cleanJobCategory(id: string, value: Readonly<Record<string, unknown>>): RawJobCategory {
  const name = (value.name && typeof value.name === "object" ? value.name : {}) as Record<string, unknown>;
  const en = typeof name.en === "string" ? name.en.trim() : "";
  const ar = typeof name.ar === "string" ? name.ar.trim() : "";
  if (!en || !ar) throw refuse("A job category is named in English and Arabic.");
  if (typeof value.slug !== "string" || !SLUG.test(value.slug)) throw refuse("A job category's slug is lower-case letters, numbers and hyphens.");
  if (accountStore().jobCategories.some((entry) => entry.slug === value.slug && entry.id !== id)) {
    throw new AppError("conflict", `Another job category already uses "${value.slug}".`, { status: 409 });
  }
  return { id, slug: value.slug, name: { en, ar } };
}

function collection(kind: BridgeKind): { id: string }[] {
  const store = accountStore();
  switch (kind) {
    case "customer":
      return store.customers;
    case "order":
      return store.orders;
    case "rental":
      return store.rentalBookings;
    case "session":
      return store.coachBookings;
    case "enrolment":
      return store.enrolments;
    case "review":
      return store.reviews;
    case "quotation":
      return store.quotations;
    case "conversation":
      return store.conversations;
    case "notification":
      return store.notifications;
    case "menu-page":
      return store.menuPages;
    case "support-message":
      return store.supportMessages;
    case "menu":
      return store.menus.map((menu) => ({ ...menu, id: menu.key }));
    case "employer":
      return store.employers;
    case "job":
      return store.jobs;
    case "job-category":
      return store.jobCategories;
    case "catalogue-image":
      /* Not an account-store collection: applied by `applyCatalogueImage`. */
      return [];
  }
}

function applyPatch(patch: BridgePatch): void {
  const allowed = WRITABLE[patch.kind];
  if (!allowed) throw new AppError("validation", `"${patch.kind}" cannot be patched.`, { status: 422 });
  const rows = collection(patch.kind);
  const index = rows.findIndex((row) => row.id === patch.id);
  if (index < 0) throw new AppError("not-found", `No ${patch.kind} "${patch.id}".`, { status: 404 });

  const before = rows[index]! as Record<string, unknown>;
  const changes = Object.fromEntries(Object.entries(patch.changes).filter(([key]) => allowed.includes(key)));
  const careers = patch.kind === "employer" || patch.kind === "job" ? patch.kind : undefined;
  if (careers) {
    checkCareersChanges(careers, changes);
    /* `null` is how the admin clears a note (JSON has no `undefined`): verifying
       or approving leaves no stale refusal behind. */
    for (const key of ["verificationNote", "moderationNote"]) if (changes[key] === null) changes[key] = undefined;
  }
  /* A careers record carries its own "last changed", which the board and the portal show. */
  rows[index] = { ...before, ...changes, ...(careers ? { updatedAt: new Date().toISOString() } : {}) } as { id: string };

  /* Staff's decision is news for the employer. */
  if (patch.kind === "job" && typeof changes.status === "string" && changes.status !== before.status) {
    notifyJobModerated(before as unknown as RawJob, changes.status, changes.moderationNote);
  }
  if (
    patch.kind === "employer" &&
    typeof changes.verificationStatus === "string" &&
    changes.verificationStatus !== before.verificationStatus
  ) {
    notifyEmployerVerification(before as unknown as RawEmployer, changes.verificationStatus, changes.verificationNote);
  }

  /* A status staff moved is news for the customer (and, for a session, the coach). */
  if (patch.kind in NOTIFIED) {
    const kind = patch.kind as keyof typeof NOTIFIED;
    const next = changes[NOTIFIED[kind]];
    if (typeof next === "string" && next !== before[NOTIFIED[kind]]) {
      const record = before as { id: string; reference?: string; customerId?: string; coachId?: string };
      notifyStatusChange(kind, record, next);
      if (kind === "session" && record.coachId && (next === "confirmed" || next === "cancelled")) {
        notifyCoach(
          record.coachId,
          { en: `JoFit ${next} session ${record.reference ?? ""}`.trim(), ar: `قامت جوفِت بتحديث الجلسة ${record.reference ?? ""}`.trim() },
          { en: "Open your sessions for the details.", ar: "افتح جلساتك للتفاصيل." },
        );
      }
    }
  }
}

export const mockBridgeService = {
  snapshot(): BridgeSnapshot {
    const store = accountStore();
    return {
      version: store.version,
      customers: store.customers.map((customer) => ({
        ...customer,
        addresses: store.addresses.get(customer.id) ?? [],
      })),
      orders: store.orders,
      rentalBookings: store.rentalBookings,
      coachBookings: store.coachBookings,
      enrolments: store.enrolments,
      reviews: store.reviews,
      quotations: store.quotations,
      menus: store.menus,
      menuPages: store.menuPages,
      notifications: store.notifications.filter((entry) => entry.audience === "staff"),
      conversations: store.conversations.map((conversation) => ({ ...conversation, guestToken: undefined })),
      supportMessages: store.supportMessages,
      employers: store.employers,
      jobCategories: store.jobCategories,
      jobs: store.jobs,
      /* The CV's metadata, never its bytes; the employer's private note stays theirs. */
      jobApplications: store.jobApplications.map((entry) => {
        const file = store.cvFiles.get(entry.cvId);
        return {
          ...entry,
          cvId: undefined,
          employerNote: undefined,
          cv: file ? toCvFile(file) : { id: entry.cvId, fileName: "", mimeType: "application/pdf", bytes: 0 },
        };
      }),
    };
  },

  /**
   * A candidate's CV, for staff: the bytes behind `jobApplications[].cv`.
   * Served by `app/api/dev/cv/[applicationId]` in development and by the mock
   * API's `GET /v1/admin/job-applications/:id/cv`. 404 when the application
   * or its file is gone.
   */
  cv(applicationId: string): DownloadedFile {
    const entry = accountStore().jobApplications.find((row) => row.id === applicationId);
    if (!entry) throw new AppError("not-found", "That application was not found.", { status: 404 });
    return downloadOf(cvOf(entry.cvId));
  },

  version(): number {
    return accountStore().version;
  },

  apply(patch: BridgePatch): number {
    const store = accountStore();
    /*
     * A picture is not account data. It does not move `version`: the snapshot
     * the admin mirrors does not contain it, so bumping would only make every
     * open admin re-read a store that has not changed. The pages read it on
     * their next render.
     */
    if (patch.kind === "catalogue-image") {
      if ((patch.op ?? "patch") !== "patch") {
        throw new AppError("validation", `"catalogue-image" is only ever patched.`, { status: 422 });
      }
      applyCatalogueImage(patch);
      return store.version;
    }
    switch (patch.op ?? "patch") {
      case "patch":
        applyPatch(patch);
        break;
      case "put": {
        if (patch.kind === "menu") {
          const menu = { ...(patch.changes as unknown as RawMenu), key: patch.id };
          const index = store.menus.findIndex((entry) => entry.key === patch.id);
          if (index < 0) store.menus.push(menu);
          else store.menus[index] = menu;
        } else if (patch.kind === "menu-page") {
          const page = { ...(patch.changes as unknown as RawMenuPage), id: patch.id };
          const index = store.menuPages.findIndex((entry) => entry.id === patch.id);
          if (index < 0) store.menuPages.push(page);
          else store.menuPages[index] = page;
        } else if (patch.kind === "job-category") {
          const category = cleanJobCategory(patch.id, patch.changes);
          const index = store.jobCategories.findIndex((entry) => entry.id === patch.id);
          if (index < 0) store.jobCategories.push(category);
          else store.jobCategories[index] = category;
        } else {
          throw new AppError("validation", `"${patch.kind}" cannot be replaced.`, { status: 422 });
        }
        break;
      }
      case "delete": {
        /* Only what staff may delete: a menu page, a spam review, a quotation
           request, a job category or a job. Orders, bookings, customers — and
           applications — are history and never are. */
        const deletable: readonly BridgeKind[] = ["menu-page", "review", "quotation", "job-category", "job"];
        if (!deletable.includes(patch.kind)) {
          throw new AppError("validation", `"${patch.kind}" cannot be deleted.`, { status: 422 });
        }
        /* The same refusals the admin gives, so the storefront never loses what it still needs. */
        if (patch.kind === "job-category" && store.jobs.some((job) => job.categoryId === patch.id)) {
          throw new AppError("conflict", "Jobs are filed under this category.", { status: 409 });
        }
        if (patch.kind === "job" && store.jobApplications.some((entry) => entry.jobId === patch.id)) {
          throw new AppError("conflict", "People applied for this job, so it is kept.", { status: 409 });
        }
        const rows = collection(patch.kind);
        const index = rows.findIndex((entry) => entry.id === patch.id);
        if (index >= 0) rows.splice(index, 1);
        break;
      }
      case "create": {
        if (patch.kind !== "support-message") {
          throw new AppError("validation", `"${patch.kind}" cannot be created here.`, { status: 422 });
        }
        const message = { ...(patch.changes as unknown as RawSupportMessage), id: patch.id, author: "staff" as const };
        const conversation = store.conversations.find((entry) => entry.id === message.conversationId);
        if (!conversation) throw new AppError("not-found", `No conversation "${message.conversationId}".`, { status: 404 });
        store.supportMessages.push(message);
        const index = store.conversations.indexOf(conversation);
        store.conversations[index] = { ...conversation, lastMessageAt: message.createdAt, staffReadAt: message.createdAt };
        /* A signed-in customer also gets it in their bell; a guest sees it in the chat. */
        if (conversation.customerId) {
          accountStore().notifications.unshift({
            id: `ntf-${message.id}`,
            audience: "customer",
            recipientId: conversation.customerId,
            kind: "support-message",
            title: { en: "JoFit replied to your message", ar: "ردّت جوفِت على رسالتك" },
            body: { en: message.body.slice(0, 120), ar: message.body.slice(0, 120) },
            href: "/account",
            createdAt: message.createdAt,
          });
        }
        break;
      }
    }
    touch();
    return accountStore().version;
  },
};

export type BridgeService = typeof mockBridgeService;
