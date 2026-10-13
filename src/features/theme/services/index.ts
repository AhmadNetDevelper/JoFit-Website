import { resolveService } from "@/services";

import type { ThemeService } from "./theme.contract";
import { httpThemeService } from "./theme.http";
import { mockThemeService } from "./theme.mock";

/**
 * Add `theme.http.ts`, register it as `http`, and the site starts reading the
 * operator's theme from the backend with no other change anywhere.
 */
export const themeService = resolveService<ThemeService>("theme", {
  mock: mockThemeService,
  http: httpThemeService,
});

export type { ThemeService } from "./theme.contract";
