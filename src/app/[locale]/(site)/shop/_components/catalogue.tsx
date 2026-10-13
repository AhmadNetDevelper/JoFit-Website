import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses, Rosette } from "@/components/ui";
import type { ProductSortKey } from "@/features/shop";
import type { Translate } from "@/i18n";

import { BagIcon, SlidersIcon, UsersIcon } from "./icons";

/*
 * THE CATALOGUE'S SMALL PARTS — shared by the shop index, a category, a brand.
 *
 * Four pages list products, and each used to carry its own copy of the sort
 * row, the page links and the empty state, drawn slightly differently. One
 * copy here, in the formal kit's language: pills for every control, the
 * current one filled in the brand green, and every control a LINK, so the
 * state lives in the URL (shareable, survives a reload, Back undoes one
 * change) and the pages stay Server Components.
 */

export const PRODUCT_SORTS: readonly { key: ProductSortKey; labelKey: Parameters<Translate>[0] }[] = [
  { key: "newest", labelKey: "shop.sortNewest" },
  { key: "price-asc", labelKey: "shop.sortPriceAsc" },
  { key: "price-desc", labelKey: "shop.sortPriceDesc" },
  { key: "rating-desc", labelKey: "shop.sortRating" },
];

/** A filter pill: outlined at rest, filled green when it is the current one. */
export function pillClasses(active: boolean) {
  return `inline-block rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-on-primary"
      : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
  }`;
}

/**
 * The sort row. Clicking the live sort clears it — the href passes `undefined`
 * deliberately rather than falling back to the current value, or the control
 * could be turned on but never off.
 */
export function SortLinks({
  t,
  current,
  hrefFor,
}: {
  t: Translate;
  current?: ProductSortKey;
  hrefFor: (next: ProductSortKey | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
        <SlidersIcon size={14} />
        {t("shop.sortLabel")}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {PRODUCT_SORTS.map((entry) => {
          const active = current === entry.key;
          return (
            <li key={entry.key}>
              <Link
                href={hrefFor(active ? undefined : entry.key)}
                aria-pressed={active}
                className={`inline-block rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                  active ? "bg-primary-10 text-primary-dark" : "text-body hover:bg-canvas hover:text-ink"
                }`}
              >
                {t(entry.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Page links: round pills, the current page filled. Nothing when one page. */
export function Pagination({
  label,
  current,
  total,
  hrefFor,
  format,
}: {
  label: string;
  current: number;
  total: number;
  hrefFor: (page: number) => string;
  /** The locale's number formatter. */
  format: (value: number) => string;
}) {
  if (total <= 1) return null;

  return (
    <nav aria-label={label} className="mt-12 flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, index) => index + 1).map((target) => {
        const active = target === current;
        return (
          <Link
            key={target}
            href={hrefFor(target)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex size-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
            }`}
          >
            <span dir="ltr">{format(target)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * An empty shelf. An invitation, not a shrug: it says what is true, and hands
 * over the control that does something about it.
 */
export function EmptyShelf({
  title,
  body,
  children,
  icon = <BagIcon size={24} />,
}: {
  title: string;
  body: string;
  /** The way out — one or two links. */
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-soft sm:py-16">
      <span
        aria-hidden="true"
        className="mx-auto grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
      >
        {icon}
      </span>
      <h2 className="mt-7 text-[1.4rem] leading-snug">{title}</h2>
      <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-body">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </div>
  );
}

/**
 * THE QUOTE NOTE: "Kitting out a club or a school?"
 *
 * The shop's second question after "is it in stock" is "what about thirty of
 * them", and the old pages answered it with a green band of its own after every
 * grid. The formal pages close on the site-wide help band instead, so this is a
 * NOTE at the foot of the last content band rather than a band of its own — a
 * framed row with one action, light on a light band and frosted on a deep one.
 */
export function QuoteNote({
  title,
  body,
  action,
  href,
  tone = "light",
  headingLevel = "h3",
}: {
  title: string;
  body: string;
  action: string;
  href: string;
  tone?: "light" | "dark";
  headingLevel?: "h2" | "h3";
}) {
  const dark = tone === "dark";
  const Heading = headingLevel;

  return (
    <div
      className={`relative isolate mt-14 flex flex-col items-start gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between ${
        dark ? "bg-white/[0.05] ring-1 ring-white/15 backdrop-blur-sm" : "border border-line bg-canvas"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute -end-60 -top-64 -z-10 size-[26rem] ${dark ? "text-accent/[0.12]" : "text-accent/20"}`}
      >
        <Rosette className="size-full" />
      </span>

      <div className="flex items-start gap-5">
        <span
          aria-hidden="true"
          className={`grid size-12 shrink-0 place-items-center rounded-full ring-1 ${
            dark ? "bg-white/[0.06] text-accent ring-accent/40" : "bg-surface text-primary ring-primary/15"
          }`}
        >
          <UsersIcon size={22} />
        </span>
        <div className="max-w-2xl">
          <Heading className={`text-[1.3rem] leading-snug ${dark ? "text-white" : ""}`}>{title}</Heading>
          <p className={`mt-1.5 text-[15px] leading-relaxed ${dark ? "text-white/70" : "text-body"}`}>{body}</p>
        </div>
      </div>

      <Link
        href={href}
        className={buttonClasses({ variant: dark ? "gold" : "primary", className: "max-lg:ms-[4.25rem]" })}
      >
        {action}
      </Link>
    </div>
  );
}
