import { paginate } from "@/lib";
import { mockReviews } from "@/mocks/reviews";
import { simulateLatency, sortBy } from "@/mocks/runtime";
import type { RatingSummary } from "@/types";

import type { Review, ReviewTarget } from "../types";
import type { ReviewsService } from "./reviews.contract";

function forTarget(target: ReviewTarget): Review[] {
  return mockReviews.filter(
    (review) => review.target.type === target.type && review.target.id === target.id,
  );
}

function summarise(reviews: readonly Review[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Number((total / reviews.length).toFixed(1)),
    count: reviews.length,
    distribution: {
      1: reviews.filter((r) => r.rating === 1).length,
      2: reviews.filter((r) => r.rating === 2).length,
      3: reviews.filter((r) => r.rating === 3).length,
      4: reviews.filter((r) => r.rating === 4).length,
      5: reviews.filter((r) => r.rating === 5).length,
    },
  };
}

export const mockReviewsService: ReviewsService = {
  async list(query) {
    await simulateLatency();
    const all = forTarget(query.target);
    const filtered = all.filter((review) => {
      if (query.minRating !== undefined && review.rating < query.minRating) return false;
      if (query.verifiedOnly && !review.isVerified) return false;
      return true;
    });
    const sorted = sortBy(filtered, (a, b) => b.createdAt.localeCompare(a.createdAt));
    return { ...paginate(sorted, query), summary: summarise(all) };
  },

  async getSummary(target) {
    await simulateLatency();
    return summarise(forTarget(target));
  },

  async listRecent(limit = 5) {
    await simulateLatency();
    return sortBy(mockReviews, (a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
};
