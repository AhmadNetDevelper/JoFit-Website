import type { ReactNode } from "react";

export type StateTone = "neutral" | "error";

export interface StateMessageProps {
  readonly title: string;
  readonly description?: string;
  readonly tone?: StateTone;
  readonly action?: ReactNode;
}

/**
 * The single structural primitive behind every non-content state. It fixes the
 * semantics — a labelled region, an error announced politely — and deliberately
 * fixes nothing about appearance; the design phase restyles this one component
 * and every empty/error/unavailable state in the platform follows.
 */
export function StateMessage({ title, description, tone = "neutral", action }: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-surface px-6 py-12 text-center shadow-soft"
    >
      <span
        aria-hidden="true"
        className={`grid size-14 place-items-center rounded-full ring-1 ${
          tone === "error" ? "bg-danger-05 text-danger ring-danger/20" : "bg-primary-05 text-primary ring-primary/15"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          {tone === "error" ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16.5v.01" />
            </>
          ) : (
            <>
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </>
          )}
        </svg>
      </span>
      <p className="font-heading text-[1.2rem] font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-[46ch] text-[15px] leading-relaxed text-body">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
