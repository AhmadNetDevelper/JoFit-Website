import type { LocalizedText } from "@/i18n";
import type { Media, MediaImage, Money, MoneyRange, RatingSummary } from "@/types";
import type { StockStatus } from "@/features/shop";

/**
 * Source shapes. Localized prose is held in every language; identifiers, SKUs,
 * option values and brand names are not translated — a brand is called "Apex" in
 * both languages, and a shoe size is "42" in both.
 */
export interface RawBrand {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: LocalizedText;
  readonly logo?: MediaImage;
}

export interface RawProductCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  readonly parentId: string | null;
  readonly sportIds: readonly string[];
  /** Absent from every fixture; set by staff through the admin (`catalogue-images.ts`). */
  readonly image?: MediaImage;
}

export interface RawProductOption {
  /** Untranslated, and the key `RawProductVariant.selections` uses. */
  readonly key: string;
  readonly name: LocalizedText;
  readonly values: readonly string[];
}

export interface RawProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly title: string;
  readonly selections: Readonly<Record<string, string>>;
  readonly price: { readonly current: Money; readonly compareAt?: Money };
  readonly stockStatus: StockStatus;
  readonly image?: MediaImage;
}

export interface RawProduct {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly brandId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly media: readonly Media[];
  readonly options: readonly RawProductOption[];
  readonly variants: readonly RawProductVariant[];
  readonly defaultVariantId: string;
  readonly priceRange: MoneyRange;
  readonly rating: RatingSummary;
  readonly tags: readonly string[];
  readonly publishedAt: string;
}
