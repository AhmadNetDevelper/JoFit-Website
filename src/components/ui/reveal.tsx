"use client";

import { animate } from "motion/mini";
import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * A BLOCK THAT RISES INTO PLACE WHEN IT IS SCROLLED TO — once, then still.
 *
 * The site's one scroll motion. An IntersectionObserver watches the block and
 * Motion's 2KB WAAPI `animate` plays the entrance off the main thread;
 * `stagger` plays it on each direct child in turn instead, for a row of cards.
 *
 * NO FLASH, BY CONSTRUCTION. The page is server-rendered and visible before
 * this runs. So a block that is already on screen when the page loads is left
 * alone — hiding it at hydration to animate it back would be a flicker — and
 * only blocks below the fold are hidden, in a layout effect, before the first
 * frame the reader could see them in. Nothing moves under
 * `prefers-reduced-motion`, and without JavaScript everything is simply there.
 *
 * NEVER STRANDED. A fast fling (the End key, a jump link, a flick on a phone)
 * can carry a block past the viewport between two frames, so the observer never
 * sees it intersect. Motion's `inView` only fires on intersection, and a block
 * skipped that way stayed invisible. So this plays when the block is seen OR
 * once it is found ABOVE the viewport — it has been passed, and must not be a
 * blank hole when the reader scrolls back.
 *
 * The children stay server components: this passes them through.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  as: Tag = "div",
  stagger = false,
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Animate each direct child in turn rather than the block as one. */
  stagger?: boolean;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    if (root.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    const targets = (stagger ? [...root.children] : [root]).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const settle = (element: HTMLElement) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    };
    for (const element of targets) {
      element.style.opacity = "0";
      element.style.transform = "translateY(28px)";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const passed = entry.boundingClientRect.bottom < 0;
        if (!entry.isIntersecting && !passed) return;
        observer.disconnect();

        /* Passed without being seen: no entrance, just be there. */
        if (passed) {
          targets.forEach(settle);
          return;
        }
        targets.forEach((element, index) => {
          try {
            void animate(
              element,
              { opacity: [0, 1], transform: ["translateY(28px)", "translateY(0px)"] },
              { duration: 0.75, delay: delay + index * 0.09, ease: EASE },
            ).then(
              () => settle(element),
              () => settle(element),
            );
          } catch {
            settle(element);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(root);

    /* Printing is a read of the whole page at once: nothing may be waiting. */
    const onPrint = () => {
      observer.disconnect();
      targets.forEach(settle);
    };
    window.addEventListener("beforeprint", onPrint);

    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", onPrint);
      targets.forEach(settle);
    };
  }, [stagger, delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
