import { resolveService } from "@/services";

import type { SearchService } from "./search.contract";
import { fanoutSearchService } from "./search.fanout";

/**
 * The fan-out is registered for both data sources: it composes whichever
 * adapters the domains themselves resolved, so it keeps working when the
 * catalogue moves to HTTP and is only replaced when a dedicated search backend
 * exists.
 */
export const searchService = resolveService<SearchService>("search", {
  mock: fanoutSearchService,
  http: fanoutSearchService,
});

export type { SearchService } from "./search.contract";
