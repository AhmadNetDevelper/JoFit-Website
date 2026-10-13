import Link from "next/link";

import type { PageMeta } from "@/types";

/**
 * Numbered pages with Previous / Next either side — round page buttons (the
 * catalogue's), plus the two words, because on a phone "3" alone does not say
 * which way the list continues. Links, not buttons: every page of results has
 * its own address.
 */
export function Pagination({
  meta,
  hrefFor,
  number,
  labels,
}: {
  meta: PageMeta;
  hrefFor: (page: number) => string;
  number: (value: number) => string;
  labels: { readonly nav: string; readonly previous: string; readonly next: string };
}) {
  if (meta.totalPages <= 1) return null;
  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1);
  const idle = "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark";
  const step = `inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-semibold transition-colors ${idle}`;

  return (
    <nav aria-label={labels.nav} className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {meta.hasPreviousPage ? (
        <Link href={hrefFor(meta.page - 1)} rel="prev" className={step}>
          {labels.previous}
        </Link>
      ) : null}
      {pages.map((target) => {
        const current = target === meta.page;
        return (
          <Link
            key={target}
            href={hrefFor(target)}
            aria-current={current ? "page" : undefined}
            className={`inline-flex size-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${
              current ? "border-primary bg-primary text-on-primary" : idle
            }`}
          >
            <span dir="ltr">{number(target)}</span>
          </Link>
        );
      })}
      {meta.hasNextPage ? (
        <Link href={hrefFor(meta.page + 1)} rel="next" className={step}>
          {labels.next}
        </Link>
      ) : null}
    </nav>
  );
}
