import type { ListQuery, Paginated, RatingSummary } from "@/types";

/**
 * Reviews are a *supporting* domain: shop, rental, coaches and education all
 * reference it, and it references none of them. That direction is what keeps the
 * dependency graph acyclic.
 *
 * It is deliberately not one flat generic system. A review is addressed to a
 * typed target, and each target type declares its own capabilities (see
 * `reviewable.ts`) — a coach review has no "verified purchase" and rates
 * different criteria than a football does.
 *
 * LOCALIZATION: review text is written by customers and is NOT translated. It is
 * rendered as submitted, with `dir="auto"` so an Arabic review and an English one
 * read correctly in the same list. `ReviewListQuery` still carries a locale
 * because a real API takes one on every request.
 */
export type ReviewableType = "product" | "rental-item" | "coach" | "course";

export interface ReviewTarget {
  readonly type: ReviewableType;
  readonly id: string;
}

export interface ReviewAuthor {
  /** Live `PublicReviewDto` has no nested author object, just `authorName` — there's no id or avatar to populate these with. */
  readonly id?: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export type ReviewScore = 1 | 2 | 3 | 4 | 5;

export interface Review {
  readonly id: string;
  readonly target: ReviewTarget;
  readonly author: ReviewAuthor;
  readonly rating: ReviewScore;
  /** Per-criterion scores, keyed by the criterion keys the target type declares. */
  readonly criteria?: Readonly<Record<string, ReviewScore>>;
  readonly title?: string;
  readonly body: string;
  readonly createdAt: string;
  /** Only meaningful for target types that declare `supportsVerifiedPurchase`. */
  readonly isVerified?: boolean;
  readonly helpfulCount: number;
}

export interface ReviewListQuery extends ListQuery {
  readonly target: ReviewTarget;
  readonly minRating?: number;
  readonly verifiedOnly?: boolean;
}

export interface ReviewCollection extends Paginated<Review> {
  readonly summary: RatingSummary;
}

/**
 * Submission payload. Moderation, eligibility and edit windows are OPEN BUSINESS
 * DECISIONS — the contract exists, the policy does not.
 */
export interface ReviewDraft {
  readonly target: ReviewTarget;
  readonly rating: ReviewScore;
  readonly criteria?: Readonly<Record<string, ReviewScore>>;
  readonly title?: string;
  readonly body: string;
}
