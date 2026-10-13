import type { Locale } from "@/i18n";

import type {
  CommunityComment,
  CommunityPost,
  CommunityPostListQuery,
  CommunityPostListResult,
  CommunityTopic,
} from "../types";

export interface CommunityService {
  listTopics(locale: Locale): Promise<readonly CommunityTopic[]>;
  listPosts(query: CommunityPostListQuery): Promise<CommunityPostListResult>;
  getPostBySlug(slug: string, locale: Locale): Promise<CommunityPost | null>;
  listComments(postId: string): Promise<readonly CommunityComment[]>;
}
