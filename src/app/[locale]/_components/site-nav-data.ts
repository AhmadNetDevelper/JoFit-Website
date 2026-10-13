import { isFeatureEnabled, primaryNav, type NavItem } from "@/config";
import { menusService } from "@/features/menus";
import { getTranslator, localePath, type Locale } from "@/i18n";

export interface ResolvedNavLink {
  readonly href: string;
  readonly label: string;
}

export interface ResolvedNavColumn {
  readonly id: string;
  readonly label: string;
  readonly links: readonly ResolvedNavLink[];
}

export interface ResolvedNavItem extends ResolvedNavLink {
  readonly columns?: readonly ResolvedNavColumn[];
}

const localize = (locale: Locale, href: string) => (href.startsWith("/") ? localePath(locale, href) : href);

/**
 * THE SITE NAVIGATION, RESOLVED FOR ONE LANGUAGE — shared by the header and
 * the footer so the two can never list different things.
 *
 * Most of it is the fixed map in `config/navigation.ts`. An item with a
 * `menuKey` is STAFF-MANAGED: its label, columns and links come from the admin
 * (Content → Courses menu), so adding a course page there puts it in the
 * header without a deploy. If that menu cannot be read, the item falls back to
 * the columns written in the config — a missing menu must never take the
 * header down with it.
 */
export async function resolveSiteNav(locale: Locale): Promise<readonly ResolvedNavItem[]> {
  const t = getTranslator(locale);
  const visible = (item: NavItem) => !item.feature || isFeatureEnabled(item.feature);
  const link = (item: NavItem): ResolvedNavLink => ({ href: localize(locale, item.href), label: t(item.labelKey) });

  return Promise.all(
    primaryNav.filter(visible).map(async (item): Promise<ResolvedNavItem> => {
      if (item.menuKey) {
        const menu = await menusService.getMenu(item.menuKey, locale).catch(() => null);
        if (menu) {
          return {
            href: localize(locale, menu.href),
            label: menu.label,
            columns: menu.groups.map((group) => ({
              id: `nav-${group.id}`,
              label: group.label,
              links: group.links.map((entry) => ({ href: localize(locale, entry.href), label: entry.label })),
            })),
          };
        }
      }
      return {
        ...link(item),
        columns: item.groups
          ?.map((group) => ({ id: group.id, label: t(group.labelKey), links: group.items.filter(visible).map(link) }))
          /* A column whose every link is behind a disabled flag would otherwise
             render as a heading with nothing under it. */
          .filter((column) => column.links.length > 0),
      };
    }),
  );
}

/**
 * Everything reachable from the navigation, parents and panel links alike,
 * once each — the footer's "Explore" column. Hash links point into a page
 * already listed and are left out.
 */
export function flattenResolvedNav(items: readonly ResolvedNavItem[]): readonly ResolvedNavLink[] {
  const seen = new Set<string>();
  const out: ResolvedNavLink[] = [];
  const push = (entry: ResolvedNavLink) => {
    if (entry.href.includes("#") || seen.has(entry.href)) return;
    seen.add(entry.href);
    out.push(entry);
  };
  for (const item of items) {
    push(item);
    for (const column of item.columns ?? []) column.links.forEach(push);
  }
  return out;
}
