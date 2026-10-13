import type { ReactNode } from "react";

/**
 * One of the dashboard's figures: an icon well, the number in the heading
 * face, and a bare noun under it (a figure beside a bare noun reads right in
 * Arabic for every number, where "{n} requests" would not).
 *
 * `highlight` is for the one figure that means someone is waiting — it takes
 * the deep green and gold, so the eye lands on it first. Every number here is
 * counted from the coach's own data.
 */
export function FigureTile({
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: ReactNode;
  /** Already formatted. */
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative isolate flex h-full w-full flex-col overflow-hidden rounded-3xl p-5 sm:p-6 ${
        highlight ? "bg-deep text-white shadow-lift" : "border border-line bg-surface shadow-soft"
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
      <span className={`mt-2 block text-[13px] leading-snug ${highlight ? "text-white/70" : "text-body"}`}>{label}</span>
    </div>
  );
}
