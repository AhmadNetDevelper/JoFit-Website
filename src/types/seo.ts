/**
 * SEO fields owned by the content source (CMS/API) rather than by the frontend.
 * `lib/seo.ts` turns this into a Next.js `Metadata` object.
 */
export interface SeoMeta {
  readonly title?: string;
  readonly description?: string;
  readonly ogImageUrl?: string;
  /** Site-relative path used to build the canonical URL. */
  readonly canonicalPath?: string;
  readonly noIndex?: boolean;
}

/** Everything the sitemap needs from any indexable entity. */
export interface SitemapEntry {
  readonly path: string;
  readonly lastModified?: string;
  readonly changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  readonly priority?: number;
}
