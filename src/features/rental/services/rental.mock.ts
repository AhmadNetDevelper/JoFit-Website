import { resolveText, type Locale } from "@/i18n";
import { countDaysInclusive, eachDateInRange, isValidDateRange, multiplyMoney, notFound, paginate } from "@/lib";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { countFacet, inRange, matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import {
  buildAvailabilityDay,
  mockRentalCategories,
  mockRentalItems,
  type RawRentalCategory,
  type RawRentalItem,
} from "@/mocks/rental";
import { mockSports } from "@/mocks/sports";
import type { DateRange, Facet, FacetOption, SitemapEntry } from "@/types";

import type {
  RentalCategory,
  RentalItem,
  RentalListQuery,
  RentalPeriod,
  RentalQuote,
  RentalSortKey,
} from "../types";
import { lowestRate } from "../utils/rates";
import type { RentalService } from "./rental.contract";

/** Source → domain mapping; the HTTP adapter will do the same with a wire format. */
function toItem(fixture: RawRentalItem, locale: Locale): RentalItem {
  /* Staff's latest pictures over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("rental-item", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    title: resolveText(raw.title, locale),
    summary: resolveText(raw.summary, locale),
    description: resolveText(raw.description, locale),
    categoryIds: raw.categoryIds,
    sportIds: raw.sportIds,
    media: raw.media,
    rates: raw.rates,
    deposit: raw.deposit,
    /* The depot is DISPLAYED TEXT, so it is resolved here beside the title
       rather than stored as a string on the fixture. An English "Aqaba
       Waterfront" in the corner of an Arabic card was the single most visible
       thing wrong with `/ar/rental`. */
    location: {
      id: raw.location.id,
      name: resolveText(raw.location.name, locale),
      city: resolveText(raw.location.city, locale),
      countryCode: raw.location.countryCode,
    },
    condition: raw.condition,
    totalUnits: raw.totalUnits,
    rating: raw.rating,
    publishedAt: raw.publishedAt,
  };
}

function toCategory(raw: RawRentalCategory, locale: Locale): RentalCategory {
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    description: raw.description ? resolveText(raw.description, locale) : undefined,
    parentId: raw.parentId,
    sportIds: raw.sportIds,
  };
}

function slugsToIds<TEntity extends { id: string; slug: string }>(
  entities: readonly TEntity[],
  slugs: readonly string[] | undefined,
): string[] | undefined {
  if (!slugs || slugs.length === 0) return undefined;
  return entities.filter((entity) => slugs.includes(entity.slug)).map((entity) => entity.id);
}

function unitsAvailableAcross(item: { id: string; totalUnits: number }, range: DateRange): number {
  const dates = eachDateInRange(range);
  if (dates.length === 0) return 0;
  return dates.reduce(
    (lowest, date) => Math.min(lowest, buildAvailabilityDay(item.id, date, item.totalUnits).unitsAvailable),
    item.totalUnits,
  );
}

function applyFilters(query: RentalListQuery): RentalItem[] {
  const categoryIds = slugsToIds(mockRentalCategories, query.categorySlugs);
  const sportIds = slugsToIds(mockSports, query.sportSlugs);

  return mockRentalItems.map((raw) => toItem(raw, query.locale)).filter((item) => {
    if (!matchesText([item.title, item.summary, item.description], query.search)) return false;
    if (!matchesAny([...item.categoryIds], categoryIds)) return false;
    if (!matchesAny([...item.sportIds], sportIds)) return false;
    if (query.locationIds?.length && !query.locationIds.includes(item.location.id)) return false;
    if (!inRange(lowestRate(item).price.amount, query.price)) return false;
    if (query.minRating !== undefined && item.rating.average < query.minRating) return false;
    if (query.availableBetween && unitsAvailableAcross(item, query.availableBetween) < 1) return false;
    return true;
  });
}

function applySort(items: readonly RentalItem[], sort?: string): RentalItem[] {
  switch (sort as RentalSortKey | undefined) {
    case "price-asc":
      return sortBy(items, (a, b) => lowestRate(a).price.amount - lowestRate(b).price.amount);
    case "price-desc":
      return sortBy(items, (a, b) => lowestRate(b).price.amount - lowestRate(a).price.amount);
    case "rating-desc":
      return sortBy(items, (a, b) => b.rating.average - a.rating.average);
    case "newest":
      return sortBy(items, (a, b) => b.publishedAt.localeCompare(a.publishedAt));
    default:
      return [...items];
  }
}

function toOptions(
  entities: readonly { id: string; slug: string; name: string }[],
  counts: Map<string, number>,
): FacetOption[] {
  return entities
    .filter((entity) => counts.has(entity.id))
    .map((entity) => ({ value: entity.slug, label: entity.name, count: counts.get(entity.id) ?? 0 }));
}

function buildFacets(items: readonly RentalItem[], locale: Locale): Facet[] {
  const locationCounts = countFacet(items, (item) => [item.location.id]);
  return [
    {
      key: "category",
      label: "Category",
      kind: "multi",
      options: toOptions(
        mockRentalCategories.map((raw) => toCategory(raw, locale)),
        countFacet(items, (item) => item.categoryIds),
      ),
    },
    {
      key: "sport",
      label: "Sport",
      kind: "multi",
      options: toOptions(
        mockSports.map((raw) => ({ id: raw.id, slug: raw.slug, name: resolveText(raw.name, locale) })),
        countFacet(items, (item) => item.sportIds),
      ),
    },
    {
      key: "location",
      label: "Location",
      kind: "multi",
      options: [...locationCounts.entries()].map(([id, count]) => ({
        value: id,
        label: items.find((item) => item.location.id === id)?.location.name ?? id,
        count,
      })),
    },
    { key: "availability", label: "Available between", kind: "range", options: [] },
  ];
}

/**
 * PLACEHOLDER PRICING. Billable units are counted as inclusive calendar days
 * (or a flat quantity for hourly items) and multiplied by the matching rate.
 * Real tapering, weekend rates, part-day rounding and deposit rules are an OPEN
 * BUSINESS DECISION and will be computed by the backend.
 */
function billableUnits(period: RentalPeriod): number {
  switch (period.unit) {
    case "day":
      return countDaysInclusive(period.range);
    case "week":
      return Math.max(1, Math.ceil(countDaysInclusive(period.range) / 7));
    case "hour":
      return Math.max(1, period.quantity);
  }
}

export const mockRentalService: RentalService = {
  async listItems(query) {
    await simulateLatency();
    const filtered = applyFilters(query);
    const sorted = applySort(filtered, query.sort);
    return { ...paginate(sorted, query), facets: buildFacets(filtered, query.locale) };
  },

  async getItemBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockRentalItems.find((item) => item.slug === slug);
    return raw ? toItem(raw, locale) : null;
  },

  async listCategories(locale) {
    await simulateLatency();
    return mockRentalCategories.map((raw) => toCategory(raw, locale));
  },

  async getCategoryBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockRentalCategories.find((category) => category.slug === slug);
    return raw ? toCategory(raw, locale) : null;
  },

  async getAvailability(itemId, range) {
    await simulateLatency();
    const item = mockRentalItems.find((entry) => entry.id === itemId);
    if (!item) throw notFound(`Rental item "${itemId}"`);
    return {
      itemId,
      range,
      days: eachDateInRange(range).map((date) => buildAvailabilityDay(itemId, date, item.totalUnits)),
    };
  },

  async quote(itemId, period): Promise<RentalQuote> {
    await simulateLatency();
    const item = mockRentalItems.find((entry) => entry.id === itemId);
    if (!item) throw notFound(`Rental item "${itemId}"`);

    const rate = item.rates.find((entry) => entry.unit === period.unit);
    const base = {
      itemId,
      period,
      billableUnits: 0,
      unitPrice: lowestRate(item).price,
      subtotal: { amount: 0, currency: lowestRate(item).price.currency },
      deposit: item.deposit,
    } as const;

    if (!rate) return { ...base, isAvailable: false, unavailableReason: "unsupported-unit" };
    if (!isValidDateRange(period.range) || period.quantity < 1) {
      return { ...base, isAvailable: false, unavailableReason: "invalid-period" };
    }

    const units = billableUnits(period);
    const subtotal = multiplyMoney(rate.price, units * period.quantity);
    const available = unitsAvailableAcross(item, period.range) >= period.quantity;

    return {
      itemId,
      period,
      billableUnits: units,
      unitPrice: rate.price,
      subtotal,
      deposit: item.deposit ? multiplyMoney(item.deposit, period.quantity) : undefined,
      isAvailable: available,
      unavailableReason: available ? undefined : "insufficient-units",
    };
  },

  async listSitemapEntries(): Promise<readonly SitemapEntry[]> {
    await simulateLatency();
    return [
      { path: "/rental", changeFrequency: "daily", priority: 0.9 },
      ...mockRentalCategories.map((category) => ({
        path: `/rental/categories/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...mockRentalItems.map((item) => ({
        path: `/rental/items/${item.slug}`,
        lastModified: item.publishedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  },
};
