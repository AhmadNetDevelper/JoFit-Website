import Link from "next/link";
import type { ReactNode } from "react";

import type { PageMeta } from "@/types";

/**
 * The list pages' controls. Links and GET forms only — the filter state lives
 * in the URL, so it survives a reload, can be shared with a colleague, and
 * Back undoes one filter. `page` is dropped whenever a filter changes, so
 * narrowing never lands on an empty page 3.
 */
export function FilterPill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  /** Already formatted. */
  count?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border ps-4 text-[13.5px] font-medium whitespace-nowrap transition-colors ${
        count !== undefined ? "pe-1.5" : "pe-4"
      } ${
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
      }`}
    >
      {label}
      {count !== undefined ? (
        <span
          dir="ltr"
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-bold ${
            active ? "bg-surface text-primary-dark" : "bg-canvas text-ink"
          }`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

/** The filter + search panel at the top of a list: a white card on the portal's canvas. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-8 rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6">{children}</div>;
}

export function Pager({
  meta,
  hrefFor,
  label,
  previousLabel,
  nextLabel,
  number,
}: {
  meta: PageMeta;
  hrefFor: (page: number) => string;
  label: string;
  previousLabel: string;
  nextLabel: string;
  number: (value: number) => string;
}) {
  if (meta.totalPages <= 1) return null;
  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1);
  const step =
    "inline-flex h-11 items-center justify-center rounded-full border border-line bg-surface px-5 text-[14px] font-semibold text-body transition-colors hover:border-primary/40 hover:text-primary-dark";
  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {meta.hasPreviousPage ? (
        <Link href={hrefFor(meta.page - 1)} rel="prev" className={step}>
          {previousLabel}
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
              current
                ? "border-primary bg-primary text-on-primary"
                : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
            }`}
          >
            <span dir="ltr">{number(target)}</span>
          </Link>
        );
      })}
      {meta.hasNextPage ? (
        <Link href={hrefFor(meta.page + 1)} rel="next" className={step}>
          {nextLabel}
        </Link>
      ) : null}
    </nav>
  );
}

/** A notice carried back by a redirect — only the words we wrote, never the URL's. */
export function readNotice<TKey extends string>(
  value: string | undefined,
  known: Readonly<Record<string, TKey>>,
): TKey | undefined {
  return value && Object.hasOwn(known, value) ? known[value] : undefined;
}
