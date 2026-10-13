import { resolveText, type Locale } from "@/i18n";
import { accountStore, type RawMenuItem, type RawMenuPage } from "@/mocks/accounts";
import { simulateLatency } from "@/mocks/runtime";

import { menuPagePath, type MenuLink, type MenuPage } from "../types";
import type { MenusService } from "./menus.contract";

const published = (page: RawMenuPage | undefined): page is RawMenuPage => page?.status === "published";

function toLink(item: RawMenuItem, pages: readonly RawMenuPage[], locale: Locale): MenuLink | null {
  if (!item.isVisible) return null;
  if (item.target.kind === "link") {
    return { id: item.id, label: resolveText(item.label, locale), href: item.target.href };
  }
  const { pageId } = item.target;
  const page = pages.find((entry) => entry.id === pageId);
  /* An item pointing at a draft or deleted page is left out rather than
     linking to a 404. */
  return published(page) ? { id: item.id, label: resolveText(item.label, locale), href: menuPagePath(page.slug) } : null;
}

function toPage(raw: RawMenuPage, locale: Locale): MenuPage {
  return {
    id: raw.id,
    slug: raw.slug,
    eyebrow: resolveText(raw.eyebrow, locale),
    title: resolveText(raw.title, locale),
    summary: resolveText(raw.summary, locale),
    sections: raw.sections.map((section) => ({
      id: section.id,
      heading: resolveText(section.heading, locale),
      body: resolveText(section.body, locale),
    })),
    cta: raw.cta ? { label: resolveText(raw.cta.label, locale), href: raw.cta.href } : undefined,
    updatedAt: raw.updatedAt,
  };
}

export const mockMenusService: MenusService = {
  async getMenu(key, locale) {
    await simulateLatency();
    const { menus, menuPages } = accountStore();
    const menu = menus.find((entry) => entry.key === key);
    if (!menu) return null;
    return {
      key: menu.key,
      label: resolveText(menu.label, locale),
      href: menu.href,
      groups: menu.groups
        .map((group) => ({
          id: group.id,
          label: resolveText(group.label, locale),
          links: group.items
            .map((item) => toLink(item, menuPages, locale))
            .filter((link): link is MenuLink => link !== null),
        }))
        /* A group whose every item is hidden would be a heading over nothing. */
        .filter((group) => group.links.length > 0),
    };
  },

  async getPage(slug, locale) {
    await simulateLatency();
    const page = accountStore().menuPages.find((entry) => entry.slug === slug);
    return published(page) ? toPage(page, locale) : null;
  },

  async listPageSlugs() {
    await simulateLatency();
    return accountStore().menuPages.filter(published).map((page) => page.slug);
  },
};
