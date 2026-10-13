import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One of the desk's figures, and a way into the list it counts: an icon well,
 * the number in the heading face, a bare noun under it (right in Arabic for
 * every number, where "{n} jobs" would not be).
 *
 * `highlight` is for the figure that means someone is waiting — new
 * applicants — and takes the deep green and gold while it is above zero.
 * Every number is counted from the company's own data.
 */
export function FigureTile({
  href,
  icon,
  value,
  label,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  /** Already formatted. */
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative isolate flex h-full w-full flex-col overflow-hidden rounded-3xl p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 sm:p-6 ${
        highlight
          ? "bg-deep text-white shadow-lift"
          : "border border-line bg-surface shadow-soft hover:border-primary/25 hover:shadow-lift"
      }`}
    >
      {highlight ? <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" /> : null}
      <span
        aria-hidden="true"
        className={`grid size-10 place-items-center rounded-full ring-1 ${
          highlight ? "bg-white/10 text-accent ring-white/15" : "bg-primary-05 text-primary ring-primary/15"
        }`}
      >
        {icon}
      </span>
      <span className={`mt-5 block font-heading text-[2.1rem] leading-none font-bold ${highlight ? "text-accent" : "text-ink"}`}>
        <span dir="ltr">{value}</span>
      </span>
      <span className={`mt-2 block text-[13px] leading-snug ${highlight ? "text-white/70" : "text-body group-hover:text-primary-dark"}`}>
        {label}
      </span>
    </Link>
  );
}
