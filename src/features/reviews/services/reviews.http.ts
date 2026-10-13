import { httpClient } from "@/services";
import type { PageMeta, RatingSummary } from "@/types";

import type { Review, ReviewCollection, ReviewTarget } from "../types";
import type { ReviewsService } from "./reviews.contract";

/** Live `PublicReviewDto` — flat, no nested `target`/`author`, no `criteria` at all. */
interface LiveReview {
  readonly id: number;
  readonly targetType: string;
  readonly targetId: number;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string;
  readonly authorName: string;
  readonly createdAt: string;
  readonly helpfulCount: number;
  readonly isVerified: boolean;
}

interface LiveReviewCollection {
  readonly items: readonly LiveReview[];
  readonly summary: RatingSummary;
  readonly meta: PageMeta;
}

/** Shared by `list` and `listRecent` — both read the same flat `PublicReviewDto`. */
function toReview(raw: LiveReview): Review {
  return {
    id: String(raw.id),
    // Live is flat (`targetType`+`targetId`); the contract nests it as `target`.
    target: { type: raw.targetType as ReviewTarget["type"], id: String(raw.targetId) },
    // Live has no nested author object, just `authorName` — `id`/`avatarUrl`
    // are left unset since there is nothing live to populate them with.
    author: { displayName: raw.authorName },
    rating: raw.rating as Review["rating"],
    title: raw.title ?? undefined,
    body: raw.body,
    createdAt: raw.createdAt,
    helpfulCount: raw.helpfulCount,
    isVerified: raw.isVerified,
    // No live `criteria` field — per-criterion scoring has no live source.
  };
}

/** Published reviews over `/v1/reviews`. Only approved reviews are ever returned. */
export const httpReviewsService: ReviewsService = {
  list: (query) =>
    httpClient
      .get<LiveReviewCollection>("/v1/reviews", {
        query: {
          targetType: query.target.type,
          targetId: query.target.id,
          page: query.page,
          pageSize: query.pageSize,
          // Live `GET /reviews` only accepts targetType/targetId/page/pageSize —
          // sorting and rating/verified-status filtering aren't supported
          // server-side today, so `sort`/`minRating`/`verifiedOnly` are dropped.
        },
        revalidate: 120,
      })
      .then(
        (raw): ReviewCollection => ({
          items: raw.items.map(toReview),
          meta: raw.meta,
          summary: raw.summary,
        }),
      ),

  getSummary: (target) =>
    httpClient.get<RatingSummary>("/v1/reviews/summary", {
      query: { targetType: target.type, targetId: target.id },
      revalidate: 120,
    }),

  listRecent: (limit) =>
    httpClient
      .get<LiveReview[]>("/v1/reviews/recent", { query: { limit }, revalidate: 120 })
      .then((raw) => raw.map(toReview)),
};
