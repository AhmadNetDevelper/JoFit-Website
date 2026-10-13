"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/**
 * THE DESKTOP NAVIGATION, WITH ITS DROPDOWN PANELS.
 *
 * Resolved data comes in from the server — hrefs already carry the locale,
 * labels are already translated — so neither the dictionary nor the navigation
 * config is shipped to the browser. This component owns one thing: which panel
 * is open.
 *
 * Below `lg` it is not rendered at all; `SiteHeaderMenu` takes over and shows
 * the same tree as one indented list in a sheet.
 *
 * ---------------------------------------------------------------------------
 * WHY THE LABEL AND THE CHEVRON ARE TWO CONTROLS.
 *
 * "Shop" is a real page AND the handle for a panel, and one element cannot
 * honestly be both. A link that also toggles has no correct accessible name:
 * announce it as a link and its menu is invisible to a screen-reader user;
 * announce it as a button and the page behind it becomes unreachable without
 * a mouse. So the word is a link to the page, and the chevron beside it is a
 * button that owns `aria-expanded` and `aria-controls`.
 *
 * Pointer users never notice, because hovering anywhere on the pair opens the
 * panel. The split exists for everyone else.
 *
 * ---------------------------------------------------------------------------
 * WHY HOVER IS NOT THE ONLY WAY IN.
 *
 * Hover is unavailable on touch and to anyone navigating by keyboard, and it
 * is unreliable for people whose pointer control is imprecise — the panel has
 * to be crossed without slipping off its edge. Hover is therefore an
 * accelerator layered on top of a click/Enter toggle that works on its own.
 *
 * Closing is deliberately slower than opening: `CLOSE_DELAY` keeps the panel up
 * for a moment after the pointer leaves, so travelling diagonally from the
 * trigger to the far corner of the panel does not dismiss it mid-journey.
 */
const CLOSE_DELAY = 180;

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

export interface NavColumn {
  readonly id: string;
  readonly label: string;
  readonly links: readonly NavLink[];
}

export interface NavNode extends NavLink {
  readonly columns?: readonly NavColumn[];
}

/** Marks the header's measure row — the box a panel may not escape. */
export const MEASURE_ATTRIBUTE = "data-hdr-measure";

function Chevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-data-[open]/nav:rotate-180"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ONE MENU ITEM.
 *
 * Its own component so each panel can hold its own ref and run its own
 * measurement — hooks cannot live inside a `.map()`.
 */
function NavItem({
  item,
  open,
  onOpen,
  onClose,
  onToggle,
  expandLabel,
  panelId,
}: {
  readonly item: NavNode;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly onToggle: () => void;
  readonly expandLabel: string;
  readonly panelId: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasPanel = Boolean(item.columns?.length);
  const id = `${panelId}-${item.href}`;

  /*
   * KEEPING THE PANEL BOTH ANCHORED AND ON-SCREEN.
   *
   * The panel hangs from its own trigger, because a menu that opens somewhere
   * else is a menu you have to go looking for — the single-column "Shop" panel
   * was briefly anchored to the far edge of the measure and appeared to belong
   * to nothing. So the <li> is the containing block and the panel starts at
   * the trigger's reading edge.
   *
   * `w-max` is what makes that safe. An absolutely positioned box otherwise
   * shrink-to-fits inside its containing block, which for a 90px menu item
   * crushed three columns into 366px and made the headings overlap;
   * `width: max-content` opts out of that and sizes to the content.
   *
   * Sizing to content means it can now overrun the page, so once open it is
   * measured against the header's measure row and pulled back inside. The
   * correction is written to a custom property consumed by `translate`, NOT
   * `transform` — the entrance keyframe owns `transform`, and driving one
   * property from two places means whichever runs last silently wins.
   * `translate` and `transform` are separate properties and compose.
   *
   * A layout effect, so the shift lands in the same frame the panel becomes
   * visible; an ordinary effect paints it once in the wrong place first.
   */
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!open || !el) return;

    el.style.setProperty("--panel-shift", "0px");
    const row = el.closest(`[${MEASURE_ATTRIBUTE}]`);
    if (!row) return;

    const panel = el.getBoundingClientRect();
    const bounds = row.getBoundingClientRect();

    /* Physical edges, not logical: overflow is a fact about the viewport and
       the same arithmetic holds in both writing directions. */
    let shift = 0;
    if (panel.right > bounds.right) shift = bounds.right - panel.right;
    else if (panel.left < bounds.left) shift = bounds.left - panel.left;

    el.style.setProperty("--panel-shift", `${Math.round(shift)}px`);
  }, [open]);

  return (
    <li
      className="group/nav relative flex items-stretch"
      data-open={open ? "" : undefined}
      onMouseEnter={hasPanel ? onOpen : undefined}
      onMouseLeave={hasPanel ? onClose : undefined}
    >
      <Link
        href={item.href}
        className={
          "relative flex h-20 items-center ps-3 text-[15px] font-medium whitespace-nowrap text-ink transition-colors hover:text-primary " +
          /* The gold underline: grows from the centre on hover and while the
             item's panel is open. */
          "after:absolute after:inset-x-3 after:bottom-6 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 group-data-[open]/nav:text-primary group-data-[open]/nav:after:scale-x-100 " +
          /* An item without a chevron keeps both gutters; one with a chevron
             hands its trailing gutter to the button, so the pair reads as a
             single control and the words next to it do not close up. */
          (hasPanel ? "pe-1" : "pe-3")
        }
      >
        {item.label}
      </Link>

      {hasPanel ? (
        <>
          <button
            type="button"
            data-trigger={item.href}
            aria-expanded={open}
            aria-controls={id}
            aria-label={expandLabel.replace("{label}", item.label)}
            onClick={onToggle}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return;
              /* Down opens and steps into the panel, which is what the arrow
                 means on a disclosure that reveals a list. */
              event.preventDefault();
              onOpen();
              requestAnimationFrame(() => {
                document.getElementById(id)?.querySelector<HTMLAnchorElement>("a")?.focus();
              });
            }}
            className="flex h-20 cursor-pointer items-center pe-3 text-ink/55 transition-colors hover:text-primary group-data-[open]/nav:text-primary"
          >
            <Chevron />
          </button>

          <div
            id={id}
            ref={panelRef}
            hidden={!open}
            data-open={open ? "" : undefined}
            /* `top-full` is the foot of the 80px nav row, so the sheet hangs
               off the bar rather than sitting over it. */
            className="nav-panel absolute top-full z-20 -mt-2 w-max rounded-3xl border border-line bg-surface p-7 shadow-lift"
            style={{ insetInlineStart: 0 }}
          >
            <div className="flex gap-9">
              {item.columns?.map((column) => (
                <div key={column.id} className="min-w-52">
                  <h3 id={`${id}-${column.id}`} className="font-sans text-[12.5px] font-semibold text-body/70">
                    {column.label}
                  </h3>
                  <div aria-hidden="true" className="mt-2 h-0.5 w-6 rounded-full bg-accent" />
                  <ul className="mt-3 space-y-0.5" aria-labelledby={`${id}-${column.id}`}>
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="-mx-3 block rounded-xl px-3 py-2 text-[14.5px] text-ink transition-colors hover:bg-primary-05 hover:text-primary-dark"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </li>
  );
}

export function SiteNav({
  items,
  ariaLabel,
  expandLabel,
}: {
  readonly items: readonly NavNode[];
  readonly ariaLabel: string;
  /** "Show {label} submenu" — the chevron's accessible name. */
  readonly expandLabel: string;
}) {
  const [openHref, setOpenHref] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const pathname = usePathname();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenHref(null), CLOSE_DELAY);
  }, [cancelClose]);

  /* A pending timer that fires after unmount would set state on a dead tree. */
  useEffect(() => cancelClose, [cancelClose]);

  /*
   * Navigating closes the panel. Without this the menu stays open on top of the
   * page the visitor just asked for — the click succeeds, the route changes,
   * and nothing tells this component the journey is over.
   *
   * Adjusted DURING RENDER, not in an effect. React's own guidance, and the
   * `react-hooks/set-state-in-effect` rule that enforces it here: an effect
   * that calls setState commits one render and immediately schedules another,
   * so the open panel is painted over the new page for a frame before it
   * disappears. Comparing against the previous value while rendering means the
   * stale state never reaches the screen.
   */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenHref(null);
  }

  useEffect(() => {
    if (!openHref) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenHref(null);
      /* Escape must land the focus somewhere deliberate, or it falls to
         <body> and the next Tab restarts from the top of the document. */
      navRef.current
        ?.querySelector<HTMLButtonElement>(`[data-trigger="${CSS.escape(openHref)}"]`)
        ?.focus();
    };

    /* `pointerdown`, not `click`: a click outside that lands on another
       control should close this panel before that control reacts. */
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenHref(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openHref]);

  /*
   * Tabbing past the last link in a panel closes it, the same way clicking
   * elsewhere does. `relatedTarget` is where focus is going; when it is
   * outside this nav, the visitor has left.
   */
  const onBlurCapture = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && navRef.current?.contains(next)) return;
    setOpenHref(null);
  };

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      /* Start-aligned, right after the logo's divider; the tools and the
         action sit at the far end of the bar. */
      className="hidden min-w-0 flex-1 justify-start lg:flex lg:h-20"
      onBlurCapture={onBlurCapture}
    >
      <ul className="flex h-20 items-stretch">
        {items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            open={openHref === item.href}
            panelId={panelId}
            expandLabel={expandLabel}
            onOpen={() => {
              cancelClose();
              setOpenHref(item.href);
            }}
            onClose={scheduleClose}
            onToggle={() => setOpenHref(openHref === item.href ? null : item.href)}
          />
        ))}
      </ul>
    </nav>
  );
}
