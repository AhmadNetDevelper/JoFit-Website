import { resolveText, type Locale } from "@/i18n";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { matchesText, simulateLatency } from "@/mocks/runtime";
import { mockSports, type RawSport } from "@/mocks/sports";

import type { Sport } from "../types";
import type { SportsService } from "./sports.contract";

/**
 * Maps a raw fixture to the domain model, resolving localized text.
 *
 * This mapping step is not mock scaffolding — the HTTP adapter will do exactly
 * the same thing with a wire format. Keeping it here is what lets the domain
 * model stay clean of transport concerns.
 */
function toSport(fixture: RawSport, locale: Locale): Sport {
  /* Staff's latest picture over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("sport", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    description: resolveText(raw.description, locale),
    iconKey: raw.iconKey,
    image: raw.image,
    isFeatured: raw.isFeatured,
  };
}

export const mockSportsService: SportsService = {
  async list(query) {
    await simulateLatency();
    return mockSports
      .map((raw) => toSport(raw, query.locale))
      .filter(
        (sport) =>
          (!query.featuredOnly || sport.isFeatured) &&
          matchesText([sport.name, sport.description], query.search),
      );
  },

  async getBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockSports.find((sport) => sport.slug === slug);
    return raw ? toSport(raw, locale) : null;
  },

  async getManyByIds(ids, locale) {
    await simulateLatency();
    return mockSports.filter((sport) => ids.includes(sport.id)).map((raw) => toSport(raw, locale));
  },
};
