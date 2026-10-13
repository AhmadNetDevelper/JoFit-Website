import type { ReviewableType } from "./types";

export interface ReviewCriterion {
  readonly key: string;
  readonly label: string;
}

export interface ReviewableConfig {
  readonly label: string;
  /** Whether a purchase/booking can back the review with a verified badge. */
  readonly supportsVerifiedPurchase: boolean;
  readonly criteria: readonly ReviewCriterion[];
}

/**
 * The capability table that keeps reviews reusable without being generic to the
 * point of meaninglessness. Adding a new reviewable entity is one entry here
 * plus a `ReviewableType` member — no change to storage, query or rendering
 * logic.
 */
export const reviewableConfig: Readonly<Record<ReviewableType, ReviewableConfig>> = {
  product: {
    label: "Product",
    supportsVerifiedPurchase: true,
    criteria: [
      { key: "quality", label: "Quality" },
      { key: "value", label: "Value for money" },
    ],
  },
  "rental-item": {
    label: "Rental item",
    supportsVerifiedPurchase: true,
    criteria: [
      { key: "condition", label: "Condition" },
      { key: "handover", label: "Collection & return" },
    ],
  },
  coach: {
    label: "Coach",
    supportsVerifiedPurchase: false,
    criteria: [
      { key: "communication", label: "Communication" },
      { key: "knowledge", label: "Knowledge" },
      { key: "punctuality", label: "Punctuality" },
    ],
  },
  course: {
    label: "Course",
    supportsVerifiedPurchase: false,
    criteria: [
      { key: "content", label: "Content" },
      { key: "instructor", label: "Instructor" },
    ],
  },
};

export function getReviewableConfig(type: ReviewableType): ReviewableConfig {
  return reviewableConfig[type];
}
