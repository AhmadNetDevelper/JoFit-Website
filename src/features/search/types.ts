import type { Coach } from "@/features/coaches";
import type { Article } from "@/features/content";
import type { Course } from "@/features/education";
import type { RentalItem } from "@/features/rental";
import type { Product } from "@/features/shop";

/**
 * Search is a *composition* feature: it owns no entities. It queries each domain
 * through that domain's public service and returns typed hits, which keeps the
 * result union honest — a search result is a real `Product` or a real `Coach`,
 * not a lossy "SearchDocument" that the UI has to re-hydrate.
 *
 * No search engine is implemented. When one arrives, `SearchService` gains an
 * adapter that talks to it and this fan-out is deleted; the result shape is
 * unchanged.
 */
export const SEARCH_SCOPES = ["all", "products", "rentals", "coaches", "courses", "articles"] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

export type SearchHit =
  | { readonly kind: "product"; readonly item: Product; readonly href: string }
  | { readonly kind: "rental"; readonly item: RentalItem; readonly href: string }
  | { readonly kind: "coach"; readonly item: Coach; readonly href: string }
  | { readonly kind: "course"; readonly item: Course; readonly href: string }
  | { readonly kind: "article"; readonly item: Article; readonly href: string };

export type SearchHitKind = SearchHit["kind"];

/**
 * A group carries its `kind`, not a label: the label is UI copy and belongs in
 * the dictionary, where both languages live. A service returning English group
 * names would be untranslatable.
 */
export interface SearchGroup {
  readonly kind: SearchHitKind;
  readonly total: number;
  readonly hits: readonly SearchHit[];
}

export interface SearchQuery {
  readonly term: string;
  readonly locale: import("@/i18n").Locale;
  readonly scope?: SearchScope;
  readonly limitPerGroup?: number;
}

export interface SearchResults {
  readonly term: string;
  readonly scope: SearchScope;
  readonly total: number;
  readonly groups: readonly SearchGroup[];
}
