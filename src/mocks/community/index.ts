import type { CommunityComment, CommunityPost } from "@/features/community";
import type { LocalizedText } from "@/i18n";

/**
 * Topics are platform-authored, so they are localized. Posts and comments are
 * written by members and are NOT translated — they are rendered as submitted,
 * with `dir="auto"` so Arabic and English threads sit correctly side by side.
 */
export interface RawCommunityTopic {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
}

export const mockCommunityTopics: readonly RawCommunityTopic[] = [
  {
    id: "topic-training",
    slug: "training",
    name: { en: "Training", ar: "التدريب" },
    description: { en: "Programmes, plans and progress.", ar: "البرامج والخطط والتقدّم." },
  },
  {
    id: "topic-gear",
    slug: "gear",
    name: { en: "Gear", ar: "المعدات" },
    description: { en: "What works and what does not.", ar: "ما ينفع وما لا ينفع." },
  },
];

export const mockCommunityPosts: readonly CommunityPost[] = [
  {
    id: "post-marathon-block",
    slug: "how-do-you-structure-a-marathon-block",
    title: "How do you structure a marathon block?",
    excerpt: "Sixteen weeks, four runs a week — where should the long run sit?",
    body: "I have sixteen weeks and can run four days a week...",
    kind: "question",
    topicIds: ["topic-training"],
    sportIds: ["sport-running"],
    author: { id: "member-1", displayName: "Yousef" },
    createdAt: "2026-09-01",
    commentCount: 2,
    likeCount: 6,
    status: "published",
  },
  {
    id: "post-court-shoes",
    slug: "indoor-court-shoes-that-last",
    title: "Indoor court shoes that last",
    excerpt: "Two seasons in and looking for something more durable.",
    body: "My last two pairs wore through the forefoot by mid-season...",
    kind: "discussion",
    topicIds: ["topic-gear"],
    sportIds: ["sport-basketball"],
    author: { id: "member-2", displayName: "Hala" },
    createdAt: "2026-08-19",
    commentCount: 1,
    likeCount: 3,
    status: "published",
  },
];

export const mockCommunityComments: readonly CommunityComment[] = [
  {
    id: "comment-1",
    postId: "post-marathon-block",
    parentId: null,
    author: { id: "member-3", displayName: "Rami" },
    body: "Long run on Saturday, quality on Tuesday, easy the rest. Keep it boring.",
    createdAt: "2026-09-02",
    likeCount: 4,
  },
  {
    id: "comment-2",
    postId: "post-marathon-block",
    parentId: "comment-1",
    author: { id: "member-1", displayName: "Yousef" },
    body: "That matches what my club coach suggested — thanks.",
    createdAt: "2026-09-02",
    likeCount: 1,
  },
  {
    id: "comment-3",
    postId: "post-court-shoes",
    parentId: null,
    author: { id: "member-4", displayName: "Marwan" },
    body: "Rotate two pairs. Doubles the life of both.",
    createdAt: "2026-08-20",
    likeCount: 2,
  },
];
