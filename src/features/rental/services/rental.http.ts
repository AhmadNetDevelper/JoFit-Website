import { fetchSitemapEntries, httpClient, orNull } from "@/services";
import { listParams } from "@/services/http/query";
import type { Location, MediaImage, Money, PageMeta } from "@/types";

import type {
  RentalAvailability,
  RentalCategory,
  RentalItem,
  RentalListResult,
  RentalPeriod,
  RentalQuote,
  RentalRate,
  RentalUnit,
} from "../types";
import type { RentalService } from "./rental.contract";

const enc = encodeURIComponent;

/** `DepotRefDto` — unlike the task brief assumed, this actually carries `city`/`countryCode` too, so it maps onto the shared `Location` type cleanly (just no `geo`). */
interface LiveDepotRef {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly countryCode: string;
}

/** `CourseCategoryRefDto` — reused (by schema dedup) as the rental category ref on an item. */
interface LiveCategoryRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

interface LiveRentalRate {
  readonly unit: string;
  readonly price: Money;
  readonly minUnits: number;
  readonly maxUnits?: number;
}

/** `PublicRentalItemDto`. */
interface LiveRentalItem {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description?: string;
  readonly condition: string;
  readonly depot: LiveDepotRef;
  readonly categories: readonly LiveCategoryRef[];
  readonly rates: readonly LiveRentalRate[];
  readonly deposit?: Money;
  readonly media: readonly {
    readonly id: string;
    readonly url: string;
    readonly alt: string;
    readonly width?: number;
    readonly height?: number;
  }[];
  readonly publishedAt?: string;
}

/** `MediaImageDto` — always an image on this endpoint, despite carrying its own stray nullable `kind` string. */
function toMediaImage(dto: { id: string; url: string; alt: string; width?: number; height?: number }): MediaImage {
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width, height: dto.height };
}

interface LivePagedRentalItems {
  readonly items: readonly LiveRentalItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  readonly meta?: PageMeta;
}

/** `PublicRentalCategoryDto`. */
interface LiveRentalCategory {
  readonly id: number;
  readonly slug?: string;
  readonly name: string;
  readonly description?: string;
  readonly parentId?: number | null;
}

interface LiveDayAvailability {
  readonly date: string;
  readonly availableUnits: number;
}

/** `RentalAvailabilityDto`. */
interface LiveRentalAvailability {
  readonly itemId: number;
  readonly from: string;
  readonly to: string;
  readonly minAvailable: number;
  readonly days: readonly LiveDayAvailability[];
}

/** `RentalPeriodRequest` — flat, unlike the contract's nested `RentalPeriod`. */
interface LiveRentalPeriodRequest {
  readonly unit: string;
  readonly from: string;
  readonly to: string;
  readonly quantity: number;
}

/** `RentalQuoteDto` — also flat, and calls the units field `units` not `billableUnits`. */
interface LiveRentalQuote {
  readonly itemId: number;
  readonly unit: string;
  readonly from: string;
  readonly to: string;
  readonly quantity: number;
  readonly units: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
  readonly deposit?: Money;
  readonly isAvailable: boolean;
  readonly unavailableReason?: string;
}


function toLocation(depot: LiveDepotRef): Location {
  return { id: String(depot.id), name: depot.name, city: depot.city, countryCode: depot.countryCode };
}

function toRate(rate: LiveRentalRate): RentalRate {
  return {
    unit: rate.unit as RentalUnit,
    price: rate.price,
    minUnits: rate.minUnits,
    maxUnits: rate.maxUnits,
  };
}

/**
 * No live "total fleet size" field exists at all on `PublicRentalItemDto` —
 * the closest available proxy is the largest per-rate booking ceiling
 * (`RentalRateDto.maxUnits`) the item actually publishes, which is also what
 * the quantity picker caps against. Falls back to 1 (never reports more units
 * than the API has told us about) when no rate declares a ceiling.
 */
function toTotalUnits(rates: readonly LiveRentalRate[]): number {
  const caps = rates.map((rate) => rate.maxUnits).filter((value): value is number => typeof value === "number");
  return caps.length > 0 ? Math.max(...caps) : 1;
}

function toItem(dto: LiveRentalItem): RentalItem {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary,
    description: dto.description ?? "",
    categoryIds: dto.categories.map((category) => String(category.id)),
    // No live source — `PublicRentalItemDto` has no sport tags at all.
    sportIds: [],
    media: dto.media.map(toMediaImage),
    rates: dto.rates.map(toRate),
    deposit: dto.deposit,
    location: toLocation(dto.depot),
    condition: dto.condition as RentalItem["condition"],
    totalUnits: toTotalUnits(dto.rates),
    // No live source — `coaches`-style zero summary; see `rating` below for why.
    rating: { average: 0, count: 0 },
    // Nullable live; only used for sort order/sitemap `lastModified`, never rendered.
    publishedAt: dto.publishedAt ?? "",
  };
}

function toCategory(dto: LiveRentalCategory): RentalCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
    parentId: dto.parentId != null ? String(dto.parentId) : null,
    // No live source — `PublicRentalCategoryDto` has no sport tags.
    sportIds: [],
  };
}

function toListResult(dto: LivePagedRentalItems): RentalListResult {
  return {
    items: dto.items.map(toItem),
    meta:
      dto.meta ?? {
        page: dto.page,
        pageSize: dto.pageSize,
        totalItems: dto.totalCount,
        totalPages: dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(1, dto.pageSize))),
        hasNextPage: dto.hasNextPage ?? dto.page * dto.pageSize < dto.totalCount,
        hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
      },
    // No live `facets` field at all — same gap as `shop`; nothing to bind client-built facets to.
    facets: [],
  };
}

function toAvailability(dto: LiveRentalAvailability): RentalAvailability {
  return {
    itemId: String(dto.itemId),
    range: { from: dto.from, to: dto.to },
    days: dto.days.map((day) => ({ date: day.date, unitsAvailable: day.availableUnits })),
  };
}

function toLiveRentalPeriodRequest(period: RentalPeriod): LiveRentalPeriodRequest {
  return { unit: period.unit, from: period.range.from, to: period.range.to, quantity: period.quantity };
}

function toQuote(itemId: string, dto: LiveRentalQuote): RentalQuote {
  return {
    itemId,
    period: { range: { from: dto.from, to: dto.to }, unit: dto.unit as RentalUnit, quantity: dto.quantity },
    billableUnits: dto.units,
    unitPrice: dto.unitPrice,
    subtotal: dto.subtotal,
    deposit: dto.deposit,
    isAvailable: dto.isAvailable,
    unavailableReason: dto.unavailableReason as RentalQuote["unavailableReason"],
  };
}

/** Equipment hire over `/v1/rental-items` and `/v1/rental-categories`. */
export const httpRentalService: RentalService = {
  listItems: async (query) => {
    const dto = await httpClient.get<LivePagedRentalItems>("/v1/rental-items", {
      query: {
        ...listParams(query),
        categorySlugs: query.categorySlugs,
        // sportSlugs/locationIds/price/minRating/availableBetween: no live
        // backing — confirmed `GET /rental-items` only takes
        // Page/PageSize/Search/CategorySlugs/Sort/language. Unsupported
        // server-side today; intentionally not sent.
      },
      revalidate: 60,
    });
    return toListResult(dto);
  },

  getItemBySlug: (slug, locale) =>
    orNull(httpClient.get<LiveRentalItem>(`/v1/rental-items/${enc(slug)}`, { query: { language: locale }, revalidate: 60 })).then(
      (dto) => (dto ? toItem(dto) : null),
    ),

  listCategories: async (locale) => {
    const dtos = await httpClient.get<LiveRentalCategory[]>("/v1/rental-categories", {
      query: { language: locale },
      revalidate: 300,
    });
    return dtos.map(toCategory);
  },

  getCategoryBySlug: (slug, locale) =>
    orNull(
      httpClient.get<LiveRentalCategory>(`/v1/rental-categories/${enc(slug)}`, {
        query: { language: locale },
        revalidate: 300,
      }),
    ).then((dto) => (dto ? toCategory(dto) : null)),

  /* Availability and quotes change by the minute: never cached. */
  getAvailability: async (itemId, range) => {
    const dto = await httpClient.get<LiveRentalAvailability>(`/v1/rental-items/${enc(itemId)}/availability`, {
      query: { from: range.from, to: range.to },
      cache: "no-store",
    });
    return toAvailability(dto);
  },

  quote: async (itemId, period) => {
    const dto = await httpClient.post<LiveRentalQuote>(
      `/v1/rental-items/${enc(itemId)}/quote`,
      toLiveRentalPeriodRequest(period),
      { cache: "no-store" },
    );
    return toQuote(itemId, dto);
  },

  listSitemapEntries: () => fetchSitemapEntries("rental", (slug) => `/rental/items/${slug}`),
};
