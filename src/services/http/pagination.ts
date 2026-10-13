import type { Paginated } from "@/types";

/**
 * The live API's paged envelope (`PagedResultOf*Dto`): flat `items` + `page` +
 * `pageSize` + `totalCount` (+ an optional `totalPages`) — not the frontend's
 * `Paginated<T>` contract, which nests `page`/`pageSize`/etc under `meta` and
 * adds `hasNextPage`/`hasPreviousPage`. Every list endpoint on the live API
 * returns this same flat shape, so the reshape lives here once instead of
 * being reinvented per adapter.
 */
export interface LivePagedResult<TRaw> {
  readonly items: readonly TRaw[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
}

/** Maps a live paged envelope's items and reshapes it into `Paginated<TItem>`. */
export function toPaginated<TRaw, TItem>(
  raw: LivePagedResult<TRaw>,
  mapItem: (item: TRaw) => TItem,
): Paginated<TItem> {
  const totalPages = raw.totalPages ?? Math.max(1, Math.ceil(raw.totalCount / Math.max(1, raw.pageSize)));
  return {
    items: raw.items.map(mapItem),
    meta: {
      page: raw.page,
      pageSize: raw.pageSize,
      totalItems: raw.totalCount,
      totalPages,
      hasNextPage: raw.page < totalPages,
      hasPreviousPage: raw.page > 1,
    },
  };
}
