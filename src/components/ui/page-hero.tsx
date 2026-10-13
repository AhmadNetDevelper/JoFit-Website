import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "./container";
import { Rosette } from "./rosette";

export interface Crumb {
  readonly label: string;
  /** Absent on the last crumb: the page you are on is not a link. */
  readonly href?: string;
}

/**
 * THE INNER PAGE'S HERO — one design for every page below the home page.
 *
 * It replaces the old per-page heroes, each of which put a gym photograph under
 * a hand-mixed green wash. This is the theme's deep green, the certificate
 * linework at a whisper, the rosette turning slowly in the far corner, and a
 * gold hairline along the foot where the band meets the page.
 *
 * Breadcrumbs first, then the eyebrow, the page's one `<h1>`, the lead and any
 * actions. `aside` takes the end column on wide screens — a course's facts, a
 * contact card. `children` sit under the text, for a row of facts.
 *
 * The header is no longer floating, so nothing here has to clear it.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  breadcrumbLabel = "Breadcrumb",
  actions,
  aside,
  children,
  compact = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  breadcrumbs?: readonly Crumb[];
  /** The breadcrumb nav's accessible name, translated by the caller. */
  breadcrumbLabel?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  /** Less height, for utility pages — search, cart, account. */
  compact?: boolean;
}) {
  return (
    <section data-band className="relative isolate overflow-hidden bg-deep text-white/75">
      <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.035]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_-10%,color-mix(in_srgb,var(--color-primary)_45%,transparent),transparent_70%)] rtl:bg-[radial-gradient(60rem_30rem_at_15%_-10%,color-mix(in_srgb,var(--color-primary)_45%,transparent),transparent_70%)]"
      />
      <span aria-hidden="true" className="absolute -end-48 top-1/2 -z-10 size-[42rem] -translate-y-1/2 text-accent/[0.13] max-md:hidden">
        <Rosette className="spin-slow size-full" />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
      />

      <Container className={compact ? "py-12 lg:py-14" : "py-14 sm:py-16 lg:py-24"}>
        <div className={aside ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]" : ""}>
          <div className="max-w-3xl">
            {breadcrumbs?.length ? (
              <nav aria-label={breadcrumbLabel} className="mb-6">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/55">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
                      {index > 0 ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="text-white/30 rtl:-scale-x-100">
                          <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      ) : null}
                      {crumb.href ? (
                        <Link href={crumb.href} className="transition-colors hover:text-white">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span aria-current="page" className="text-white/85">
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            {eyebrow ? (
              <p className="eyebrow" data-tone="dark" data-enter style={{ ["--d" as string]: 0 }}>
                {eyebrow}
              </p>
            ) : null}

            <h1
              data-enter
              style={{ ["--d" as string]: 1 }}
              className={`mt-4 text-white ${compact ? "text-3xl sm:text-4xl" : "text-[2.25rem] leading-[1.12] sm:text-5xl lg:text-[3.35rem]"}`}
            >
              {title}
            </h1>

            {lead ? (
              <div data-enter style={{ ["--d" as string]: 2 }} className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-white/75 sm:text-lg">
                {lead}
              </div>
            ) : null}

            {actions ? (
              <div data-enter style={{ ["--d" as string]: 3 }} className="mt-8 flex flex-wrap items-center gap-3">
                {actions}
              </div>
            ) : null}

            {children ? (
              <div data-enter style={{ ["--d" as string]: 4 }} className="mt-10">
                {children}
              </div>
            ) : null}
          </div>

          {aside ? (
            <div data-enter="scale" style={{ ["--d" as string]: 2 }}>
              {aside}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/**
 * A row of short facts under a hero title — "4 modules", "Issued by NCSF".
 * Each is a label over a value, the label quiet, the value in the heading face.
 */
export function HeroFacts({ items }: { items: readonly { readonly label: string; readonly value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-deep/60 px-5 py-4 backdrop-blur-sm">
          <dt className="text-[12px] text-white/55">{item.label}</dt>
          <dd className="mt-1 font-heading text-lg font-semibold text-white">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
