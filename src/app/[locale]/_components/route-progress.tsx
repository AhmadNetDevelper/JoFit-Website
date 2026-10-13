"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * THE BAR THAT SAYS SOMETHING IS COMING.
 *
 * In the App Router a server-rendered page stays on screen until the next one
 * is ready. That is the right behaviour — no blank flash, no layout thrash —
 * but it means a click can look ignored for the second the server takes, and on
 * this site a page is five or six bands of real data.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT `loading.tsx`.
 *
 * That is the obvious answer and it is wrong here, for a reason already written
 * into this codebase: a `loading.tsx` applies to its whole segment AND every
 * child route, and it makes Next start streaming immediately — so the HTTP
 * status is committed as 200 before a child page can call `notFound()`. Every
 * missing product, coach, course and rental item would become a soft 404 that
 * search engines index. A skeleton is not worth breaking the status code of a
 * catalogue.
 *
 * So the feedback lives beside the router instead of inside a segment: nothing
 * about the response changes, and the indicator is the same on every route.
 *
 * ---------------------------------------------------------------------------
 * HOW IT KNOWS.
 *
 * There is no public "navigation started" event. What there is:
 *
 *   START — a delegated click on an internal link. Delegated, not per-link, so
 *           no component has to opt in and a link added later is covered.
 *   END   — `usePathname()` / `useSearchParams()` change, which only happens
 *           once the new route has actually rendered.
 *
 * DELAY exists because the fast case is the common one. On a warm route the
 * navigation finishes in under a tenth of a second, and a bar that flashes for
 * 80ms reads as a glitch rather than as progress. Nothing is shown until the
 * navigation has been slow enough to be worth mentioning.
 *
 * The width is driven by CSS, not by a timer per frame: the bar eases toward
 * 90% on its own and is snapped to 100% when the route lands. Progress is being
 * estimated either way — a real percentage does not exist — and an animation
 * the compositor owns costs nothing, where a `setInterval` writing `style.width`
 * competes with the very render it is reporting on.
 */
const DELAY_MS = 160;
const DONE_MS = 260;

export function RouteProgress({ label }: { label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);
    startTimer.current = null;
    doneTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      /* Let the browser have the clicks that are not a same-tab navigation:
         modified clicks open a new tab, and a non-primary button is not a
         navigation at all. */
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin) return;

      /* Same page, different hash — the browser scrolls, nothing loads, and a
         progress bar for that is a lie. Same URL entirely is also not a
         navigation. */
      const here = window.location;
      if (next.pathname === here.pathname && next.search === here.search) return;

      clearTimers();
      startTimer.current = setTimeout(() => setState("running"), DELAY_MS);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [clearTimers]);

  /*
   * The route landed. This effect is also what fires on first mount, which is
   * why it only does anything when a run is in flight — otherwise every cold
   * load would flash a completion it never started.
   */
  useEffect(() => {
    if (startTimer.current) {
      clearTimeout(startTimer.current);
      startTimer.current = null;
    }
    setState((current) => {
      if (current !== "running") return "idle";
      doneTimer.current = setTimeout(() => setState("idle"), DONE_MS);
      return "done";
    });
  }, [pathname, searchParams]);

  if (state === "idle") return null;

  return (
    <div
      className="route-progress"
      data-state={state}
      role="status"
      aria-live="polite"
      /* The bar is decoration; the WORD is the announcement. A screen reader
         gets "Loading" once, not a percentage ticking. */
      aria-label={label}
    >
      <span className="route-progress-bar" />
    </div>
  );
}
