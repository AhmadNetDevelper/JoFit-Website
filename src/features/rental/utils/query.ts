import type { Locale } from "@/i18n";
import { readNumberParam, readParam, readParams, type RawSearchParams } from "@/lib";

import { RENTAL_SORT_KEYS, type RentalListQuery, type RentalSortKey } from "../types";

function readSort(params: RawSearchParams): RentalSortKey | undefined {
  const raw = readParam(params, "sort");
  return RENTAL_SORT_KEYS.find((key) => key === raw);
}

export function parseRentalListQuery(
  params: RawSearchParams,
  locale: Locale,
): RentalListQuery {
  const from = readParam(params, "from");
  const to = readParam(params, "to");
  const min = readNumberParam(params, "priceMin");
  const max = readNumberParam(params, "priceMax");

  return {
    locale,
    page: readNumberParam(params, "page"),
    pageSize: readNumberParam(params, "pageSize"),
    search: readParam(params, "q"),
    sort: readSort(params),
    categorySlugs: readParams(params, "category"),
    sportSlugs: readParams(params, "sport"),
    locationIds: readParams(params, "location"),
    minRating: readNumberParam(params, "rating"),
    price: min === undefined && max === undefined ? undefined : { min, max },
    availableBetween: from && to ? { from, to } : undefined,
  };
}
