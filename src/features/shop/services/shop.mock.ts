import { resolveText, type Locale } from "@/i18n";
import { paginate } from "@/lib";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { countFacet, inRange, matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import {
  localizeLabel,
  mockBrands,
  mockProductCategories,
  mockProducts,
  type RawBrand,
  type RawProduct,
  type RawProductCategory,
  tagLabel,
} from "@/mocks/shop";
import { mockSports } from "@/mocks/sports";
import type { Facet, FacetOption, SitemapEntry } from "@/types";

import type { Brand, Product, ProductCategory, ProductListQuery, ProductSortKey } from "../types";
import type { ShopService } from "./shop.contract";

/**
 * Source → domain mapping, resolving localized text for the requested language.
 *
 * This step is not mock scaffolding: the HTTP adapter will do the same with a
 * wire format. Keeping it in the adapter is what lets `Product` stay a clean,
 * single-language domain model.
 */
function toProduct(fixture: RawProduct, locale: Locale): Product {
  /* Staff's latest pictures over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("product", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    title: resolveText(raw.title, locale),
    summary: resolveText(raw.summary, locale),
    description: resolveText(raw.description, locale),
    brandId: raw.brandId,
    categoryIds: raw.categoryIds,
    sportIds: raw.sportIds,
    media: raw.media,
    options: raw.options.map((option) => ({
      key: option.key,
      name: resolveText(option.name, locale),
      values: option.values,
      valueLabels: Object.fromEntries(option.values.map((value) => [value, localizeLabel(value, locale)])),
    })),
    variants: raw.variants.map((variant) => ({ ...variant, title: localizeLabel(variant.title, locale) })),
    defaultVariantId: raw.defaultVariantId,
    priceRange: raw.priceRange,
    rating: raw.rating,
    tags: raw.tags.map((tag) => tagLabel(tag, locale)),
    publishedAt: raw.publishedAt,
  };
}

function toCategory(fixture: RawProductCategory, locale: Locale): ProductCategory {
  const raw = withCatalogueImages("product-category", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    description: raw.description ? resolveText(raw.description, locale) : undefined,
    parentId: raw.parentId,
    image: raw.image,
    sportIds: raw.sportIds,
  };
}

function toBrand(fixture: RawBrand, locale: Locale): Brand {
  const raw = withCatalogueImages("brand", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ? resolveText(raw.description, locale) : undefined,
    logo: raw.logo,
  };
}

function slugsToIds<TEntity extends { id: string; slug: string }>(
  entities: readonly TEntity[],
  slugs: readonly string[] | undefined,
): string[] | undefined {
  if (!slugs || slugs.length === 0) return undefined;
  return entities.filter((entity) => slugs.includes(entity.slug)).map((entity) => entity.id);
}

function applyFilters(query: ProductListQuery): Product[] {
  const categoryIds = slugsToIds(mockProductCategories, query.categorySlugs);
  const brandIds = slugsToIds(mockBrands, query.brandSlugs);
  const sportIds = slugsToIds(mockSports, query.sportSlugs);

  return mockProducts
    .map((raw) => toProduct(raw, query.locale))
    .filter((product) => {
      // Search runs against the resolved language, which is what a
      // language-aware search index would do.
      if (!matchesText([product.title, product.summary, product.description], query.search)) {
        return false;
      }
      if (!matchesAny([...product.categoryIds], categoryIds)) return false;
      if (brandIds && !brandIds.includes(product.brandId)) return false;
      if (!matchesAny([...product.sportIds], sportIds)) return false;
      if (!inRange(product.priceRange.min.amount, query.price)) return false;
      if (query.minRating !== undefined && product.rating.average < query.minRating) return false;
      if (
        query.stockStatuses?.length &&
        !product.variants.some((variant) => query.stockStatuses?.includes(variant.stockStatus))
      ) {
        return false;
      }
      return true;
    });
}

function applySort(products: readonly Product[], sort?: string): Product[] {
  switch (sort as ProductSortKey | undefined) {
    case "price-asc":
      return sortBy(products, (a, b) => a.priceRange.min.amount - b.priceRange.min.amount);
    case "price-desc":
      return sortBy(products, (a, b) => b.priceRange.max.amount - a.priceRange.max.amount);
    case "rating-desc":
      return sortBy(products, (a, b) => b.rating.average - a.rating.average);
    case "newest":
      return sortBy(products, (a, b) => b.publishedAt.localeCompare(a.publishedAt));
    default:
      return [...products];
  }
}

function toOptions(
  entities: readonly { id: string; slug: string; name: string }[],
  counts: Map<string, number>,
): FacetOption[] {
  return entities
    .filter((entity) => counts.has(entity.id))
    .map((entity) => ({
      value: entity.slug,
      label: entity.name,
      count: counts.get(entity.id) ?? 0,
    }));
}

/**
 * Facets are derived from the *unpaginated* matching set, which is how a real
 * search backend behaves, and their labels are localized — filter UI is driven
 * by data, in the reader's language.
 */
function buildFacets(products: readonly Product[], locale: Locale): Facet[] {
  const prices = products.map((product) => product.priceRange.min.amount);
  const categories = mockProductCategories.map((raw) => toCategory(raw, locale));
  const brands = mockBrands.map((raw) => toBrand(raw, locale));
  const sports = mockSports.map((raw) => ({
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
  }));

  return [
    {
      key: "category",
      label: "category",
      kind: "multi",
      options: toOptions(categories, countFacet(products, (p) => p.categoryIds)),
    },
    {
      key: "brand",
      label: "brand",
      kind: "multi",
      options: toOptions(brands, countFacet(products, (p) => [p.brandId])),
    },
    {
      key: "sport",
      label: "sport",
      kind: "multi",
      options: toOptions(sports, countFacet(products, (p) => p.sportIds)),
    },
    {
      key: "price",
      label: "price",
      kind: "range",
      options: [],
      range: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : undefined,
    },
  ];
}

export const mockShopService: ShopService = {
  async listProducts(query) {
    await simulateLatency();
    const filtered = applyFilters(query);
    const sorted = applySort(filtered, query.sort);
    return { ...paginate(sorted, query), facets: buildFacets(filtered, query.locale) };
  },

  async getProductBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockProducts.find((product) => product.slug === slug);
    return raw ? toProduct(raw, locale) : null;
  },

  async listRelatedProducts(productId, locale, limit = 4) {
    await simulateLatency();
    const source = mockProducts.find((product) => product.id === productId);
    if (!source) return [];
    return mockProducts
      .filter(
        (product) =>
          product.id !== productId &&
          product.sportIds.some((sportId) => source.sportIds.includes(sportId)),
      )
      .slice(0, limit)
      .map((raw) => toProduct(raw, locale));
  },

  async listCategories(locale) {
    await simulateLatency();
    return mockProductCategories.map((raw) => toCategory(raw, locale));
  },

  async getCategoryBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockProductCategories.find((category) => category.slug === slug);
    return raw ? toCategory(raw, locale) : null;
  },

  async listBrands(locale) {
    await simulateLatency();
    return mockBrands.map((raw) => toBrand(raw, locale));
  },

  async getBrandBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockBrands.find((brand) => brand.slug === slug);
    return raw ? toBrand(raw, locale) : null;
  },

  async listSitemapEntries(): Promise<readonly SitemapEntry[]> {
    await simulateLatency();
    // Locale-free: `app/sitemap.ts` expands each path across every locale.
    return [
      { path: "/shop", changeFrequency: "daily", priority: 0.9 },
      ...mockProductCategories.map((category) => ({
        path: `/shop/categories/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...mockProducts.map((product) => ({
        path: `/shop/products/${product.slug}`,
        lastModified: product.publishedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  },
};
