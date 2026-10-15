import type { TranslationKey } from "@/i18n/dictionaries";

import type { FeatureKey } from "./features";

/**
 * NAVIGATION IS DATA, NOT MARKUP.
 *
 * The header and the footer both read these lists; neither decides what is in
 * them. Adding a page means one entry here plus one translation pair, and no
 * component changes.
 *
 * ---------------------------------------------------------------------------
 * WHY A TREE, AND WHY GROUPS RATHER THAN PLAIN CHILDREN.
 *
 * A flat `children` array gives a single dropdown column, which is fine for
 * four links and unusable for fifteen. What this business actually has is a
 * catalogue with natural headings — the NCSF international certifications are
 * one thing, the specialised courses are another — and a menu that throws them
 * into one list makes the reader do the sorting the business already did.
 *
 * So the unit below a top-level item is a GROUP: a heading plus its links, one
 * column in the panel. An item with no groups is an ordinary link and renders
 * as one; the header does not need to know which is which in advance.
 *
 * ---------------------------------------------------------------------------
 * EVERY href MUST RESOLVE.
 *
 * A menu is a promise about what exists. These routes were checked against
 * src/app/[locale]/(site)/ — the template's own menu shipped links to
 * /schedule, /services and /blog-details, none of which are routes, and they
 * 404'd in both locales for as long as they were there. Before adding an entry,
 * open the directory.
 */
export interface NavItem {
  /** Dictionary key, not a literal — the site is bilingual. */
  readonly labelKey: TranslationKey;
  /** Locale-free path; the locale prefix is added when the link is rendered. */
  readonly href: string;
  /** When set, the item is hidden while the flag is off. */
  readonly feature?: FeatureKey;
  /** Columns of the dropdown panel. Absent means a plain link. */
  readonly groups?: readonly NavGroup[];
  /**
   * STAFF-MANAGED: the label and columns come from the menu with this key
   * (admin → Content → Courses menu). `groups` above is then only the fallback
   * used when that menu cannot be read.
   */
  readonly menuKey?: string;
}

export interface NavGroup {
  /** Stable id for the panel's `aria-labelledby`. */
  readonly id: string;
  readonly labelKey: TranslationKey;
  readonly items: readonly NavItem[];
}

/**
 * The top bar. Courses first — JoFit is a certification body before it is a
 * shop (the formal redesign, 2026-09-29). Four items and the quote button, deliberately — the bar shares
 * 1200px with the mark and the action, and past six the labels start wrapping
 * before Arabic, which sets wider, has even had its turn.
 *
 * Everything the client asked to see in the menu is here; the four that are not
 * top-level (brands, specialisations, nutrition, the individual courses) sit in
 * a panel under the parent they belong to, which is where a visitor looks for
 * them anyway.
 */
export const primaryNav: readonly NavItem[] = [
  {
    labelKey: "nav.education",
    href: "/education",
    feature: "education",
    menuKey: "courses",
    groups: [
      /*
       * THESE POINT AT COURSES, NOT AT ANCHORS.
       *
       * They were `/specialisations#cpt` and so on, because when the menu was
       * built the six qualifications existed only as a list on one page. They
       * have their own routes now, and the hashes were doing real damage: a
       * menu item that lands you halfway down a page you have never seen is
       * disorienting, and it is what "every tab opens in the middle of the
       * page" turned out to be.
       *
       * A hash is right for a section of the page you are already on. It is
       * wrong for a destination.
       */
      {
        id: "nav-edu-certifications",
        labelKey: "nav.group.certifications",
        items: [
          { labelKey: "nav.certCpt", href: "/education/courses/certified-personal-trainer" },
          {
            labelKey: "nav.certStrength",
            href: "/education/courses/strength-and-conditioning-specialist",
          },
          {
            labelKey: "nav.certNutrition",
            href: "/education/courses/sports-nutrition-specialist",
          },
        ],
      },
      {
        id: "nav-edu-specialised",
        labelKey: "nav.group.specialised",
        items: [
          {
            labelKey: "nav.courseRehab",
            href: "/education/courses/sports-injury-prevention-and-rehabilitation",
          },
          {
            labelKey: "nav.coursePilates",
            href: "/education/courses/professional-pilates-instructor",
          },
          { labelKey: "nav.courseWeightlifting", href: "/education/courses/olympic-weightlifting" },
          { labelKey: "nav.courseCeu", href: "/education/categories/cpd" },
        ],
      },
      {
        id: "nav-edu-browse",
        labelKey: "nav.group.browse",
        items: [
          { labelKey: "nav.educationAll", href: "/education", feature: "education" },
          { labelKey: "nav.specialisations", href: "/specialisations" },
          { labelKey: "nav.blog", href: "/blog", feature: "content" },
        ],
      },
    ],
  },
  { labelKey: "nav.coaches", href: "/coaches", feature: "coaches" },
  {
    labelKey: "nav.shop",
    href: "/shop",
    feature: "shop",
    groups: [
      {
        id: "nav-shop-browse",
        labelKey: "nav.group.browse",
        items: [
          { labelKey: "nav.shopAll", href: "/shop", feature: "shop" },
          { labelKey: "nav.brands", href: "/shop/brands", feature: "shop" },
          { labelKey: "nav.sports", href: "/sports", feature: "sports" },
        ],
      },
    ],
  },
  { labelKey: "nav.careers", href: "/careers" },
  { labelKey: "nav.contact", href: "/contact" },
];

export const accountNav: readonly NavItem[] = [
  { labelKey: "account.overview", href: "/account" },
  { labelKey: "account.orders", href: "/account/orders" },
  { labelKey: "account.rentals", href: "/account/rentals" },
  { labelKey: "account.enrolments", href: "/account/enrolments" },
  { labelKey: "account.bookings", href: "/account/bookings" },
  { labelKey: "account.reviews", href: "/account/reviews" },
  { labelKey: "account.addresses", href: "/account/addresses" },
  { labelKey: "account.preferences", href: "/account/preferences" },
];

export const footerNav: readonly NavItem[] = [
  { labelKey: "nav.contact", href: "/contact" },
  { labelKey: "site.search", href: "/search", feature: "search" },
  { labelKey: "site.cart", href: "/cart", feature: "cart" },
  { labelKey: "nav.quotations", href: "/quotations", feature: "quotations" },
];

/** The documents that belong in a footer rather than a menu. */
export const legalNav: readonly NavItem[] = [
  { labelKey: "nav.privacy", href: "/privacy" },
  { labelKey: "nav.terms", href: "/terms" },
];
