"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties } from "react";

import { buttonClasses } from "@/components/ui/button";

import { AccountMenuList, type AccountMenuData } from "./account-menu";
import type { NavNode } from "./site-nav";

export interface HeaderLink {
  href: string;
  label: string;
}

/**
 * The small-screen menu — the header's only stateful part.
 *
 * Below `lg` the contact strip folds away and the navigation will not fit on
 * one row, so everything that is not the mark, the cart and the language goes
 * behind this button: the navigation, search, sign-in and the primary action.
 *
 * It is the one client leaf in the header, and it receives finished strings —
 * no dictionary crosses the boundary for the sake of a dozen words.
 *
 * The panel is rendered only while open rather than hidden with a class, so
 * its links are not in the tab order behind a closed menu. `Escape` closes it,
 * and so does navigating, which React would not do on its own because the
 * layout — and therefore this component — survives a route change.
 *
 */
export function SiteHeaderMenu({
  links,
  openLabel,
  closeLabel,
  search,
  accountMenu,
  cta,
}: {
  links: readonly NavNode[];
  openLabel: string;
  closeLabel: string;
  search: HeaderLink;
  /** The account menu, laid out inline; see `AccountMenu`. */
  accountMenu: AccountMenuData;
  cta: HeaderLink;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  /*
   * The cascade counter.
   *
   * Every row in the sheet carries its position as `--i`, and the CSS turns
   * that into `animation-delay`. The count has to run across the WHOLE tree in
   * render order — a top-level link, then its headings and children, then the
   * next top-level link — so a per-branch index would restart at each group and
   * the sheet would open in several overlapping waves instead of one.
   *
   * `animation-delay` is the right tool here, unlike in the logo loop: the
   * panel is unmounted when closed, so each open is a fresh mount and the
   * animation plays exactly once. There is no second iteration for the delay
   * to be ignored on.
   */
  let row = 0;
  const step = (): CSSProperties => ({ "--i": row++ }) as CSSProperties;

  /*
   * Every link closes the panel on the way out.
   *
   * The layout — and therefore this component — survives a route change, so
   * without this the menu would still be open over the page it just navigated
   * to. Closing on the click rather than in an effect keyed to the pathname is
   * the difference between one render and a second, cascading one.
   */
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((value) => !value)}
        className="-me-1 inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-primary-05 lg:hidden"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-surface px-5 pt-3 pb-6 shadow-lift lg:hidden"
        >
          <ul className="flex flex-col divide-y divide-line">
            {/*
              The tree is rendered FLAT-BUT-INDENTED, not as accordions.

              On the desktop bar a dropdown earns its complexity: the panel
              would otherwise push the page down. In a sheet that already
              scrolls, a disclosure only adds a tap between the visitor and the
              link they can see the heading for. So every destination is
              reachable in one tap, and the group headings do the sorting that
              the panels do above.

              Without this the four pages that live only inside a panel --
              brands, specialisations, nutrition, the blog -- would have been
              unreachable on a phone, which is most of the traffic.
            */}
            {links.map((link) => (
              <li key={link.href} className="py-2">
                <Link
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
                  onClick={close}
                  style={step()}
                  className="sheet-row flex items-center py-2.5 font-heading text-[17px] font-semibold text-ink aria-[current=page]:text-primary"
                >
                  {link.label}
                </Link>

                {link.columns?.map((column) => (
                  <div key={column.id} className="mb-2 border-s-2 border-accent/50 ps-4">
                    <p
                      style={step()}
                      className="sheet-row pt-2 pb-1 text-[12px] font-semibold text-body/65"
                    >
                      {column.label}
                    </p>
                    <ul>
                      {column.links.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={pathname === child.href ? "page" : undefined}
                            onClick={close}
                            style={step()}
                            className="sheet-row flex py-1.5 text-[15px] text-ink aria-[current=page]:font-semibold aria-[current=page]:text-primary"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </li>
            ))}
          </ul>

          <div
            style={step()}
            className="sheet-row mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-[15px]"
          >
            <Link href={search.href} onClick={close} className="font-medium text-ink hover:text-primary">
              {search.label}
            </Link>
          </div>

          <div style={step()} className="sheet-row mt-4 border-t border-line pt-4">
            <AccountMenuList data={accountMenu} onNavigate={close} />
          </div>

          {/* Full width, because a button that stops two thirds of the way
              across a phone reads as one more list item rather than the thing
              the sheet is steering towards. */}
          <Link
            href={cta.href}
            onClick={close}
            style={step()}
            className={buttonClasses({ size: "lg", className: "sheet-row mt-5 w-full" })}
          >
            {cta.label}
          </Link>
        </div>
      ) : null}
    </>
  );
}
