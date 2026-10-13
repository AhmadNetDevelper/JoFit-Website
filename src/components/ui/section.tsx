import type { ReactNode } from "react";

import { Container } from "./container";

/**
 * ONE BAND OF THE PAGE.
 *
 * The formal site alternates three surfaces and uses a fourth sparingly:
 *
 *   surface   white — most content
 *   muted     the faint green-grey canvas — the band after a white one
 *   deep      the theme's dark green with fine linework — once or twice a page,
 *             for the thing the page most wants read (the path to
 *             certification, the closing call to action)
 *   primary   the action green — reserved; nothing uses it by default
 *
 * `dark` is kept as a name for `deep`, for markup written before the redesign.
 *
 * A deep band names its own heading colour through `SectionHead tone="dark"`;
 * headings are coloured on the element, so a light colour inherited from the
 * band would lose (see `globals.css`).
 */
const TONES = {
  surface: "bg-surface",
  muted: "bg-canvas",
  deep: "relative isolate overflow-hidden bg-deep text-white/80",
  dark: "relative isolate overflow-hidden bg-deep text-white/80",
  primary: "bg-primary text-on-primary",
} as const;

export type SectionTone = keyof typeof TONES;

export function Section({
  id,
  labelledBy,
  tone = "surface",
  children,
  className = "",
  containerClassName = "",
}: {
  id?: string;
  labelledBy?: string;
  tone?: SectionTone;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const deep = tone === "deep" || tone === "dark";

  return (
    <section
      id={id}
      data-band
      aria-labelledby={labelledBy}
      className={`py-16 sm:py-20 lg:py-24 ${TONES[tone]} ${className}`}
    >
      {deep ? (
        <>
          <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.035]" />
          <span
            aria-hidden="true"
            className="absolute -top-40 start-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl rtl:translate-x-1/2"
          />
        </>
      ) : null}
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
