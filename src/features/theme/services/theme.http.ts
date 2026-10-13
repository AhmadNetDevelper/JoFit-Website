import { httpClient } from "@/services";

import { resolveTheme } from "../resolve-theme";
import type { PartialTheme } from "../types";
import type { ThemeService } from "./theme.contract";

/**
 * `GET /v1/theme` — the theme staff save in the admin (`PUT /v1/admin/settings/theme`).
 *
 * The API may return any subset; `resolveTheme` fills the rest from the shipped
 * default. If the API cannot be reached the site renders in the default theme
 * rather than failing: the theme styles every page, and an outage of the
 * settings table must not become an outage of the storefront.
 */
export const httpThemeService: ThemeService = {
  async getActiveTheme() {
    try {
      return resolveTheme(await httpClient.get<PartialTheme>("/v1/theme", { revalidate: 60, tags: ["theme"] }));
    } catch {
      return resolveTheme(null);
    }
  },
};
