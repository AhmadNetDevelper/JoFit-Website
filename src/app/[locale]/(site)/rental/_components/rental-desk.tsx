import Link from "next/link";

import { buttonClasses } from "@/components/ui";

/**
 * THE RENTAL DESK — the group-hire invitation a rental page ends its content
 * with, just above the site's closing help band.
 *
 * A club, a school or an event hires by the dozen and by the week, and that is
 * a conversation with the desk rather than a cart. So this is a framed white
 * panel on the band it sits in: an icon well, the question, one line, and the
 * way to the contact page, on the canvas so it reads apart from the white
 * cards above it. Light on purpose — the `HelpBand` directly below is
 * the page's coloured close, and two coloured panels in a row would compete.
 *
 * Takes finished strings, so each rental page keeps its own wording.
 */
export function RentalDesk({
  id,
  title,
  body,
  action,
  href,
  flush = false,
}: {
  id: string;
  title: string;
  body: string;
  action: string;
  href: string;
  /** No top margin, for when the desk is the first thing in its band. */
  flush?: boolean;
}) {
  return (
    <div className={`${flush ? "" : "mt-14"} flex flex-col items-start gap-6 rounded-3xl border border-line bg-canvas p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between`}>
      <div className="flex items-start gap-5">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-primary ring-1 ring-primary/15"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
            <circle cx="17" cy="9.5" r="2.4" />
            <path d="M15.6 14.8c2.4-.3 4.3 1.2 4.9 4" />
          </svg>
        </span>
        <div className="max-w-2xl">
          <h2 id={id} className="text-[1.3rem] leading-snug sm:text-[1.45rem]">
            {title}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-body">{body}</p>
        </div>
      </div>
      <Link href={href} className={buttonClasses({ variant: "outline", size: "lg" })}>
        {action}
      </Link>
    </div>
  );
}
