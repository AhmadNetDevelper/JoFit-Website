import type { Theme } from "../types";

/**
 * FEATURE BOUNDARY.
 *
 * One call, because the site only ever needs the theme that is live right now.
 * Which theme that is — a draft being previewed, a seasonal one on a schedule,
 * one per locale — is a decision for the backend, not for the site.
 *
 * OPEN BUSINESS DECISIONS: whether operators get a preview mode before
 * publishing, whether a theme can be scheduled, and whether Arabic may carry a
 * different theme from English.
 */
export interface ThemeService {
  getActiveTheme(): Promise<Theme>;
}
