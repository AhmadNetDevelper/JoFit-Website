/**
 * A menu staff manage in the admin, resolved for one language.
 *
 * `href` values are site paths WITHOUT the locale (`/specialisations/cpt`);
 * the component that renders them adds it. Hidden items and items pointing at
 * an unpublished page are already gone: what arrives here is what to show.
 */
export interface MenuLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface MenuGroup {
  readonly id: string;
  readonly label: string;
  readonly links: readonly MenuLink[];
}

export interface Menu {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly groups: readonly MenuGroup[];
}

export interface MenuPageSection {
  readonly id: string;
  readonly heading: string;
  /** Plain text; blank lines separate paragraphs. */
  readonly body: string;
}

/** A page a menu item opens, at `/specialisations/{slug}`. */
export interface MenuPage {
  /** The live `PublicMenuPageDto` has no `id` field at all — genuinely nothing to populate this from. */
  readonly id?: string;
  readonly slug: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly MenuPageSection[];
  readonly cta?: { readonly label: string; readonly href: string };
  /** The live `PublicMenuPageDto` has no `updatedAt` field at all — genuinely nothing to populate this from. */
  readonly updatedAt?: string;
}

/** Where every managed page lives. One function, so the menu and the page route agree. */
export function menuPagePath(slug: string): string {
  return `/specialisations/${slug}`;
}
