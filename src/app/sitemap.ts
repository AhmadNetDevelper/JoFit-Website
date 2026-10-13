import type { MetadataRoute } from "next";

import { isFeatureEnabled } from "@/config";
import { careersService } from "@/features/careers";
import { coachesService } from "@/features/coaches";
import { contentService } from "@/features/content";
import { educationService } from "@/features/education";
import { menuPagePath, menusService } from "@/features/menus";
import { rentalService } from "@/features/rental";
import { shopService } from "@/features/shop";
import { DEFAULT_LOCALE, LOCALES, LOCALE_HREFLANG, localePath } from "@/i18n";
import { absoluteUrl } from "@/lib";
import type { SitemapEntry } from "@/types";

/**
 * Each indexable domain contributes locale-free paths through
 * `listSitemapEntries`; this file expands them across every language and
 * attaches `alternates.languages` so search engines understand the two versions
 * as translations of one page rather than duplicates.
 *
 * Adding a domain is one line here plus that method — there is no central URL
 * list to keep in sync, and it starts working against the real API the moment
 * the adapters switch.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sources: Array<Promise<readonly SitemapEntry[]>> = [];

  if (isFeatureEnabled("shop")) sources.push(shopService.listSitemapEntries());
  if (isFeatureEnabled("rental")) sources.push(rentalService.listSitemapEntries());
  if (isFeatureEnabled("coaches")) sources.push(coachesService.listSitemapEntries());
  if (isFeatureEnabled("education")) sources.push(educationService.listSitemapEntries());
  if (isFeatureEnabled("content")) sources.push(contentService.listSitemapEntries());
  /* The careers board: every public job and every verified employer. A board
     that failed to answer must not take the whole sitemap down with it. */
  sources.push(careersService.listSitemapEntries().catch(() => []));
  /* The pages staff write for the Courses menu. */
  sources.push(
    menusService
      .listPageSlugs()
      .then((slugs) => slugs.map((slug): SitemapEntry => ({ path: menuPagePath(slug), changeFrequency: "monthly", priority: 0.6 })))
      .catch(() => []),
  );

  const collected = await Promise.all(sources);
  const staticEntries: readonly SitemapEntry[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/sports", changeFrequency: "monthly", priority: 0.5 },
    /* A static route is invisible to the sitemap unless it is named here —
       only the feature services below contribute URLs of their own. */
    { path: "/specialisations", changeFrequency: "monthly", priority: 0.9 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.8 },
    { path: "/shop/brands", changeFrequency: "weekly", priority: 0.6 },
    { path: "/nutrition", changeFrequency: "monthly", priority: 0.5 },
    { path: "/careers", changeFrequency: "daily", priority: 0.7 },
    { path: "/careers/employers", changeFrequency: "weekly", priority: 0.5 },
    { path: "/careers/employers/join", changeFrequency: "monthly", priority: 0.4 },
    { path: "/quotations", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  const entries = [...staticEntries, ...collected.flat()];

  return entries.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localePath(locale, entry.path)),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((alt) => [LOCALE_HREFLANG[alt], absoluteUrl(localePath(alt, entry.path))]),
          ),
          "x-default": absoluteUrl(localePath(DEFAULT_LOCALE, entry.path)),
        },
      },
    })),
  );
}
