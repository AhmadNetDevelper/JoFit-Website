import type { RatingSummary } from "@/types";

import type { Review, ReviewCollection, ReviewListQuery, ReviewTarget } from "../types";

export interface ReviewsService {
  list(query: ReviewListQuery): Promise<ReviewCollection>;
  getSummary(target: ReviewTarget): Promise<RatingSummary>;
  /** Most recent reviews across targets, for "latest feedback" placements. */
  listRecent(limit?: number): Promise<readonly Review[]>;
}
