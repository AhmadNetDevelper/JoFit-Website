"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * The strip the portal tabs sit in — a column in the `xl` rail, a row above
 * the content below it.
 *
 * On a phone ten tabs do not fit, so the row scrolls sideways — and it has to
 * SAY so: a hard edge through the middle of a word ("حجوزات ا") reads as a
 * rendering bug, not as more content. Each edge fades while there are tabs
 * hidden past it — the trailing one at first, both once the row has moved, the
 * leading one at the far end, none when everything shows — and the current tab
 * is scrolled into view on arrival, so someone on "Reviews" does not land with
 * their own tab off-screen. From `sm` the row wraps instead, and from `xl` it
 * is a column; neither overflows, so no fade is drawn there.
 *
 * Before hydration the CSS draws the trailing fade on phones (the row starts at
 * its start); once measured, the fade is set from what is actually hidden.
 */
const FADE = "2.5rem";

function fadeFor(hiddenBefore: boolean, hiddenAfter: boolean, rtl: boolean): string | undefined {
  if (!hiddenBefore && !hiddenAfter) return undefined;
  if (hiddenBefore && hiddenAfter) {
    return `linear-gradient(to right, transparent, black ${FADE}, black calc(100% - ${FADE}), transparent)`;
  }
  /* The gradient runs toward the edge that fades. */
  const towardEnd = rtl ? "to left" : "to right";
  const towardStart = rtl ? "to right" : "to left";
  return `linear-gradient(${hiddenAfter ? towardEnd : towardStart}, black calc(100% - ${FADE}), transparent)`;
}

export function TabRail({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [mask, setMask] = useState<string | undefined>();
  const [measured, setMeasured] = useState(false);

  /* scrollLeft runs negative in RTL, so the distance travelled is its magnitude. */
  const measure = useCallback(() => {
    const rail = ref.current;
    if (!rail) return;
    const overflow = rail.scrollWidth - rail.clientWidth;
    const travelled = Math.abs(rail.scrollLeft);
    const rtl = getComputedStyle(rail).direction === "rtl";
    setMask(overflow > 1 ? fadeFor(travelled > 1, travelled < overflow - 1, rtl) : undefined);
    setMeasured(true);
  }, []);

  useEffect(() => {
    const rail = ref.current;
    const current = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    /* Only while the strip is on screen: `scrollIntoView` would otherwise
       scroll the PAGE down to it as well. */
    if (rail && current && rail.scrollWidth > rail.clientWidth && rail.getBoundingClientRect().bottom <= window.innerHeight) {
      current.scrollIntoView({ block: "nearest", inline: "center" });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const style: CSSProperties | undefined = mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined;

  return (
    <nav
      ref={ref}
      aria-label={label}
      onScroll={measure}
      data-measured={measured || undefined}
      style={style}
      className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-2.5rem),transparent)] data-measured:[mask-image:none] sm:flex-wrap sm:overflow-visible sm:[mask-image:none] sm:rtl:[mask-image:none] xl:mx-0 xl:flex-col xl:gap-1 xl:px-0 xl:py-0"
    >
      {children}
    </nav>
  );
}
