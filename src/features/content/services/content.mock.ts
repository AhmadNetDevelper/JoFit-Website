import { resolveText, type Locale } from "@/i18n";
import { paginate } from "@/lib";
import {
  mockArticleCategories,
  mockArticleTags,
  mockArticles,
  mockAuthors,
  type RawArticle,
  type RawArticleCategory,
  type RawArticleTag,
  type RawAuthor,
} from "@/mocks/content";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { SitemapEntry } from "@/types";

import type { Article, ArticleCategory, ArticleListQuery, ArticleTag, Author } from "../types";
import type { ContentService } from "./content.contract";

/** Source → domain mapping; the HTTP adapter will do the same with a wire format. */
function toArticle(fixture: RawArticle, locale: Locale): Article {
  /* Staff's latest cover over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("article", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    title: resolveText(raw.title, locale),
    excerpt: resolveText(raw.excerpt, locale),
    body: resolveText(raw.body, locale),
    authorId: raw.authorId,
    categoryIds: raw.categoryIds,
    tagIds: raw.tagIds,
    sportIds: raw.sportIds,
    coverImage: raw.coverImage,
    readingMinutes: raw.readingMinutes,
    status: raw.status,
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt,
    relatedArticleIds: raw.relatedArticleIds,
  };
}

function toCategory(raw: RawArticleCategory, locale: Locale): ArticleCategory {
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    description: raw.description ? resolveText(raw.description, locale) : undefined,
  };
}

function toTag(raw: RawArticleTag, locale: Locale): ArticleTag {
  return { id: raw.id, slug: raw.slug, name: resolveText(raw.name, locale) };
}

function toAuthor(fixture: RawAuthor, locale: Locale): Author {
  const raw = withCatalogueImages("author", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    bio: raw.bio ? resolveText(raw.bio, locale) : undefined,
    avatar: raw.avatar,
  };
}

function publishedRaw(): RawArticle[] {
  return mockArticles.filter((article) => article.status === "published");
}

function applyFilters(query: ArticleListQuery): Article[] {
  const categoryIds = query.categorySlugs?.length
    ? mockArticleCategories.filter((c) => query.categorySlugs?.includes(c.slug)).map((c) => c.id)
    : undefined;
  const tagIds = query.tagSlugs?.length
    ? mockArticleTags.filter((t) => query.tagSlugs?.includes(t.slug)).map((t) => t.id)
    : undefined;
  const sportIds = query.sportSlugs?.length
    ? mockSports.filter((s) => query.sportSlugs?.includes(s.slug)).map((s) => s.id)
    : undefined;
  const authorId = query.authorSlug
    ? mockAuthors.find((author) => author.slug === query.authorSlug)?.id
    : undefined;

  return publishedRaw()
    .map((raw) => toArticle(raw, query.locale))
    .filter((article) => {
      if (!matchesText([article.title, article.excerpt], query.search)) return false;
      if (!matchesAny([...article.categoryIds], categoryIds)) return false;
      if (!matchesAny([...article.tagIds], tagIds)) return false;
      if (!matchesAny([...article.sportIds], sportIds)) return false;
      if (authorId && article.authorId !== authorId) return false;
      return true;
    });
}

export const mockContentService: ContentService = {
  async listArticles(query) {
    await simulateLatency();
    const filtered = applyFilters(query);
    return paginate(
      sortBy(filtered, (a, b) => b.publishedAt.localeCompare(a.publishedAt)),
      query,
    );
  },

  async getArticleBySlug(slug, locale) {
    await simulateLatency();
    const raw = publishedRaw().find((article) => article.slug === slug);
    return raw ? toArticle(raw, locale) : null;
  },

  async listRelatedArticles(articleId, locale, limit = 3) {
    await simulateLatency();
    const source = mockArticles.find((article) => article.id === articleId);
    if (!source) return [];

    const explicit = publishedRaw().filter((article) =>
      source.relatedArticleIds.includes(article.id),
    );
    const bySport = publishedRaw().filter(
      (article) =>
        article.id !== articleId &&
        !explicit.includes(article) &&
        article.sportIds.some((sportId) => source.sportIds.includes(sportId)),
    );

    return [...explicit, ...bySport].slice(0, limit).map((raw) => toArticle(raw, locale));
  },

  async listCategories(locale) {
    await simulateLatency();
    return mockArticleCategories.map((raw) => toCategory(raw, locale));
  },

  async getCategoryBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockArticleCategories.find((category) => category.slug === slug);
    return raw ? toCategory(raw, locale) : null;
  },

  async listTags(locale) {
    await simulateLatency();
    return mockArticleTags.map((raw) => toTag(raw, locale));
  },

  async getAuthorById(id, locale) {
    await simulateLatency();
    const raw = mockAuthors.find((author) => author.id === id);
    return raw ? toAuthor(raw, locale) : null;
  },

  async listSitemapEntries(): Promise<readonly SitemapEntry[]> {
    await simulateLatency();
    // Locale-free: `app/sitemap.ts` expands each path across every locale.
    return [
      { path: "/blog", changeFrequency: "daily", priority: 0.7 },
      ...mockArticleCategories.map((category) => ({
        path: `/blog/categories/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...publishedRaw().map((article) => ({
        path: `/blog/${article.slug}`,
        lastModified: article.updatedAt ?? article.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  },
};
