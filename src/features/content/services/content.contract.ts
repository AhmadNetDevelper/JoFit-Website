import type { Locale } from "@/i18n";
import type { SitemapEntry } from "@/types";

import type { Article, ArticleCategory, ArticleListQuery, ArticleListResult, ArticleTag, Author } from "../types";

export interface ContentService {
  listArticles(query: ArticleListQuery): Promise<ArticleListResult>;
  getArticleBySlug(slug: string, locale: Locale): Promise<Article | null>;
  listRelatedArticles(
    articleId: string,
    locale: Locale,
    limit?: number,
  ): Promise<readonly Article[]>;
  listCategories(locale: Locale): Promise<readonly ArticleCategory[]>;
  getCategoryBySlug(slug: string, locale: Locale): Promise<ArticleCategory | null>;
  listTags(locale: Locale): Promise<readonly ArticleTag[]>;
  getAuthorById(id: string, locale: Locale): Promise<Author | null>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;
}
