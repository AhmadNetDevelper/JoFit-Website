import defaultThemeJson from "./default-theme.json";
import type { PartialTheme, Theme } from "./types";

export const defaultTheme = defaultThemeJson as Theme;

/**
 * Fills a stored theme out to a complete one.
 *
 * The backend is allowed to send a partial: an operator who only changed the
 * accent should not have to store a whole design. Anything absent — including a
 * field added by a later deploy — comes from the default, so a theme saved today
 * keeps rendering after the contract grows.
 *
 * One level of nesting is all the contract has, so one level is all this merges.
 */
export function resolveTheme(stored?: PartialTheme | null): Theme {
  if (!stored) return defaultTheme;

  return {
    id: stored.id ?? defaultTheme.id,
    name: stored.name ?? defaultTheme.name,
    colors: { ...defaultTheme.colors, ...stored.colors },
    typography: { ...defaultTheme.typography, ...stored.typography },
    shape: { ...defaultTheme.shape, ...stored.shape },
    layout: { ...defaultTheme.layout, ...stored.layout },
  };
}

/** Negates an angle written as CSS, so `-15deg` and `15deg` swap. */
function mirrorAngle(angle: string): string {
  return angle.startsWith("-") ? angle.slice(1) : `-${angle}`;
}

/**
 * The theme as custom properties, ready for the `style` attribute on `<html>`.
 *
 * Applying it server-side is the whole point: a theme read in the browser after
 * hydration paints the default first and then flips, which is the flash every
 * cookie-driven theme switcher has. Rendering it into the document means the
 * first paint is already correct.
 *
 * The direction has to be passed in, and cannot be left to a `[dir="rtl"]` rule
 * in the stylesheet: these land in the element's `style` attribute, which
 * outranks any selector. The shear is the one value with a handedness, so it is
 * resolved here where the locale is already known.
 */
export function themeToCssVars(theme: Theme, direction: "ltr" | "rtl"): Record<string, string> {
  const { skew } = theme.shape;

  return {
    "--color-primary": theme.colors.primary,
    "--color-primary-hover": theme.colors.primaryHover,
    "--color-primary-dark": theme.colors.primaryDark,
    "--color-accent": theme.colors.accent,
    "--color-secondary": theme.colors.secondary,
    "--color-on-primary": theme.colors.onPrimary,
    "--color-on-secondary": theme.colors.onSecondary,
    "--color-title": theme.colors.title,
    "--color-body": theme.colors.body,
    "--color-surface": theme.colors.surface,
    "--color-surface-muted": theme.colors.surfaceMuted,
    "--color-border": theme.colors.border,
    "--font-body": theme.typography.fontFamily,
    "--type-scale": theme.typography.scale,
    "--title-weight": theme.typography.titleWeight,
    "--shape-skew": direction === "rtl" ? mirrorAngle(skew) : skew,
    "--radius": theme.shape.radius,
    "--radius-button": theme.shape.buttonRadius,
    "--layout-max": theme.layout.maxWidth,
    "--section-spacing": theme.layout.sectionSpacing,
  };
}
