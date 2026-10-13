import type { Locale } from "@/i18n";
import { readNumberParam, readParam, readParams, type RawSearchParams } from "@/lib";

import { PRODUCT_SORT_KEYS, type ProductListQuery, type ProductSortKey } from "../types";

function readSort(params: RawSearchParams): ProductSortKey | undefined {
  const raw = readParam(params, "sort");
  return PRODUCT_SORT_KEYS.find((key) => key === raw);
}

/**
 * URL is the source of truth for catalogue state: filters and sorting survive
 * refreshes, are shareable and stay server-renderable. No client store holds
 * them.
 */
export function parseProductListQuery(
  params: RawSearchParams,
  locale: Locale,
): ProductListQuery {
  const min = readNumberParam(params, "priceMin");
  const max = readNumberParam(params, "priceMax");

  return {
    locale,
    page: readNumberParam(params, "page"),
    pageSize: readNumberParam(params, "pageSize"),
    search: readParam(params, "q"),
    sort: readSort(params),
    categorySlugs: readParams(params, "category"),
    brandSlugs: readParams(params, "brand"),
    sportSlugs: readParams(params, "sport"),
    minRating: readNumberParam(params, "rating"),
    price: min === undefined && max === undefined ? undefined : { min, max },
  };
}
