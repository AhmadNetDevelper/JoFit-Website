import { httpClient, orNull } from "@/services";

import type { Sport } from "../types";
import type { SportsService } from "./sports.contract";

/** Wire shape from `docs/api-live/website.json` (`Sports` tag). */
interface MediaImageDtoWire {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface PublicSportDtoWire {
  readonly id: number;
  readonly slug?: string | null;
  readonly name: string;
  readonly description?: string | null;
  readonly image?: MediaImageDtoWire | null;
  readonly isFeatured: boolean;
}

function toMediaImage(dto: MediaImageDtoWire | null | undefined) {
  if (!dto) return undefined;
  return { kind: "image" as const, id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

function toSport(dto: PublicSportDtoWire): Sport {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? "",
    // No `iconKey` field live — stays unset. Whatever does icon lookup by id
    // needs its own fallback for a sport with none; that's out of scope here.
    image: toMediaImage(dto.image),
    isFeatured: dto.isFeatured,
  };
}

/** `GET /v1/sports` · `GET /v1/sports/{slug}`. */
export const httpSportsService: SportsService = {
  list: (query) =>
    httpClient
      .get<readonly PublicSportDtoWire[]>("/v1/sports", {
        /*
         * `featuredOnly` and `search` are deliberately NOT sent: live
         * `GET /sports` only accepts `ids` and `language` — neither filter
         * has a backing parameter, so sending them reaches nobody. A
         * "featured sports" UI built on this needs to filter client-side on
         * the full list instead; that's a UI-layer fix, out of scope here.
         */
        query: { language: query.locale },
        revalidate: 300,
      })
      .then((items) => items.map(toSport)),

  getBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<PublicSportDtoWire>(`/v1/sports/${encodeURIComponent(slug)}`, { query: { language: locale }, revalidate: 300 })
        .then(toSport),
    ),

  getManyByIds: async (ids, locale) =>
    ids.length === 0
      ? []
      : httpClient
          .get<readonly PublicSportDtoWire[]>("/v1/sports", { query: { language: locale, ids }, revalidate: 300 })
          .then((items) => items.map(toSport)),
};
