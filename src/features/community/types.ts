import type { SportId } from "@/features/sports";
import type { ListQuery, Paginated, PublishStatus } from "@/types";

/**
 * Feature boundary only. The read model below is enough to render a community
 * section; writing, moderation, reputation, notifications and feeds are NOT
 * built and are gated behind `featureFlags.community`.
 *
 * OPEN BUSINESS DECISIONS: who may post, how content is moderated, whether
 * posts are indexable, and whether community identity is the same account as
 * the commerce customer.
 */
export type CommunityPostKind = "discussion" | "question" | "announcement";

export interface CommunityTopic {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
}

export interface CommunityMember {
  /** Optional: the live API's post/comment author is just a name string, no member id. */
  readonly id?: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export interface CommunityPost {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string;
  readonly kind: CommunityPostKind;
  readonly topicIds: readonly string[];
  readonly sportIds: readonly SportId[];
  readonly author: CommunityMember;
  readonly createdAt: string;
  readonly commentCount: number;
  readonly likeCount: number;
  readonly status: PublishStatus;
}

export interface CommunityComment {
  readonly id: string;
  readonly postId: string;
  readonly parentId: string | null;
  readonly author: CommunityMember;
  readonly body: string;
  readonly createdAt: string;
  readonly likeCount: number;
}

export interface CommunityPostListQuery extends ListQuery {
  readonly topicSlugs?: readonly string[];
  readonly sportSlugs?: readonly string[];
  readonly kinds?: readonly CommunityPostKind[];
}

export type CommunityPostListResult = Paginated<CommunityPost>;
