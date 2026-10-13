import type { Locale } from "@/i18n/locales";

export type SortDirection = "asc" | "desc";

/**
 * Sorting is expressed as an opaque string key (`"price-asc"`, `"rating-desc"`)
 * rather than a field/direction pair, because a real API exposes a fixed set of
 * sortable views, not arbitrary column sorting.
 */
export interface SortOption {
  readonly key: string;
  readonly label: string;
  readonly direction: SortDirection;
}

export interface NumericRange {
  readonly min?: number;
  readonly max?: number;
}

export interface DateRange {
  /** ISO-8601 date, `YYYY-MM-DD`. */
  readonly from: string;
  readonly to: string;
}

/** Every domain list query extends this. */
export interface ListQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly sort?: string;
  readonly search?: string;
  /**
   * The language to resolve content in. Required, not optional: an optional
   * locale would silently fall back to English on any call site that forgot it,
   * and a public page in the wrong language is a bug you only notice in
   * production. The compiler catches it instead.
   *
   * It maps to `Accept-Language` or `?locale=` once a real API exists.
   */
  readonly locale: Locale;
}

export type FacetKind = "single" | "multi" | "range" | "toggle";

export interface FacetOption {
  readonly value: string;
  readonly label: string;
  readonly count: number;
}

/**
 * Facets are returned *with* a result set so the filter UI is driven by data
 * rather than by hardcoded option lists. The future Figma decides how a facet
 * renders; the architecture only decides what a facet is.
 */
export interface Facet {
  readonly key: string;
  readonly label: string;
  readonly kind: FacetKind;
  readonly options: readonly FacetOption[];
  readonly range?: NumericRange;
}
