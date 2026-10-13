import { resolveService } from "@/services";

import type { ReviewsService } from "./reviews.contract";
import { httpReviewsService } from "./reviews.http";
import { mockReviewsService } from "./reviews.mock";

export const reviewsService = resolveService<ReviewsService>("reviews", {
  mock: mockReviewsService,
  http: httpReviewsService,
});

export type { ReviewsService } from "./reviews.contract";
