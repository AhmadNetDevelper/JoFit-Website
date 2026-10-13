import type { CatalogueImageRecord } from "@/features/backoffice-bridge/types";
import type { Media, MediaImage } from "@/types";

/**
 * IMAGES STAFF SAVED IN THE ADMIN, LAID OVER THE STOREFRONT'S FIXTURES.
 *
 * The catalogue itself is not bridged: the admin reads a snapshot of these
 * fixtures and edits its own copy. Its pictures are the exception. When staff
 * save an image field on a record the storefront has, the admin sends that one
 * field over the development bridge (`catalogue-image`), it lands here, and
 * every mock adapter lays it over the fixture as it reads it — inside the
 * `toX()` mapping each adapter already has, so every page that reads the
 * record gets the new picture and none of them had to change.
 *
 * HELD ON `globalThis`, for the same reason as the account store: Next
 * compiles the bridge's route handler and each page into separate server
 * bundles, and a module-level map would be one copy per bundle — the route
 * would write to its copy and the pages would read another. The key carries a
 * shape version, so a dev server that hot-reloads a changed shape builds a new
 * map instead of serving the old one.
 *
 * WHAT IS STORED IS WHAT WAS RECEIVED: an upload's `data:` URL in mock mode,
 * the API's `http://localhost:4000/media/…` under the mock API. The one read-
 * time adjustment is for a picture the storefront already holds: the admin's
 * snapshot made fixture paths absolute against the storefront
 * (`admin/src/mocks/website/assets.ts`), so an unchanged fixture photo can come
 * back as `http://localhost:3001/images/…` under its own id. Served like that,
 * `next/image` would refuse the host; the same id and the same file resolve to
 * the path the storefront already serves.
 *
 * Deleted with the rest of `src/mocks`.
 */

/** The image fields staff can change, per record — single pictures and ordered galleries. */
export const CATALOGUE_IMAGE_FIELDS = {
  product: { media: "gallery" },
  "product-category": { image: "single" },
  brand: { logo: "single" },
  sport: { image: "single" },
  "rental-item": { media: "gallery" },
  coach: { avatar: "single", gallery: "gallery" },
  course: { media: "gallery" },
  article: { coverImage: "single" },
  author: { avatar: "single" },
} as const satisfies Readonly<Record<CatalogueImageRecord, Readonly<Record<string, "single" | "gallery">>>>;

export type { CatalogueImageRecord };

/** A single picture (`undefined` once it is removed) or a gallery in display order. */
export type CatalogueImageValue = MediaImage | undefined | readonly Media[];

interface CatalogueImageStore {
  /** `${record}:${id}` → field → the value staff saved. */
  readonly records: Map<string, Map<string, CatalogueImageValue>>;
}

const globalStore = globalThis as typeof globalThis & { __jofitCatalogueImagesV1?: CatalogueImageStore };

function store(): CatalogueImageStore {
  globalStore.__jofitCatalogueImagesV1 ??= { records: new Map() };
  return globalStore.__jofitCatalogueImagesV1;
}

const keyOf = (record: CatalogueImageRecord, id: string) => `${record}:${id}`;

/** Records one field of one record. The caller has checked the record, the field and the value. */
export function setCatalogueImage(
  record: CatalogueImageRecord,
  id: string,
  field: string,
  value: CatalogueImageValue,
): void {
  const records = store().records;
  const key = keyOf(record, id);
  const fields = records.get(key) ?? new Map<string, CatalogueImageValue>();
  fields.set(field, value);
  records.set(key, fields);
}

/** `http://localhost:3001/images/a.jpg` is the file `/images/a.jpg`. */
function sameFile(received: string, own: string): boolean {
  if (received === own) return true;
  if (!own.startsWith("/") || own.startsWith("//")) return false;
  try {
    return new URL(received).pathname === own;
  } catch {
    return false;
  }
}

/* `Array.isArray` does not narrow a `readonly` array out of a union. */
const isGallery = (value: CatalogueImageValue): value is readonly Media[] => Array.isArray(value);

function asOwn<TMedia extends Media>(received: TMedia, fixture: readonly Media[]): TMedia {
  const own = fixture.find((entry) => entry.id === received.id && entry.kind === received.kind);
  return own && own.url !== received.url && sameFile(received.url, own.url) ? { ...received, url: own.url } : received;
}

/**
 * The record as the storefront should now show it: the fixture, with every
 * image field staff have saved since laid over it. Unchanged records come back
 * as they went in.
 */
export function withCatalogueImages<TRaw extends { readonly id: string }>(
  record: CatalogueImageRecord,
  raw: TRaw,
): TRaw {
  const saved = store().records.get(keyOf(record, raw.id));
  if (!saved || saved.size === 0) return raw;

  const next: Record<string, unknown> = { ...raw };
  for (const [field, value] of saved) {
    const current = (raw as Record<string, unknown>)[field];
    if (isGallery(value)) {
      const fixture = Array.isArray(current) ? (current as readonly Media[]) : [];
      next[field] = value.map((entry) => asOwn(entry, fixture));
    } else if (value) {
      const fixture = current && typeof current === "object" ? [current as Media] : [];
      next[field] = asOwn(value, fixture);
    } else {
      next[field] = undefined;
    }
  }
  return next as TRaw;
}
