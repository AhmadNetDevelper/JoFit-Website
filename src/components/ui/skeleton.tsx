import type { ReactNode } from "react";

import { VisuallyHidden } from "./visually-hidden";

/**
 * SKELETONS FOR THE ROUTE-LEVEL `loading.tsx` FILES — the formal design.
 *
 * Every storefront page fetches on the server, so without a boundary a
 * navigation is a blank wait. These pieces draw each page's real silhouette in
 * the new language — the deep `PageHero` band, the filter panel rising over
 * its foot, rounded cards on the canvas — so nothing jumps when the page
 * streams in.
 *
 * All server-safe: no state, no effects, no translations. Every offset is
 * logical, so RTL mirrors for free. The header is in the page flow now, so no
 * skeleton clears it.
 */

const TONE = {
  light: "bg-line",
  muted: "bg-canvas",
  dark: "bg-white/10",
} as const;

export function Skeleton({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: keyof typeof TONE;
}) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg motion-reduce:animate-none ${TONE[tone]} ${className}`} />;
}

/**
 * The live region every loading screen sits in. `band` opts it out of the
 * layout's measure, for pages built from full-bleed bands.
 */
export function SkeletonPage({
  children,
  band = true,
  label = "Loading…",
}: {
  children: ReactNode;
  band?: boolean;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" data-band={band ? "" : undefined}>
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </div>
  );
}

/* The same surface `PageHero` paints, so the band does not change colour when
   the page streams in. */
const HERO_BAND = "relative isolate overflow-hidden bg-deep";
const PAGE_MEASURE = "mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8";

/** Breadcrumb, eyebrow, a two-line title and a lead — `PageHero`'s text block. */
export function SkeletonHeroText({ breadcrumb = true }: { breadcrumb?: boolean }) {
  return (
    <>
      {breadcrumb ? <Skeleton tone="dark" className="mb-7 h-3.5 w-40" /> : null}
      <Skeleton tone="dark" className="mb-5 h-3.5 w-36" />
      <Skeleton tone="dark" className="h-10 w-[min(100%,34rem)] sm:h-12 lg:h-14" />
      <Skeleton tone="dark" className="mt-3 h-10 w-[min(80%,24rem)] sm:h-12 lg:h-14" />
      <Skeleton tone="dark" className="mt-7 h-4 w-[min(100%,40rem)]" />
      <Skeleton tone="dark" className="mt-3 h-4 w-[min(85%,32rem)]" />
    </>
  );
}

/** The listing hero: text block, then (optionally) the facts strip. */
export function SkeletonHero({ stats = true }: { stats?: boolean }) {
  return (
    <section className={HERO_BAND}>
      <div className={`${PAGE_MEASURE} py-14 sm:py-16 lg:py-24`}>
        <SkeletonHeroText />
        {stats ? (
          <ul className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="bg-deep/60 px-5 py-4">
                <Skeleton tone="dark" className="h-3 w-16" />
                <Skeleton tone="dark" className="mt-2.5 h-6 w-10" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/** A deep band of any shape, for heroes that are not the listing hero. */
export function SkeletonDarkBand({
  className = "",
  innerClassName = "",
  children,
}: {
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${HERO_BAND} ${className}`}>
      <div className={`${PAGE_MEASURE} ${innerClassName}`}>{children}</div>
    </section>
  );
}

/** The filter panel rising over the foot of a listing hero. */
export function SkeletonFilterBar({ rows = 2 }: { rows?: number }) {
  return (
    <div className="bg-canvas pb-2">
      <div className={PAGE_MEASURE}>
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-12 min-w-0 flex-1 rounded-full" />
            <Skeleton className="h-12 w-28 shrink-0 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: rows }, (_, row) => (
              <div key={row} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Skeleton className="h-3.5 w-20 shrink-0" />
                {Array.from({ length: 5 }, (_, chip) => (
                  <Skeleton key={chip} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

const MEDIA = {
  "4/3": "aspect-[16/10]",
  "3/2": "aspect-[16/10]",
  none: "",
} as const;

/** One catalogue card: framed cover, chips, title, summary, footer. */
export function SkeletonCard({ media = "4/3" }: { media?: keyof typeof MEDIA }) {
  return (
    <div className="flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft">
      {media !== "none" ? <Skeleton tone="muted" className={`w-full rounded-2xl ${MEDIA[media]}`} /> : null}
      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        {media === "none" ? <Skeleton tone="muted" className="mb-5 size-14 rounded-full" /> : null}
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-5 w-3/4" />
        <Skeleton className="mt-3 h-3.5 w-full" />
        <Skeleton className="mt-2 h-3.5 w-2/3" />
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** The three-up card grid inside a canvas band. */
export function SkeletonCardGrid({
  count = 6,
  media = "4/3",
  band = true,
}: {
  count?: number;
  media?: keyof typeof MEDIA;
  band?: boolean;
}) {
  const grid = (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex">
          <SkeletonCard media={media} />
        </li>
      ))}
    </ul>
  );

  if (!band) return grid;

  return (
    <section className="bg-canvas py-12 lg:py-16">
      <div className={PAGE_MEASURE}>{grid}</div>
    </section>
  );
}

/** A band heading: eyebrow, title and a lead line — `SectionHead`. */
export function SkeletonHeading({ lead = true }: { lead?: boolean }) {
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="mt-4 h-8 w-[min(100%,22rem)] sm:h-10" />
      {lead ? <Skeleton className="mt-5 h-4 w-[min(100%,30rem)]" /> : null}
    </div>
  );
}

/**
 * A detail page: the deep hero with its facts card in the end column, then the
 * two-column body.
 */
export function SkeletonDetail() {
  return (
    <>
      <section className={HERO_BAND}>
        <div className={`${PAGE_MEASURE} grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:py-24`}>
          <div>
            <SkeletonHeroText />
          </div>
          <div className="rounded-3xl bg-white p-4">
            <Skeleton tone="muted" className="aspect-[16/10] w-full rounded-2xl" />
            <div className="mt-4 space-y-3 px-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))}
              <Skeleton className="mt-4 h-13 w-full rounded-full" />
            </div>
          </div>
        </div>
      </section>
      <SkeletonAbout />
    </>
  );
}

/** A four-up facts strip, drawn as `HeroFacts`. */
export function SkeletonFacts() {
  return (
    <section className={`${HERO_BAND} pb-12`}>
      <div className={PAGE_MEASURE}>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="bg-deep/60 px-5 py-4">
              <Skeleton tone="dark" className="h-3 w-20" />
              <Skeleton tone="dark" className="mt-2.5 h-5 w-24" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Long copy with an aside, the body of every detail page. */
export function SkeletonAbout() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className={`grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16 ${PAGE_MEASURE}`}>
        <div>
          <SkeletonHeading lead={false} />
          <div className="mt-6 space-y-3">
            {["w-full", "w-full", "w-11/12", "w-full", "w-4/5", "w-2/3"].map((width, index) => (
              <Skeleton key={index} className={`h-4 ${width}`} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton tone="muted" className="h-40 w-full rounded-3xl border border-line" />
          <Skeleton tone="muted" className="h-28 w-full rounded-3xl border border-line" />
        </div>
      </div>
    </section>
  );
}

/**
 * The portals (account, coach, employer): the deep greeting band, then the
 * canvas with the tab rail and a body the caller fills.
 */
export function SkeletonPortal({ children }: { children: ReactNode }) {
  return (
    <>
      <SkeletonDarkBand innerClassName="py-12 lg:py-14">
        <SkeletonHeroText />
      </SkeletonDarkBand>

      {/* The shell's canvas band: a tab strip above the content, and from
          `xl` a rail card beside it (`PortalShell`'s own grid). */}
      <section className="bg-canvas">
        <div className={`${PAGE_MEASURE} py-8 sm:py-10 xl:py-14`}>
          <div className="xl:grid xl:grid-cols-[15.5rem_minmax(0,1fr)] xl:items-start xl:gap-10">
            <div className="flex gap-2 overflow-hidden sm:flex-wrap xl:flex-col xl:flex-nowrap xl:rounded-3xl xl:border xl:border-line xl:bg-surface xl:p-3 xl:shadow-soft">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-24 shrink-0 rounded-full xl:h-11 xl:w-full" />
              ))}
            </div>
            <div className="mt-8 min-w-0 xl:mt-0">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}

/** A panel of placeholder lines, for portal and checkout columns. */
export function SkeletonPanel({ lines = 3, muted = false }: { lines?: number; muted?: boolean }) {
  return (
    <div className={`rounded-3xl border border-line p-6 shadow-soft sm:p-7 ${muted ? "bg-canvas" : "bg-surface"}`}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={`h-4 ${index % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** A plain list page: a title, chips and a stack of rows. */
export function SkeletonPlainList({ rows = 5, chips = true }: { rows?: number; chips?: boolean }) {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      {chips ? (
        <div className="mb-6 flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : null}
      <ul className="grid gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3.5 w-full" />
            <Skeleton className="mt-3 h-3 w-32" />
          </li>
        ))}
      </ul>
    </>
  );
}
