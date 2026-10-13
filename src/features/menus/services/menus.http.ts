import { httpClient, orNull } from "@/services";

import type { Menu, MenuPage } from "../types";
import type { MenusService } from "./menus.contract";

const enc = encodeURIComponent;

/** `PublicMenuItemDto` — see `docs/api-live/website.json`. */
interface LiveMenuItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

/** `PublicMenuGroupDto` — see `docs/api-live/website.json`. */
interface LiveMenuGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly LiveMenuItem[];
}

/** `PublicMenuDto` — see `docs/api-live/website.json`. */
interface LiveMenu {
  readonly key: string;
  readonly label: string;
  readonly href: string | null;
  readonly groups: readonly LiveMenuGroup[];
}

/** `PublicSectionDto` — see `docs/api-live/website.json`. */
interface LiveMenuPageSection {
  readonly heading: string;
  readonly body: string;
}

/** `PublicMenuPageDto` — see `docs/api-live/website.json`. */
interface LiveMenuPage {
  readonly slug: string;
  readonly eyebrow: string | null;
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly LiveMenuPageSection[];
  readonly cta: { readonly label: string; readonly href: string } | null;
}

function toMenu(dto: LiveMenu): Menu {
  return {
    key: dto.key,
    label: dto.label,
    // Live `href` is nullable; the contract wants a plain string, so a
    // missing link falls back to a no-op anchor rather than leaking `null`.
    href: dto.href ?? "#",
    groups: dto.groups.map((group) => ({
      id: group.id,
      label: group.label,
      links: group.items.map((item) => ({ id: item.id, label: item.label, href: item.href })),
    })),
  };
}

function toMenuPage(dto: LiveMenuPage): MenuPage {
  return {
    // Live `PublicMenuPageDto` has no `id`/`updatedAt` fields at all — left
    // undefined rather than cast through a value that was never there.
    id: undefined,
    slug: dto.slug,
    eyebrow: dto.eyebrow ?? "",
    title: dto.title,
    summary: dto.summary,
    sections: dto.sections.map((section, index) => ({
      // Live sections have no `id` field either; a stable position-based key
      // is enough for the anchor/TOC use this serves.
      id: `section-${index}`,
      heading: section.heading,
      body: section.body,
    })),
    cta: dto.cta ? { label: dto.cta.label, href: dto.cta.href } : undefined,
    updatedAt: undefined,
  };
}

/**
 * Staff-managed menus over `/v1/menus/{key}` and `/v1/menu-pages/{slug}`.
 * Tagged `menus` so the header refreshes within a minute of an admin edit.
 */
export const httpMenusService: MenusService = {
  getMenu: (key, locale) =>
    orNull(
      httpClient
        .get<LiveMenu>(`/v1/menus/${enc(key)}`, { query: { language: locale }, revalidate: 60, tags: ["menus"] })
        .then(toMenu),
    ),
  getPage: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveMenuPage>(`/v1/menu-pages/${enc(slug)}`, { query: { language: locale }, revalidate: 60, tags: ["menus"] })
        .then(toMenuPage),
    ),
  listPageSlugs: () => httpClient.get<string[]>("/v1/menu-pages", { revalidate: 300, tags: ["menus"] }),
};
