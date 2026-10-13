import { defaultTheme, resolveTheme } from "../resolve-theme";
import type { ThemeService } from "./theme.contract";
import type { PartialTheme } from "../types";

/**
 * Serves the theme from the bundled JSON until the backend exists.
 *
 * It deliberately goes through `resolveTheme` rather than returning the JSON
 * directly: the merge is the part that has to be right when a real, possibly
 * partial, record starts arriving, so it runs from day one instead of being
 * switched on with the API.
 */
export const mockThemeService: ThemeService = {
  async getActiveTheme() {
    const stored: PartialTheme | null = null;
    return resolveTheme(stored) satisfies typeof defaultTheme;
  },
};
