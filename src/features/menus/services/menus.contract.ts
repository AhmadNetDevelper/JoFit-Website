import type { Locale } from "@/i18n";

import type { Menu, MenuPage } from "../types";

export interface MenusService {
  /** The menu with this key, or null when it does not exist. */
  getMenu(key: string, locale: Locale): Promise<Menu | null>;
  /** A PUBLISHED page by slug, or null. */
  getPage(slug: string, locale: Locale): Promise<MenuPage | null>;
  /** Slugs of every published page, for the sitemap and static params. */
  listPageSlugs(): Promise<readonly string[]>;
}
