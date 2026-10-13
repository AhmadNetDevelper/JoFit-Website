/**
 * THE DEVELOPMENT BRIDGE BETWEEN THE STOREFRONT AND THE ADMIN.
 *
 * Until there is a backend, each app keeps its data in its own process: the
 * storefront in its Node server, the admin in the browser. That made the two
 * halves of every lifecycle strangers — a session booked on the site never
 * reached the coach queue staff work from, and an order staff shipped stayed
 * "pending" on the customer's account.
 *
 * The bridge makes the storefront's account store the one copy while both dev
 * servers run. The admin reads it on start-up (and again whenever `version`
 * moves), and sends each change it makes back as a `BridgePatch`. It is a
 * stand-in for the API both apps will share, exposed only in development
 * against mock data — see `app/api/dev/store/route.ts`.
 */
export type BridgeKind =
  | "customer"
  | "order"
  | "rental"
  | "session"
  | "enrolment"
  | "review"
  | "quotation"
  | "conversation"
  | "notification"
  | "menu"
  | "menu-page"
  | "support-message"
  | "catalogue-image"
  /* careers: staff verify employers, review jobs and keep the categories */
  | "employer"
  | "job"
  | "job-category";

/** The catalogue records whose pictures staff edit — see `CatalogueImagePatch`. */
export type CatalogueImageRecord =
  | "product"
  | "product-category"
  | "brand"
  | "sport"
  | "rental-item"
  | "coach"
  | "course"
  | "article"
  | "author";

/**
 * `catalogue-image`: ONE image field staff saved on an EXISTING catalogue
 * record. The catalogue is not otherwise bridged — the admin edits its own copy
 * of a snapshot — so this is the only catalogue write that reaches the
 * storefront.
 *
 *   { op: "patch", kind: "catalogue-image", id: "<record id>",
 *     changes: { record: "brand", field: "logo", value: MediaImage | null } }
 *
 * Fields, per record (anything else is refused with 422):
 *   product media · product-category image · brand logo · sport image ·
 *   rental-item media · coach avatar, gallery · course media ·
 *   article coverImage · author avatar
 *
 * A single field takes a `MediaImage` or `null` (removed); a gallery takes a
 * `Media[]` in display order, the first image the cover (`null` empties it).
 * Every `url` is `http(s)://` or `data:image/`. A record id the storefront does
 * not have — one staff created in the admin — is ignored, not an error.
 */
export interface CatalogueImagePatch {
  readonly record: CatalogueImageRecord;
  readonly field: string;
  readonly value: unknown;
}

/**
 * A write from the admin.
 *
 * - `patch` (the default): these fields of an existing record changed. For
 *   `catalogue-image`, `changes` is a `CatalogueImagePatch`.
 * - `put`: the whole record, created if new — menus and menu pages, which
 *   staff edit as one document, and a job category.
 * - `delete`: remove the record — a menu page, a job category nothing is
 *   filed under, a job nobody applied for.
 * - `create`: append a new record — a staff reply in a support conversation.
 */
export interface BridgePatch {
  readonly op?: "patch" | "put" | "delete" | "create";
  readonly kind: BridgeKind;
  readonly id: string;
  readonly changes: Readonly<Record<string, unknown>>;
}

/**
 * Everything the admin mirrors, in the store's raw shapes. Typed loosely on
 * purpose: this crosses into another app whose own adapter owns the mapping.
 */
export interface BridgeSnapshot {
  readonly version: number;
  readonly customers: readonly unknown[];
  readonly orders: readonly unknown[];
  readonly rentalBookings: readonly unknown[];
  readonly coachBookings: readonly unknown[];
  readonly enrolments: readonly unknown[];
  readonly reviews: readonly unknown[];
  readonly quotations: readonly unknown[];
  readonly menus: readonly unknown[];
  readonly menuPages: readonly unknown[];
  /** The staff team's notifications only. */
  readonly notifications: readonly unknown[];
  /** Without guest tokens: those are the visitor's secret. */
  readonly conversations: readonly unknown[];
  readonly supportMessages: readonly unknown[];
  /** The careers marketplace. Every employer, whatever its verification. */
  readonly employers: readonly unknown[];
  readonly jobCategories: readonly unknown[];
  /** Every job, drafts included: staff review what the board never shows. */
  readonly jobs: readonly unknown[];
  /**
   * Applications with their CV's METADATA ONLY — `cv: { id, fileName,
   * mimeType, bytes }`, never the bytes (`/api/dev/cv/<id>` streams those) —
   * and without the employer's private note.
   */
  readonly jobApplications: readonly unknown[];
}
