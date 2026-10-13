import type { SportId } from "@/features/sports";
import type { ListQuery, MediaImage, Paginated, PublishStatus, SeoMeta } from "@/types";

/**
 * Editorial content is kept strictly separate from commerce: an article is never
 * a product, and the content source (CMS today, headless CMS later) is a
 * different system from the catalogue. The only link between them is the shared
 * sports taxonomy.
 */
export interface Author {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly bio?: string;
  readonly avatar?: MediaImage;
}

export interface ArticleCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string;
  readonly seo?: SeoMeta;
}

export interface ArticleTag {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
}

export interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  /**
   * Rich text as delivered by the source. The rendering strategy (Markdown,
   * portable text, sanitised HTML) is an OPEN DECISION deferred to whichever CMS
   * is chosen; only this field's owner changes when it is settled.
   */
  readonly body: string;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly sportIds: readonly SportId[];
  readonly coverImage?: MediaImage;
  readonly readingMinutes: number;
  readonly status: PublishStatus;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly relatedArticleIds: readonly string[];
  readonly seo?: SeoMeta;
}

export interface ArticleListQuery extends ListQuery {
  readonly categorySlugs?: readonly string[];
  readonly tagSlugs?: readonly string[];
  readonly sportSlugs?: readonly string[];
  readonly authorSlug?: string;
}

export type ArticleListResult = Paginated<Article>;
