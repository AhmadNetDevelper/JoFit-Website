import { cacheTags, fetchSitemapEntries, httpClient, orNull } from "@/services";
import { listParams } from "@/services/http/query";
import type { CurrencyCode, MediaImage, Money, PageMeta, SitemapEntry } from "@/types";

import type {
  Brand,
  Product,
  ProductCategory,
  ProductListResult,
  ProductVariant,
  StockStatus,
} from "../types";
import type { ShopService } from "./shop.contract";

const enc = encodeURIComponent;

/*
 * Wire shapes, straight off `docs/api-live/website.json` (Products,
 * ProductCategories, Brands tags). Kept local and minimal — only the fields
 * this adapter actually reads — rather than re-exporting a parallel copy of
 * the OpenAPI schemas.
 */

interface MoneyDtoWire {
  readonly amount: number;
  readonly currency?: string;
}

interface MediaImageDtoWire {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

/** `RefDto`/`RefDto2` — the live spec marks `RefDto` nullable even though the
 *  fields that use it (e.g. `brand`) are themselves required. */
interface RefDtoWire {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

interface PublicVariantDtoWire {
  readonly id: number;
  readonly sku: string;
  readonly title: string;
  readonly price: MoneyDtoWire;
  readonly stockStatus: string;
}

interface PublicProductDtoWire {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description?: string | null;
  readonly brand?: RefDtoWire | null;
  readonly categories: readonly RefDtoWire[];
  /** Spec has `items: {}` here — unresolved/untyped, no documented shape. */
  readonly sports?: readonly unknown[];
  readonly variants: readonly PublicVariantDtoWire[];
  readonly price: MoneyDtoWire;
  readonly media: readonly MediaImageDtoWire[];
  readonly publishedAt?: string | null;
}

interface PageMetaWire {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

interface PagedResultOfPublicProductDtoWire {
  readonly items: readonly PublicProductDtoWire[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  /** Present on some responses, absent on others — build it when it's not. */
  readonly meta?: PageMetaWire;
}

interface PublicProductCategoryDtoWire {
  readonly id: number;
  readonly slug?: string | null;
  readonly name: string;
  readonly description?: string | null;
  readonly image?: MediaImageDtoWire | null;
  readonly parentId?: number | null;
}

interface PublicBrandDtoWire {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly logo?: MediaImageDtoWire | null;
  readonly productCount?: number;
}

function toMoney(dto: MoneyDtoWire): Money {
  return { amount: dto.amount, currency: (dto.currency ?? "JOD") as CurrencyCode };
}

function toMediaImage(dto: MediaImageDtoWire | null | undefined): MediaImage | undefined {
  if (!dto) return undefined;
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

const KNOWN_STOCK_STATUSES: readonly StockStatus[] = ["in-stock", "low-stock", "out-of-stock", "pre-order"];

/**
 * Live `stockStatus` is typed as a bare `string` with no enum documented.
 * An unrecognised value degrades to "out-of-stock" — the safe direction to
 * guess wrong in, since the alternative is claiming something is buyable off
 * data we don't actually understand.
 */
function toStockStatus(value: string): StockStatus {
  return (KNOWN_STOCK_STATUSES as readonly string[]).includes(value) ? (value as StockStatus) : "out-of-stock";
}

function toVariant(dto: PublicVariantDtoWire): ProductVariant {
  return {
    id: String(dto.id),
    sku: dto.sku,
    title: dto.title,
    // No option data at all live (see `toProduct`), so there is nothing to
    // key a selections map off.
    selections: {},
    // `MoneyDto` carries no discount/compare-at figure — `compareAt` stays
    // unset rather than invented.
    price: { current: toMoney(dto.price) },
    stockStatus: toStockStatus(dto.stockStatus),
  };
}

function toProduct(dto: PublicProductDtoWire): Product {
  const variants = dto.variants.map(toVariant);
  const price = toMoney(dto.price);
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary,
    description: dto.description ?? "",
    // `brand` is nullable per the live `RefDto` schema despite being required
    // on the product itself; a product with none has no id worth reporting.
    brandId: dto.brand ? String(dto.brand.id) : "",
    categoryIds: dto.categories.map((category) => String(category.id)),
    // Live `sports` is an unresolved `items: {}` array — no documented shape
    // to read an id from, so left empty rather than guessed at.
    sportIds: [],
    media: dto.media
      .map((image) => toMediaImage(image))
      .filter((image): image is MediaImage => image !== undefined),
    // No variant-axis data (`options`) anywhere in the live product.
    options: [],
    variants,
    // No `defaultVariantId` field live; default to the first variant — the
    // same fallback every current consumer already applies on top of this.
    defaultVariantId: variants[0]?.id ?? "",
    // Only a single `price: MoneyDto`, not a min/max range. A true range
    // would need summing every variant, which the live single-product
    // response doesn't give us either, so this stays degenerate (min = max).
    priceRange: { min: price, max: price },
    // No rating data live; {0, 0} renders the same "no reviews yet" state
    // the UI already shows for a genuinely unrated product — not a fabricated
    // score.
    rating: { average: 0, count: 0 },
    tags: [],
    publishedAt: dto.publishedAt ?? "",
  };
}

function toCategory(dto: PublicProductCategoryDtoWire): ProductCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
    parentId: dto.parentId === null || dto.parentId === undefined ? null : String(dto.parentId),
    image: toMediaImage(dto.image),
    // No `sportIds` on the live product-category DTO at all.
    sportIds: [],
  };
}

function toBrand(dto: PublicBrandDtoWire): Brand {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    // No `description` field live either — stays unset, same as the mock.
    logo: toMediaImage(dto.logo),
    productCount: dto.productCount,
  };
}

function toPageMeta(dto: PagedResultOfPublicProductDtoWire): PageMeta {
  if (dto.meta) return dto.meta;
  const totalPages = dto.totalPages ?? Math.ceil(dto.totalCount / Math.max(dto.pageSize, 1));
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalCount,
    totalPages,
    hasNextPage: dto.hasNextPage ?? dto.page < totalPages,
    hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
  };
}

/** The shop catalogue over `/v1/products`, `/v1/product-categories`, `/v1/brands`. */
export const httpShopService: ShopService = {
  listProducts: (query) =>
    httpClient
      .get<PagedResultOfPublicProductDtoWire>("/v1/products", {
        query: {
          ...listParams(query),
          categorySlugs: query.categorySlugs,
          brandSlugs: query.brandSlugs,
          sportSlugs: query.sportSlugs,
          stockStatuses: query.stockStatuses,
          /*
           * `price.min/max` and `minRating` are deliberately NOT sent: live
           * `GET /products` only accepts Page, PageSize, Search,
           * CategorySlugs, BrandSlugs, SportSlugs, StockStatuses, Sort and
           * language — there is no backing parameter for either filter, so
           * sending them would just be silently ignored server-side.
           */
        },
        revalidate: 60,
        tags: [cacheTags.products],
      })
      .then(
        (dto): ProductListResult => ({
          items: dto.items.map(toProduct),
          meta: toPageMeta(dto),
          // No `facets` field anywhere in the live response — see the
          // `ProductListResult.facets` doc comment.
          facets: [],
        }),
      ),

  getProductBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<PublicProductDtoWire>(`/v1/products/${enc(slug)}`, {
          query: { language: locale },
          revalidate: 60,
          tags: [cacheTags.products],
        })
        .then(toProduct),
    ),

  listRelatedProducts: (productId, locale, limit) =>
    httpClient
      .get<readonly PublicProductDtoWire[]>(`/v1/products/${enc(productId)}/related`, {
        query: { language: locale, limit },
        revalidate: 300,
        tags: [cacheTags.products],
      })
      .then((items) => items.map(toProduct)),

  listCategories: (locale) =>
    httpClient
      .get<readonly PublicProductCategoryDtoWire[]>("/v1/product-categories", {
        query: { language: locale },
        revalidate: 300,
      })
      .then((items) => items.map(toCategory)),

  getCategoryBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<PublicProductCategoryDtoWire>(`/v1/product-categories/${enc(slug)}`, {
          query: { language: locale },
          revalidate: 300,
        })
        .then(toCategory),
    ),

  listBrands: (locale) =>
    httpClient
      .get<readonly PublicBrandDtoWire[]>("/v1/brands", { query: { language: locale }, revalidate: 300 })
      .then((items) => items.map(toBrand)),

  getBrandBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<PublicBrandDtoWire>(`/v1/brands/${enc(slug)}`, { query: { language: locale }, revalidate: 300 })
        .then(toBrand),
    ),

  listSitemapEntries: async () => {
    // Slugs are language-neutral; the locale only picks which name comes back.
    const [categories, products] = await Promise.all([
      httpShopService.listCategories("ar"),
      fetchSitemapEntries("shop", (slug) => `/shop/products/${slug}`, { changeFrequency: "weekly", priority: 0.6 }),
    ]);
    return [
      { path: "/shop", changeFrequency: "daily", priority: 0.9 },
      ...categories.map(
        (category): SitemapEntry => ({ path: `/shop/categories/${category.slug}`, changeFrequency: "weekly", priority: 0.7 }),
      ),
      ...products,
    ];
  },
};
