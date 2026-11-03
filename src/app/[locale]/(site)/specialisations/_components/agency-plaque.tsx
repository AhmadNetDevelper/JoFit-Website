import Image from "next/image";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { Rosette } from "@/components/ui";

/**
 * THE AGENCY PLAQUE — the hero's end column on `/specialisations`.
 *
 * The one claim this business is built on, set the way an institution sets it:
 * the two marks side by side — JoFit's and the council's seal — joined by a
 * gold rule, on a round paper seal with a double gold frame and the rosette as
 * a watermark. An ILLUSTRATION of the agency, not a document: it carries no
 * number, no signature and no date, because none was supplied.
 *
 * Every line on it is the page's own verified copy, passed in finished.
 */
export function AgencyPlaque({
  kicker,
  title,
  territory,
  sealAlt,
}: {
  kicker: string;
  title: string;
  territory: string;
  sealAlt: string;
}) {
  return (
    <figure className="relative mx-auto w-full max-w-[25rem]">
      <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-full bg-accent/15 rtl:-translate-x-3" />
      <div className="relative isolate grid aspect-square place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-surface)_94%,var(--color-accent))] text-center text-ink shadow-lift ring-1 ring-accent/30">
        <span
          aria-hidden="true"
          className="absolute start-1/2 top-1/2 -z-10 size-[20rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.16] rtl:translate-x-1/2"
        >
          <Rosette className="size-full" />
        </span>
        <span aria-hidden="true" className="absolute inset-3 rounded-full border-2 border-accent/45" />
        <span aria-hidden="true" className="absolute inset-[1.15rem] rounded-full border border-accent/30" />

        <div className="flex w-[70%] flex-col items-center">
          <div className="flex items-center justify-center gap-2.5">
            <span className="grid size-[4.25rem] shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-accent/60 ring-offset-2 ring-offset-transparent">
              <JofitLogo variant="mark" className="h-8 w-auto" />
            </span>
            <span aria-hidden="true" className="flex items-center gap-1">
              <span className="h-px w-3 bg-accent/70" />
              <span className="size-1.5 rotate-45 bg-accent" />
              <span className="h-px w-3 bg-accent/70" />
            </span>
            <span className="grid size-[4.25rem] shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-accent/60 ring-offset-2 ring-offset-transparent">
              <Image src="/images/partners/ncsf-seal.png" alt={sealAlt} width={96} height={96} className="size-12" />
            </span>
          </div>

          <p className="mt-5 text-[12.5px] font-semibold text-accent-strong">{kicker}</p>
          <p className="mt-1.5 font-heading text-[1.35rem] leading-tight font-bold text-ink">{title}</p>

          <div aria-hidden="true" className="mt-4 w-full space-y-1.5">
            <span className="mx-auto block h-px w-3/4 bg-ink/15" />
            <span className="mx-auto block h-px w-1/2 bg-ink/10" />
          </div>

          <figcaption className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] leading-relaxed text-body">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-accent-strong" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
            {territory}
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
