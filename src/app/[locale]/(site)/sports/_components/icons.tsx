/*
 * ONE GLYPH PER SPORT, KEYED BY `Sport.iconKey`.
 *
 * `iconKey` has been on the domain model since it was written, with the comment
 * "resolved by the design system once it exists". This is that resolution. It
 * is keyed by the field rather than by the slug or the name so a sport can be
 * renamed, or its slug changed for SEO, without silently losing its icon — and
 * so the same eleven glyphs answer in both languages.
 *
 * Every sport in the fixtures carries a key, but `iconKey` is optional on the
 * type, so an unknown or absent one falls back rather than rendering nothing.
 *
 * Drawn on a 24-unit grid, `currentColor`, `aria-hidden` — they always sit
 * beside the sport's name, so naming them here would have a screen reader read
 * the same word twice.
 */
const S = {
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Frame({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

const GLYPHS: Readonly<Record<string, (p: { size: number }) => React.ReactElement>> = {
  football: ({ size }) => (
    <Frame size={size}>
      <circle cx="12" cy="12" r="9" {...S} />
      <path d="m12 7.2 3.6 2.6-1.4 4.2H9.8L8.4 9.8 12 7.2Z" {...S} />
      <path d="M12 3v4.2M4.6 9.3l3.8.5M6.9 18.4l2.9-4.4M17.1 18.4l-2.9-4.4M19.4 9.3l-3.8.5" {...S} />
    </Frame>
  ),
  basketball: ({ size }) => (
    <Frame size={size}>
      <circle cx="12" cy="12" r="9" {...S} />
      <path d="M3 12h18M12 3v18" {...S} />
      <path d="M5.6 5.6a12 12 0 0 1 0 12.8M18.4 5.6a12 12 0 0 0 0 12.8" {...S} />
    </Frame>
  ),
  tennis: ({ size }) => (
    <Frame size={size}>
      <ellipse cx="9.6" cy="8.4" rx="5.4" ry="6.2" transform="rotate(-38 9.6 8.4)" {...S} />
      <path d="M13.1 12.6 20 20.4" {...S} />
      <path d="M6.2 5.6 13 11.4M12.6 5.2 6.6 11.6" {...S} />
    </Frame>
  ),
  swimming: ({ size }) => (
    <Frame size={size}>
      <circle cx="16.6" cy="6.4" r="1.7" {...S} />
      <path d="M3.4 12.4 9 9.2l3.4 2.6 3.2-1.4" {...S} />
      <path d="M2.6 17.2c1.6 0 1.6 1.4 3.2 1.4s1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3.2-1.4" {...S} />
    </Frame>
  ),
  running: ({ size }) => (
    <Frame size={size}>
      <circle cx="14.8" cy="4.9" r="1.8" {...S} />
      <path d="M8.2 20.6l2.8-4.4-2.2-3 1.4-4.4 3.2-1.2 3 2.2 2.6.8" {...S} />
      <path d="m11 13.2 3.6 2 1 5.4M8.6 9.4 5.2 11l-1 3" {...S} />
    </Frame>
  ),
  fitness: ({ size }) => (
    <Frame size={size}>
      <path d="M8.4 12h7.2" {...S} />
      <rect x="4.8" y="8.8" width="3" height="6.4" {...S} />
      <rect x="16.2" y="8.8" width="3" height="6.4" {...S} />
      <path d="M2.6 10.6v2.8M21.4 10.6v2.8" {...S} />
    </Frame>
  ),
  gym: ({ size }) => (
    <Frame size={size}>
      <path d="M4 19.4h16" {...S} />
      <path d="M6.4 19.4V9.6l5.6-4 5.6 4v9.8" {...S} />
      <path d="M9.6 19.4v-5.2h4.8v5.2" {...S} />
    </Frame>
  ),
  "martial-arts": ({ size }) => (
    <Frame size={size}>
      <path d="M12 3.2 5.4 7.4v4.2c0 4 2.7 7.2 6.6 8.8 3.9-1.6 6.6-4.8 6.6-8.8V7.4L12 3.2Z" {...S} />
      <path d="M9.2 12.4h5.6M12 9.6v5.6" {...S} />
    </Frame>
  ),
  cycling: ({ size }) => (
    <Frame size={size}>
      <circle cx="5.6" cy="16.4" r="3.6" {...S} />
      <circle cx="18.4" cy="16.4" r="3.6" {...S} />
      <path d="m5.6 16.4 4-6.6h5.2l3.6 6.6M9.6 9.8 8.4 6.8h3.2" {...S} />
      <path d="M14.8 9.8 12 16.4H5.6" {...S} />
    </Frame>
  ),
  outdoor: ({ size }) => (
    <Frame size={size}>
      <path d="M2.8 19.4 12 4.6l9.2 14.8H2.8Z" {...S} />
      <path d="m8.4 13 2.2-3.4 2.2 3.4 1.6-1.8 3.2 5.2H6.4l2-3.4Z" {...S} />
    </Frame>
  ),
  "water-sports": ({ size }) => (
    <Frame size={size}>
      <path d="M12 3.4c3.6 3.4 5.4 6.4 5.4 9a5.4 5.4 0 0 1-10.8 0c0-2.6 1.8-5.6 5.4-9Z" {...S} />
      <path d="M4 19.6c1.4 0 1.4 1.2 2.8 1.2s1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2" {...S} />
    </Frame>
  ),
};

function FallbackGlyph({ size }: { size: number }) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="8.6" {...S} />
      <path d="M12 3.4v17.2M3.4 12h17.2" {...S} />
    </Frame>
  );
}

export function SportGlyph({ iconKey, size = 32 }: { iconKey?: string; size?: number }) {
  const Glyph = (iconKey && GLYPHS[iconKey]) || FallbackGlyph;
  return <Glyph size={size} />;
}

/* The small icons the counts row uses. 16-unit grid, same as every other set. */
const T = { ...S, strokeWidth: 1.3 } as const;

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
      <path d="M3.2 5.2h9.6l-.8 8.4H4L3.2 5.2Z" {...T} />
      <path d="M6 5.2V4a2 2 0 1 1 4 0v1.2" {...T} />
    </Small>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <rect x="2.4" y="3.6" width="11.2" height="10" {...T} />
      <path d="M2.4 6.6h11.2M5.6 2.2v2.6M10.4 2.2v2.6" {...T} />
    </Small>
  );
}

export function WhistleIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <circle cx="6" cy="9.4" r="3.6" {...T} />
      <path d="M9.2 7.6h4.4v2.6H9.4M6 5.8V3.4h3.2" {...T} />
    </Small>
  );
}

export function CapIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <path d="M1.8 6.6 8 3.4l6.2 3.2L8 9.8 1.8 6.6Z" {...T} />
      <path d="M4.4 7.9v3.2c0 .9 1.6 1.7 3.6 1.7s3.6-.8 3.6-1.7V7.9" {...T} />
    </Small>
  );
}
