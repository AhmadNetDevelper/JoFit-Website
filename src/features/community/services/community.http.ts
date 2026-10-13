import { httpClient, orNull, toPaginated, type LivePagedResult } from "@/services";
import { listParams } from "@/services/http/query";

import type {
  CommunityComment,
  CommunityPost,
  CommunityPostListResult,
  CommunityTopic,
} from "../types";
import type { CommunityService } from "./community.contract";

const enc = encodeURIComponent;

/** The live `TopicDto2` nested on a post, and `TopicDto` from the topic list — the same `{id, slug, name}`. */
interface LiveTopicRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

/** `CommunityPostDto` — see `docs/api-live/website.json`. */
interface LiveCommunityPost {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string | null;
  readonly topic: LiveTopicRef | null;
  readonly authorName: string;
  readonly createdAt: string;
  readonly likeCount: number;
  readonly commentCount: number;
}

/** `CommunityCommentDto` — see `docs/api-live/website.json`. */
interface LiveCommunityComment {
  readonly id: number;
  readonly postId: number;
  readonly parentCommentId: number | null;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
}

function toCommunityPost(dto: LiveCommunityPost): CommunityPost {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    body: dto.body ?? "",
    // Live CommunityPostDto has no `kind` field at all; default until the API adds one.
    kind: "discussion",
    // Live has one `topic` object, not a plural `topicIds` array.
    topicIds: dto.topic ? [String(dto.topic.id)] : [],
    // Live CommunityPostDto has no sportIds field at all.
    sportIds: [],
    // Live only gives `authorName`; no member id or avatar is returned.
    author: { displayName: dto.authorName },
    createdAt: dto.createdAt,
    commentCount: dto.commentCount,
    likeCount: dto.likeCount,
    // GetCommunityPost/GetCommunityPosts only ever return published posts
    // ("a hidden post is not found" per the live spec's own summary).
    status: "published",
  };
}

function toCommunityComment(dto: LiveCommunityComment): CommunityComment {
  return {
    id: String(dto.id),
    postId: String(dto.postId),
    // Live names it `parentCommentId`; the domain type calls it `parentId`.
    parentId: dto.parentCommentId === null ? null : String(dto.parentCommentId),
    author: { displayName: dto.authorName },
    body: dto.body,
    createdAt: dto.createdAt,
    // Live CommunityCommentDto has no likeCount field at all; default to zero.
    likeCount: 0,
  };
}

/** The community read model over `/v1/community/*`. */
export const httpCommunityService: CommunityService = {
  listTopics: (locale) =>
    httpClient
      .get<LiveTopicRef[]>("/v1/community/topics", { query: { language: locale }, revalidate: 300 })
      // `TopicDto` has no `description`; the int64 id is stringified so it
      // compares equal to a post's `topicIds`.
      .then((topics) => topics.map((topic): CommunityTopic => ({ id: String(topic.id), slug: topic.slug, name: topic.name }))),

  listPosts: (query) =>
    httpClient
      .get<LivePagedResult<LiveCommunityPost>>("/v1/community/posts", {
        query: {
          ...listParams(query),
          topicSlugs: query.topicSlugs,
          // `sportSlugs` and `kinds` aren't accepted by the live endpoint (only
          // Page/PageSize/Search/TopicSlugs/language) — unsupported server-side,
          // so filtering on them is client-side only until the API adds them.
        },
        revalidate: 30,
      })
      .then((raw): CommunityPostListResult => toPaginated(raw, toCommunityPost)),

  getPostBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveCommunityPost>(`/v1/community/posts/${enc(slug)}`, {
          // Previously sent no locale/language param at all, silently stuck on
          // the API's Arabic default.
          query: { language: locale },
          revalidate: 30,
        })
        .then(toCommunityPost),
    ),

  listComments: (postId) =>
    httpClient
      .get<LiveCommunityComment[]>(`/v1/community/posts/${enc(postId)}/comments`, { revalidate: 30 })
      .then((comments) => comments.map(toCommunityComment)),
};
