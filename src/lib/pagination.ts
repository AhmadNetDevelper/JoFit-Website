import type { PageMeta, PageRequest, Paginated } from "@/types";

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 60;

export function resolvePageRequest(query: {
  page?: number;
  pageSize?: number;
}): PageRequest {
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const requested = Math.trunc(query.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, pageSize };
}

export function createPageMeta(request: PageRequest, totalItems: number): PageMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / request.pageSize));
  return {
    ...request,
    totalItems,
    totalPages,
    hasNextPage: request.page < totalPages,
    hasPreviousPage: request.page > 1,
  };
}

/** In-memory slicing used by the mock adapters; the API will do this server-side. */
export function paginate<TItem>(
  items: readonly TItem[],
  query: { page?: number; pageSize?: number },
): Paginated<TItem> {
  const request = resolvePageRequest(query);
  const start = (request.page - 1) * request.pageSize;
  return {
    items: items.slice(start, start + request.pageSize),
    meta: createPageMeta(request, items.length),
  };
}
