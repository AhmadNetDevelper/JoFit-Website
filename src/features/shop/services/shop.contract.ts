import type { Locale } from "@/i18n";
import type { SitemapEntry } from "@/types";

import type {
  Brand,
  Product,
  ProductCategory,
  ProductListQuery,
  ProductListResult,
} from "../types";

/**
 * Every read that returns text takes a locale. `listSitemapEntries` does not:
 * it returns locale-free paths that `app/sitemap.ts` expands across languages.
 */
export interface ShopService {
  listProducts(query: ProductListQuery): Promise<ProductListResult>;
  getProductBySlug(slug: string, locale: Locale): Promise<Product | null>;
  listRelatedProducts(
    productId: string,
    locale: Locale,
    limit?: number,
  ): Promise<readonly Product[]>;
  listCategories(locale: Locale): Promise<readonly ProductCategory[]>;
  getCategoryBySlug(slug: string, locale: Locale): Promise<ProductCategory | null>;
  listBrands(locale: Locale): Promise<readonly Brand[]>;
  getBrandBySlug(slug: string, locale: Locale): Promise<Brand | null>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;
}
