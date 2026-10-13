import { resolveText } from "@/i18n";
import { paginate } from "@/lib";
import { mockCommunityComments, mockCommunityPosts, mockCommunityTopics } from "@/mocks/community";
import { matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";

import type { CommunityPost, CommunityPostListQuery } from "../types";
import type { CommunityService } from "./community.contract";

function applyFilters(query: CommunityPostListQuery): CommunityPost[] {
  const topicIds = query.topicSlugs?.length
    ? mockCommunityTopics.filter((t) => query.topicSlugs?.includes(t.slug)).map((t) => t.id)
    : undefined;
  const sportIds = query.sportSlugs?.length
    ? mockSports.filter((s) => query.sportSlugs?.includes(s.slug)).map((s) => s.id)
    : undefined;

  return mockCommunityPosts.filter((post) => {
    if (post.status !== "published") return false;
    if (!matchesText([post.title, post.excerpt], query.search)) return false;
    if (!matchesAny([...post.topicIds], topicIds)) return false;
    if (!matchesAny([...post.sportIds], sportIds)) return false;
    if (query.kinds?.length && !query.kinds.includes(post.kind)) return false;
    return true;
  });
}

export const mockCommunityService: CommunityService = {
  async listTopics(locale) {
    await simulateLatency();
    return mockCommunityTopics.map((raw) => ({
      id: raw.id,
      slug: raw.slug,
      name: resolveText(raw.name, locale),
      description: raw.description ? resolveText(raw.description, locale) : undefined,
    }));
  },

  async listPosts(query) {
    await simulateLatency();
    const filtered = applyFilters(query);
    return paginate(sortBy(filtered, (a, b) => b.createdAt.localeCompare(a.createdAt)), query);
  },

  async getPostBySlug(slug, _locale) {
    await simulateLatency();
    return mockCommunityPosts.find((post) => post.slug === slug && post.status === "published") ?? null;
  },

  async listComments(postId) {
    await simulateLatency();
    return mockCommunityComments.filter((comment) => comment.postId === postId);
  },
};
