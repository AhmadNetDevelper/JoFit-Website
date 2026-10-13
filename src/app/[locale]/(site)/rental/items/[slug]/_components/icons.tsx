/*
 * Inline SVG on a 16-unit grid, the same reasoning as every icon file on the
 * site: `currentColor` lets an icon re-tint with the text beside it instead of
 * carrying a colour of its own.
 *
 * All `aria-hidden` — every one sits next to a label, and naming it here would
 * have a screen reader read the same thing twice.
 *
 * The category glyphs that stand in for photographs live with the rental
 * cards, in `rental/_components/icons.tsx` — one set for the whole section.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Frame({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="2" y="3.2" width="12" height="10.8" {...STROKE} />
      <path d="M2 6.4h12M5.2 1.8v2.6M10.8 1.8v2.6" {...STROKE} />
    </Frame>
  );
}

export function ClockIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.2" {...STROKE} />
      <path d="M8 4.4V8l2.4 1.6" {...STROKE} />
    </Frame>
  );
}

export function PinIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 14.2s4.6-4 4.6-7.2a4.6 4.6 0 1 0-9.2 0c0 3.2 4.6 7.2 4.6 7.2Z" {...STROKE} />
      <circle cx="8" cy="6.9" r="1.7" {...STROKE} />
    </Frame>
  );
}

export function ShieldIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 1.8 13.2 4v4.3c0 3-2.1 5-5.2 5.9-3.1-.9-5.2-2.9-5.2-5.9V4L8 1.8Z" {...STROKE} />
      <path d="m5.8 7.9 1.6 1.6 3-3.2" {...STROKE} />
    </Frame>
  );
}

/** The fleet: how many of the thing the depot actually owns. */
export function StackIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 1.8 14.2 5 8 8.2 1.8 5 8 1.8Z" {...STROKE} />
      <path d="m1.8 8 6.2 3.2L14.2 8" {...STROKE} />
      <path d="m1.8 11 6.2 3.2 6.2-3.2" {...STROKE} />
    </Frame>
  );
}

export function SparkIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 1.8v3.4M8 10.8v3.4M1.8 8h3.4M10.8 8h3.4" {...STROKE} />
      <path d="m3.9 3.9 2.2 2.2M9.9 9.9l2.2 2.2M12.1 3.9 9.9 6.1M6.1 9.9l-2.2 2.2" {...STROKE} />
    </Frame>
  );
}

export function StarIcon({ size }: { size?: number }) {
  return (
    <svg
      width={size ?? 16}
      height={size ?? 16}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="m8 1.7 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
