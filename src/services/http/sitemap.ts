import type { SitemapEntry } from "@/types";

import { httpClient } from "./client";

type SitemapArea = "shop" | "rental" | "coaches" | "education" | "content" | "careers";

interface SitemapEntryDto {
  readonly slug: string;
  readonly lastModified?: string | null;
}

/**
 * `GET /v1/sitemap/{area}` answers bare slugs, not this app's locale-free
 * paths, so each area supplies the route its slugs belong to.
 */
export async function fetchSitemapEntries(
  area: SitemapArea,
  toPath: (slug: string) => string,
  extra: Pick<SitemapEntry, "changeFrequency" | "priority"> = {},
): Promise<SitemapEntry[]> {
  const dtos = await httpClient.get<readonly SitemapEntryDto[]>(`/v1/sitemap/${area}`, { revalidate: 3600 });
  return dtos.map((dto) => ({
    path: toPath(dto.slug),
    ...(dto.lastModified ? { lastModified: dto.lastModified } : {}),
    ...extra,
  }));
}
