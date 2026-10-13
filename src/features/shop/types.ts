import type { SportId } from "@/features/sports";
import type {
  Facet,
  ListQuery,
  Media,
  MediaImage,
  Money,
  MoneyRange,
  NumericRange,
  Paginated,
  Price,
  RatingSummary,
  SeoMeta,
} from "@/types";

export interface Brand {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly logo?: MediaImage;
  /** Live `PublicBrandDto` field; absent from mock fixtures until they add it. */
  readonly productCount?: number;
}

export interface ProductCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  /** `null` for a root category; the tree is built by the consumer, not stored. */
  readonly parentId: string | null;
  readonly image?: MediaImage;
  readonly sportIds: readonly SportId[];
  readonly seo?: SeoMeta;
}

/**
 * Stock availability is a coarse *signal*, never a count. Exact inventory is the
 * backend's business: a public frontend that renders live stock numbers is both
 * a data leak and permanently stale.
 */
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "pre-order";

/**
 * The axes a product varies on, e.g. `{ key: "Size", name: "Size", values: ["M", "L"] }`.
 *
 * `key` and `name` are BOTH here and they are not redundant. `name` is what the
 * shopper reads and is translated; `key` is the untranslated identifier that
 * `ProductVariant.selections` is keyed by. Without `key` a variant cannot be
 * matched to an option at all on the Arabic site — the option came back as
 * "المقاس" and every variant was still filed under "Size" — so a size
 * picker silently resolved to nothing in one of the two languages.
 */
export interface ProductOption {
  readonly key: string;
  readonly name: string;
  /** Keys, as `ProductVariant.selections` holds them — never shown translated. */
  readonly values: readonly string[];
  /** What to PRINT for a value in the requested locale, where it differs from the key ("Black" → "أسود"). */
  readonly valueLabels?: Readonly<Record<string, string>>;
}

export interface ProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly title: string;
  /** Option name → selected value, matching `Product.options`. */
  readonly selections: Readonly<Record<string, string>>;
  readonly price: Price;
  readonly stockStatus: StockStatus;
  readonly image?: MediaImage;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly brandId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  readonly media: readonly Media[];
  readonly options: readonly ProductOption[];
  readonly variants: readonly ProductVariant[];
  readonly defaultVariantId: string;
  /** Precomputed by the source so listings never load every variant. */
  readonly priceRange: MoneyRange;
  readonly rating: RatingSummary;
  /** Display labels in the requested locale; not used for filtering. */
  readonly tags: readonly string[];
  readonly publishedAt: string;
  readonly seo?: SeoMeta;
}

export interface ProductListQuery extends ListQuery {
  readonly categorySlugs?: readonly string[];
  readonly brandSlugs?: readonly string[];
  readonly sportSlugs?: readonly string[];
  /** Bounds in minor currency units, matching `Money.amount`. */
  readonly price?: NumericRange;
  readonly minRating?: number;
  readonly stockStatuses?: readonly StockStatus[];
}

export interface ProductListResult extends Paginated<Product> {
  /**
   * Optional: the live `GET /products` response has no `facets` field at all
   * (the mock's client-built category/brand/sport/price facets have nothing
   * server-side to bind to). A filter UI built on this should degrade to
   * showing nothing, or compute its own facets client-side from the current
   * page, rather than assume this is ever populated over HTTP.
   */
  readonly facets?: readonly Facet[];
}

export const PRODUCT_SORT_KEYS = [
  "relevance",
  "newest",
  "price-asc",
  "price-desc",
  "rating-desc",
] as const;

export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number];

/** What the cart needs to add a line without re-fetching the product. */
export interface ProductVariantSelection {
  readonly product: Pick<Product, "id" | "slug" | "title">;
  readonly variant: Pick<ProductVariant, "id" | "title" | "stockStatus">;
  readonly unitPrice: Money;
  readonly image?: MediaImage;
}
