import type { ReactNode } from "react";

/**
 * The heading block a section opens with: an eyebrow with its gold dash, the
 * title in Alexandria, and an optional lead. `actions` sits at the far end on
 * wide screens — "View all courses" beside the heading it belongs to.
 *
 * The title takes `ReactNode` so one phrase can be set in the brand colour
 * (`<span className="text-primary">`). Use it once per heading at most.
 *
 * `tone="dark"` is for deep bands: headings are coloured on the element, so a
 * heading on dark green must be told it is white.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "start",
  tone = "light",
  id,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  tone?: "light" | "dark";
  id?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const centered = align === "center";
  const dark = tone === "dark";

  const block = (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p className="eyebrow" data-tone={dark ? "dark" : undefined}>
          {eyebrow}
        </p>
      ) : null}

      <h2
        id={id}
        className={`mt-3 text-[1.9rem] leading-[1.15] sm:text-4xl lg:text-[2.6rem] ${dark ? "text-white" : ""}`}
      >
        {title}
      </h2>

      {lead ? (
        <p className={`mt-4 text-[1.05rem] leading-relaxed ${dark ? "text-white/70" : "text-body"}`}>{lead}</p>
      ) : null}
    </div>
  );

  if (!actions) return <div className={className}>{block}</div>;

  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${className}`}>
      {block}
      <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
    </div>
  );
}
