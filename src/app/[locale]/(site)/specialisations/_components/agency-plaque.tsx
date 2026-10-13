import Image from "next/image";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { Rosette } from "@/components/ui";

/**
 * THE AGENCY PLAQUE — the hero's end column on `/specialisations`.
 *
 * The one claim this business is built on, set the way an institution sets it:
 * the two marks side by side — JoFit's and the council's seal — joined by a
 * gold rule, on paper with a double gold frame and the rosette as a watermark.
 * An ILLUSTRATION of the agency, not a document: it carries no number, no
 * signature and no date, because none was supplied.
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
    <figure className="relative mx-auto max-w-[25rem]">
      <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-[1.75rem] bg-accent/15 rtl:-translate-x-3" />
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[color-mix(in_srgb,var(--color-surface)_94%,var(--color-accent))] px-8 pt-10 pb-9 text-center text-ink shadow-lift ring-1 ring-accent/30">
        <span
          aria-hidden="true"
          className="absolute start-1/2 top-1/2 -z-10 size-[24rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.16] rtl:translate-x-1/2"
        >
          <Rosette className="size-full" />
        </span>
        <span aria-hidden="true" className="absolute inset-3 rounded-[1.25rem] border-2 border-accent/45" />
        <span aria-hidden="true" className="absolute inset-[1.15rem] rounded-2xl border border-accent/30" />

        <div className="flex items-center justify-center gap-4">
          <JofitLogo variant="mark" className="h-11 w-auto shrink-0" />
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <span className="h-px w-8 bg-accent/70" />
            <span className="size-1.5 rotate-45 bg-accent" />
            <span className="h-px w-8 bg-accent/70" />
          </span>
          <Image
            src="/images/partners/ncsf-seal.png"
            alt={sealAlt}
            width={96}
            height={96}
            className="size-16 shrink-0 drop-shadow-[0_6px_14px_rgb(0_0_0/0.18)]"
          />
        </div>

        <p className="mt-7 text-[13px] font-semibold text-accent-strong">{kicker}</p>
        <p className="mt-2 font-heading text-[1.5rem] leading-tight font-bold text-ink">{title}</p>

        <div aria-hidden="true" className="mx-auto mt-6 space-y-2">
          <span className="mx-auto block h-px w-3/4 bg-ink/15" />
          <span className="mx-auto block h-px w-1/2 bg-ink/10" />
        </div>

        <figcaption className="mt-5 text-[13.5px] leading-relaxed text-body">{territory}</figcaption>
      </div>
    </figure>
  );
}
