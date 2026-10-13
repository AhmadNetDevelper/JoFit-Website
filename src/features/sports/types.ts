import type { MediaImage, SeoMeta } from "@/types";

/**
 * Sports are a cross-cutting taxonomy, not a domain of their own: shop products,
 * rental items, coaches, courses, articles and community posts all reference
 * sports by id. Nothing in the codebase hardcodes the list — it arrives from the
 * data layer exactly like any other collection.
 *
 * `name` and `description` are plain strings because the service has already
 * resolved them for the requested language. The storefront never handles more
 * than one language at a time.
 */
export type SportId = string;

export interface Sport {
  readonly id: SportId;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  /** Icon key resolved by the design system once it exists. */
  readonly iconKey?: string;
  readonly image?: MediaImage;
  readonly isFeatured: boolean;
  readonly seo?: SeoMeta;
}

export interface SportListQuery {
  readonly locale: import("@/i18n/locales").Locale;
  readonly featuredOnly?: boolean;
  readonly search?: string;
}
