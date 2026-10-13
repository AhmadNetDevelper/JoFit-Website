import type { SportId } from "@/features/sports";
import type {
  DateRange,
  Facet,
  ListQuery,
  Location,
  Media,
  MediaImage,
  Money,
  NumericRange,
  Paginated,
  RatingSummary,
  SeoMeta,
} from "@/types";

/**
 * Rental is NOT a product with a different price field.
 *
 * A rental is a claim on a *physical unit over a time window*. That gives it
 * three concepts a catalogue product has none of: an availability calendar, a
 * booked period, and a booking lifecycle that continues after payment
 * (collected → active → returned). Modelling it as a product variant would make
 * every one of those a special case, so it gets its own model here.
 */
export type RentalUnit = "hour" | "day" | "week";

export interface RentalRate {
  readonly unit: RentalUnit;
  readonly price: Money;
  readonly minUnits: number;
  readonly maxUnits?: number;
}

export interface RentalCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly parentId: string | null;
  readonly sportIds: readonly SportId[];
  readonly seo?: SeoMeta;
}

export type RentalCondition = "new" | "excellent" | "good" | "fair";

export interface RentalItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  readonly media: readonly Media[];
  /** At least one rate; which units a given item supports is item-specific. */
  readonly rates: readonly RentalRate[];
  /** Refundable security amount, when the source declares one. */
  readonly deposit?: Money;
  readonly location: Location;
  readonly condition: RentalCondition;
  /** Total physical units the operator owns — the ceiling on any single booking. */
  readonly totalUnits: number;
  readonly rating: RatingSummary;
  readonly publishedAt: string;
  readonly seo?: SeoMeta;
}

export interface RentalAvailabilityDay {
  /** ISO-8601 date. */
  readonly date: string;
  readonly unitsAvailable: number;
}

export interface RentalAvailability {
  readonly itemId: string;
  readonly range: DateRange;
  readonly days: readonly RentalAvailabilityDay[];
}

/** A concrete reservation intent: what, when, how many. */
export interface RentalPeriod {
  readonly range: DateRange;
  readonly unit: RentalUnit;
  readonly quantity: number;
}

/**
 * Priced by the data layer, never by the UI. Rental pricing (inclusive days,
 * weekend rates, long-hire tapering, deposits, late fees) is an OPEN BUSINESS
 * DECISION; the frontend renders the quote it is handed.
 */
export interface RentalQuote {
  readonly itemId: string;
  readonly period: RentalPeriod;
  readonly billableUnits: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
  readonly deposit?: Money;
  readonly isAvailable: boolean;
  /** Machine-readable reason when `isAvailable` is false. */
  readonly unavailableReason?: "insufficient-units" | "invalid-period" | "unsupported-unit";
}

export type RentalBookingStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "collected"
  | "returned"
  | "cancelled";

export interface RentalBooking {
  readonly id: string;
  readonly reference: string;
  readonly itemId: string;
  readonly itemTitle: string;
  readonly period: RentalPeriod;
  readonly status: RentalBookingStatus;
  readonly total: Money;
  readonly deposit?: Money;
  readonly createdAt: string;
}

export interface RentalListQuery extends ListQuery {
  readonly categorySlugs?: readonly string[];
  readonly sportSlugs?: readonly string[];
  readonly locationIds?: readonly string[];
  /** Only items with capacity across the whole window. */
  readonly availableBetween?: DateRange;
  readonly price?: NumericRange;
  readonly minRating?: number;
}

export interface RentalListResult extends Paginated<RentalItem> {
  readonly facets: readonly Facet[];
}

export const RENTAL_SORT_KEYS = ["relevance", "newest", "price-asc", "price-desc", "rating-desc"] as const;
export type RentalSortKey = (typeof RENTAL_SORT_KEYS)[number];

/** What the cart needs to hold a rental line without re-fetching the item. */
export interface RentalSelection {
  readonly item: Pick<RentalItem, "id" | "slug" | "title">;
  readonly period: RentalPeriod;
  readonly quote: RentalQuote;
  readonly image?: MediaImage;
}
