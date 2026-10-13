/**
 * THE THEME CONTRACT.
 *
 * This is the shape the backend will serve. Everything the site lets an operator
 * change lives here and nowhere else — a value that is not in this object is a
 * design decision, not a setting, and belongs in CSS.
 *
 * Every field is a raw CSS value on purpose. The theme is applied by writing
 * these straight into custom properties on `<html>`, so a value that is legal
 * CSS is legal here and no translation layer sits in between. That also means a
 * future admin screen can offer a colour picker without the site needing to
 * learn a new format.
 *
 * Adding a field is backwards compatible: `resolveTheme` fills anything missing
 * from the default, so an older stored theme keeps working after a deploy.
 */
export interface ThemeColors {
  /** Actions: buttons, active states, the one colour that means "do this". */
  readonly primary: string;
  readonly primaryHover: string;
  /** Links, small text and icons — a darker tone that passes contrast at 14px. */
  readonly primaryDark: string;
  /** The third colour. Used sparingly: rules, highlights, the mark's gold. */
  readonly accent: string;
  /** Dark surfaces: the counter band, the footer, inverted cards. */
  readonly secondary: string;
  /** Text on a primary-filled surface. Must clear 4.5:1 against `primary`. */
  readonly onPrimary: string;
  /** Text on a dark surface. */
  readonly onSecondary: string;
  readonly title: string;
  readonly body: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly border: string;
}

export interface ThemeTypography {
  /**
   * The whole font stack, and it must NAME its families literally.
   *
   * Do not build it from next/font's `var(--font-*)` handles: one of those
   * expands to `Poppins, "Poppins Fallback"`, and that metric-matched fallback
   * is backed by a system face that carries Arabic — so Arabic text matches it
   * and paints in Arial instead of falling through to the Arabic family. The
   * Arabic face has to come before any Latin fallback, which only spelling the
   * names out guarantees.
   *
   * This value lands in `style` on <html>, so it outranks every stylesheet.
   */
  readonly fontFamily: string;
  /** Multiplies the whole type scale, so a theme can run larger or tighter. */
  readonly scale: string;
  readonly titleWeight: string;
}

export interface ThemeShape {
  /**
   * The template's signature: buttons, inputs and section rules are sheared.
   * `0deg` turns the whole look square without touching a component, which is
   * the cheapest real "different design" a theme can offer.
   *
   * The sign is flipped under `dir="rtl"` in CSS — a shear that leans the same
   * way in both directions looks like a bug in one of them.
   */
  readonly skew: string;
  readonly radius: string;
  readonly buttonRadius: string;
}

export interface ThemeLayout {
  readonly maxWidth: string;
  readonly sectionSpacing: string;
  /** `fixed` sticks the header on scroll; `static` lets it scroll away. */
  readonly headerMode: "fixed" | "static";
}

export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly colors: ThemeColors;
  readonly typography: ThemeTypography;
  readonly shape: ThemeShape;
  readonly layout: ThemeLayout;
}

/** What the backend may send: any subset, nested. Missing fields fall back. */
export type PartialTheme = {
  readonly [K in keyof Theme]?: Theme[K] extends string
    ? Theme[K]
    : Partial<Theme[K]>;
};
