import type { DateRange, ListQuery, NumericRange } from "@/types";

/**
 * How list queries travel as URL parameters — the same rules for every
 * endpoint, so the backend can parse them once:
 *
 *   page, pageSize, sort, search, language    plain values
 *   categorySlugs=a&categorySlugs=b            a list repeats its key
 *   price.min=1000&price.max=5000              a range is dotted
 *   availableBetween.from / .to               a date range is dotted
 *
 * `undefined` is dropped, so an absent filter is an absent parameter.
 *
 * The wire parameter is `language` (enum `ar`/`en`, API default `ar`) — not
 * `locale`. The API has no `locale` parameter anywhere; sending the wrong name
 * silently falls back to the API's own default language regardless of what
 * the caller asked for.
 */
export function listParams(query: ListQuery): Record<string, unknown> {
  return {
    language: query.locale,
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
    search: query.search,
  };
}

export function rangeParams(prefix: string, range?: NumericRange): Record<string, unknown> {
  return range ? { [`${prefix}.min`]: range.min, [`${prefix}.max`]: range.max } : {};
}

export function dateRangeParams(prefix: string, range?: DateRange): Record<string, unknown> {
  return range ? { [`${prefix}.from`]: range.from, [`${prefix}.to`]: range.to } : {};
}
