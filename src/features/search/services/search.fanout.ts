import { coachesService } from "@/features/coaches";
import { contentService } from "@/features/content";
import { educationService } from "@/features/education";
import { rentalService } from "@/features/rental";
import { shopService } from "@/features/shop";

import type { SearchGroup, SearchHitKind, SearchQuery, SearchResults } from "../types";
import type { SearchService } from "./search.contract";

function includesKind(scope: SearchQuery["scope"], kind: SearchHitKind): boolean {
  if (!scope || scope === "all") return true;
  const map: Record<Exclude<SearchQuery["scope"], undefined | "all">, SearchHitKind> = {
    products: "product",
    rentals: "rental",
    coaches: "coach",
    courses: "course",
    articles: "article",
  };
  return map[scope] === kind;
}

/**
 * Fans out across the domain services in parallel. It deliberately lives behind
 * the same `SearchService` contract a real search backend would implement, so
 * swapping it is a registration change rather than a UI change.
 */
export const fanoutSearchService: SearchService = {
  async search(query): Promise<SearchResults> {
    const term = query.term.trim();
    const scope = query.scope ?? "all";
    const pageSize = query.limitPerGroup ?? 5;

    if (!term) {
      return { term, scope, total: 0, groups: [] };
    }

    const { locale } = query;
    const [products, rentals, coaches, courses, articles] = await Promise.all([
      includesKind(scope, "product")
        ? shopService.listProducts({ search: term, pageSize, locale })
        : null,
      includesKind(scope, "rental")
        ? rentalService.listItems({ search: term, pageSize, locale })
        : null,
      includesKind(scope, "coach")
        ? coachesService.listCoaches({ search: term, pageSize, locale })
        : null,
      includesKind(scope, "course")
        ? educationService.listCourses({ search: term, pageSize, locale })
        : null,
      includesKind(scope, "article")
        ? contentService.listArticles({ search: term, pageSize, locale })
        : null,
    ]);

    const groups: SearchGroup[] = [];

    if (products) {
      groups.push({
        kind: "product",
        total: products.meta.totalItems,
        hits: products.items.map((item) => ({
          kind: "product" as const,
          item,
          href: `/shop/products/${item.slug}`,
        })),
      });
    }
    if (rentals) {
      groups.push({
        kind: "rental",
        total: rentals.meta.totalItems,
        hits: rentals.items.map((item) => ({
          kind: "rental" as const,
          item,
          href: `/rental/items/${item.slug}`,
        })),
      });
    }
    if (coaches) {
      groups.push({
        kind: "coach",
        total: coaches.meta.totalItems,
        hits: coaches.items.map((item) => ({
          kind: "coach" as const,
          item,
          href: `/coaches/${item.slug}`,
        })),
      });
    }
    if (courses) {
      groups.push({
        kind: "course",
        total: courses.meta.totalItems,
        hits: courses.items.map((item) => ({
          kind: "course" as const,
          item,
          href: `/education/courses/${item.slug}`,
        })),
      });
    }
    if (articles) {
      groups.push({
        kind: "article",
        total: articles.meta.totalItems,
        hits: articles.items.map((item) => ({
          kind: "article" as const,
          item,
          href: `/blog/${item.slug}`,
        })),
      });
    }

    const populated = groups.filter((group) => group.hits.length > 0);
    return {
      term,
      scope,
      total: populated.reduce((sum, group) => sum + group.total, 0),
      groups: populated,
    };
  },
};
