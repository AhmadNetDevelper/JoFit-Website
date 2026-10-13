import { fetchSitemapEntries, httpClient, orNull, toPaginated, type LivePagedResult } from "@/services";
import { listParams } from "@/services/http/query";
import type { MediaImage, SitemapEntry } from "@/types";

import type { Article, ArticleCategory, ArticleListResult, ArticleTag, Author } from "../types";
import type { ContentService } from "./content.contract";

const enc = encodeURIComponent;

/** `MediaImageDto`/`MediaImageDto2` — see `docs/api-live/website.json`. */
interface LiveMediaImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly kind?: string | null;
}

function toMediaImage(dto: LiveMediaImage | null | undefined): MediaImage | undefined {
  if (!dto) return undefined;
  return {
    // Every image field in the live spec is a photo; `dto.kind` isn't a
    // reliable "image" vs "video" discriminant, so it's not read here.
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

/** `PublicRef` (category/tag reference) — see `docs/api-live/website.json`. */
interface LiveRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

/** `ArticleAuthorDto`, nested on an article — narrower than `PublicAuthorDto` (no slug). */
interface LiveArticleAuthor {
  readonly id: number;
  readonly name: string;
  readonly avatar: LiveMediaImage | null;
}

/** `PublicArticleDto` — see `docs/api-live/website.json`. */
interface LiveArticle {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string | null;
  readonly author: LiveArticleAuthor | null;
  readonly categories: readonly LiveRef[];
  readonly tags: readonly string[];
  readonly readingMinutes: number;
  readonly coverImage: LiveMediaImage | null;
  readonly publishedAt: string | null;
}

/** `PublicArticleCategoryDto` — see `docs/api-live/website.json`. */
interface LiveArticleCategory {
  readonly id: number;
  readonly slug: string | null;
  readonly name: string;
  readonly description: string | null;
}

/** `ArticleTagDto` — see `docs/api-live/website.json`. */
interface LiveArticleTag {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
}

/** `PublicAuthorDto` — see `docs/api-live/website.json`. */
interface LiveAuthor {
  readonly id: number;
  readonly slug: string | null;
  readonly name: string;
  readonly role: string | null;
  readonly bio: string | null;
  readonly avatar: LiveMediaImage | null;
}

function toArticle(dto: LiveArticle): Article {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    body: dto.body ?? "",
    authorId: dto.author ? String(dto.author.id) : "",
    // Live sends ref objects, not an id array.
    categoryIds: dto.categories.map((category) => String(category.id)),
    // Live tags are plain strings (slugs) with no separate id system — use the
    // string itself as the id.
    tagIds: dto.tags,
    // Live PublicArticleDto has no sportIds field at all.
    sportIds: [],
    coverImage: toMediaImage(dto.coverImage),
    readingMinutes: dto.readingMinutes,
    // GetArticles/GetArticleBySlug only ever return published articles.
    status: "published",
    // Nullable live despite this endpoint only listing published articles.
    publishedAt: dto.publishedAt ?? "",
    // Live has no updatedAt field for an article.
    updatedAt: undefined,
    // Not on the article itself live — related articles come from the
    // separate `/articles/{id}/related` endpoint (`listRelatedArticles`).
    relatedArticleIds: [],
  };
}

function toCategory(dto: LiveArticleCategory): ArticleCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
  };
}

function toTag(dto: LiveArticleTag): ArticleTag {
  // No separate tag id live; the slug doubles as the id.
  return { id: dto.slug, slug: dto.slug, name: dto.name };
}

function toAuthor(dto: LiveAuthor): Author {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    // `role` has no contract slot — dropped.
    bio: dto.bio ?? undefined,
    avatar: toMediaImage(dto.avatar),
  };
}

/** The blog over `/v1/articles`, `/v1/article-categories`, `/v1/article-tags`, `/v1/authors`. */
export const httpContentService: ContentService = {
  listArticles: (query) =>
    httpClient
      .get<LivePagedResult<LiveArticle>>("/v1/articles", {
        query: {
          ...listParams(query),
          categorySlugs: query.categorySlugs,
          tagSlugs: query.tagSlugs,
          sportSlugs: query.sportSlugs,
          // No `authorSlug` filter exists server-side — the live API only
          // accepts a numeric `AuthorId`, and there is no slug-to-id lookup to
          // resolve it through. Dropped rather than sent as a dead no-op.
        },
        revalidate: 300,
      })
      .then((raw): ArticleListResult => toPaginated(raw, toArticle)),

  getArticleBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveArticle>(`/v1/articles/${enc(slug)}`, { query: { language: locale }, revalidate: 300 })
        .then(toArticle),
    ),

  listRelatedArticles: (articleId, locale, limit) =>
    httpClient
      .get<LiveArticle[]>(`/v1/articles/${enc(articleId)}/related`, {
        query: { language: locale, limit },
        revalidate: 300,
      })
      .then((articles) => articles.map(toArticle)),

  listCategories: (locale) =>
    httpClient
      .get<LiveArticleCategory[]>("/v1/article-categories", { query: { language: locale }, revalidate: 600 })
      .then((categories) => categories.map(toCategory)),

  getCategoryBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveArticleCategory>(`/v1/article-categories/${enc(slug)}`, {
          query: { language: locale },
          revalidate: 600,
        })
        .then(toCategory),
    ),

  listTags: (locale) =>
    httpClient
      .get<LiveArticleTag[]>("/v1/article-tags", { query: { language: locale }, revalidate: 600 })
      .then((tags) => tags.map(toTag)),

  getAuthorById: (id, locale) =>
    orNull(
      httpClient.get<LiveAuthor>(`/v1/authors/${enc(id)}`, { query: { language: locale }, revalidate: 600 }).then(toAuthor),
    ),

  listSitemapEntries: async () => {
    // Slugs are language-neutral; the locale only picks which name comes back.
    const [categories, articles] = await Promise.all([
      httpContentService.listCategories("ar"),
      fetchSitemapEntries("content", (slug) => `/blog/${slug}`, { changeFrequency: "monthly", priority: 0.6 }),
    ]);
    return [
      { path: "/blog", changeFrequency: "daily", priority: 0.7 },
      ...categories.map(
        (category): SitemapEntry => ({ path: `/blog/categories/${category.slug}`, changeFrequency: "weekly", priority: 0.5 }),
      ),
      ...articles,
    ];
  },
};
