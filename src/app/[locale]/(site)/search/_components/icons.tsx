/*
 * The kind glyphs for a search result row.
 *
 * Four of the five are the same marks the sports page uses for the same four
 * domains — a bag for the shop, a calendar for a hire, a whistle for a coach, a
 * cap for a qualification. They are COPIED rather than imported across pages
 * on purpose: `_components` is page-local by the project's own convention, and
 * a shared set is worth extracting when a third page wants it, not the second.
 *
 * 16-unit grid, `currentColor`, `aria-hidden` — each sits beside a label that
 * names the kind, so the glyph would otherwise be read twice.
 */
const S = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Small({ children, size = 15 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

export function BagIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <path d="M3.2 5.2h9.6l-.8 8.4H4L3.2 5.2Z" {...S} />
      <path d="M6 5.2V4a2 2 0 1 1 4 0v1.2" {...S} />
    </Small>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <rect x="2.4" y="3.6" width="11.2" height="10" {...S} />
      <path d="M2.4 6.6h11.2M5.6 2.2v2.6M10.4 2.2v2.6" {...S} />
    </Small>
  );
}

export function WhistleIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <circle cx="6" cy="9.4" r="3.6" {...S} />
      <path d="M9.2 7.6h4.4v2.6H9.4M6 5.8V3.4h3.2" {...S} />
    </Small>
  );
}

export function CapIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <path d="M1.8 6.6 8 3.4l6.2 3.2L8 9.8 1.8 6.6Z" {...S} />
      <path d="M4.4 7.9v3.2c0 .9 1.6 1.7 3.6 1.7s3.6-.8 3.6-1.7V7.9" {...S} />
    </Small>
  );
}

export function ArticleIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <path d="M3.2 2.6h7.2l2.4 2.4v8.4H3.2V2.6Z" {...S} />
      <path d="M10.4 2.6V5h2.4M5.4 7.6h5.2M5.4 10.2h5.2" {...S} />
    </Small>
  );
}

export function SearchIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <circle cx="7.2" cy="7.2" r="4.8" {...S} />
      <path d="M10.8 10.8 14 14" {...S} />
    </Small>
  );
}

/** The rating star beside a coach's score — filled, like every rating on the site. */
export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="m8 1.7 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.7Z" fill="currentColor" />
    </svg>
  );
}
