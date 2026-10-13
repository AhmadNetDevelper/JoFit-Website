"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * `<main>`, AND THE ENTRANCE EVERY PAGE GETS.
 *
 * A route change in the App Router is an instant swap: the header and footer
 * stay, and everything between them is replaced between two frames. On a site
 * whose pages are five or six full-bleed bands that reads as a flicker rather
 * than as a move.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT THE VIEW TRANSITIONS API.
 *
 * That is the right long-term answer and it is not available here yet:
 * `experimental.viewTransition` is not in this Next's config type (16.3.5) and
 * `unstable_ViewTransition` is not exported by this React (19.2.8, stable — it
 * ships on canary). Both were tried and both fail to compile. When they land,
 * this component is the place to swap the mechanism; the CSS below already
 * describes the movement.
 *
 * So the entrance is done with the tool that does exist: the element is KEYED
 * BY PATHNAME, React remounts it on every navigation, and a CSS animation plays
 * on mount. No timers, no state, no transition library.
 *
 * ---------------------------------------------------------------------------
 * WHY THE KEY IS ON <main> AND NOT ON A WRAPPER INSIDE IT.
 *
 * The layout gives every page its measure through
 * `[&>*:not([data-band])]:max-w-page` — a rule about the DIRECT CHILDREN of
 * `<main>`. Wrapping the children in an animated div would make every band a
 * grandchild: undesigned pages would silently lose their measure, and the
 * wrapper itself would collect the padding meant for them. `display: contents`
 * does not save it either, because then the wrapper has no box for that
 * max-width to land on.
 *
 * `<main>` has no such rule pointed at it, so the animation goes there and the
 * parent/child relationship every page depends on is untouched.
 *
 * It is a Client Component only so it can read the pathname. `children` are
 * server-rendered and pass straight through — nothing about the page below
 * becomes client code.
 */
export function PageMain({ className, children }: { className: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} id="main-content" className={className} data-page-enter>
      {children}
    </main>
  );
}
