/**
 * Public surface of the theme domain.
 *
 * The site's look is data: colours, the type scale, the shear on the buttons and
 * the page width all arrive as a record and are written onto `<html>` as custom
 * properties before the first paint. Components never read the theme — they use
 * the tokens in `styles/tokens.css`, which is what makes a theme change a data
 * change rather than a deploy.
 */
export { defaultTheme, resolveTheme, themeToCssVars } from "./resolve-theme";
export { themeService, type ThemeService } from "./services";
export type { PartialTheme, Theme } from "./types";
