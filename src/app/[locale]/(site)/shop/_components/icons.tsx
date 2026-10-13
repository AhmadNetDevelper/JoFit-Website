/*
 * The shop's line icons: inline SVG on one 16-unit grid, stroked in
 * `currentColor` so an icon takes the colour of the text or the well it sits
 * in and follows a re-theme like everything else.
 *
 * All `aria-hidden` — every one sits next to a label, so naming it here would
 * have a screen reader read the same thing twice.
 *
 * The CATEGORY GLYPHS at the bottom are larger and live on a 24-unit grid:
 * they are not label decoration, they stand in for a product photograph, so
 * they are drawn at 30–140px and need the extra room to stay legible.
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

export function SearchIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="7.2" cy="7.2" r="4.8" {...STROKE} />
      <path d="M10.8 10.8 14 14" {...STROKE} />
    </Frame>
  );
}

export function TagIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8.4 2H14v5.6l-6.5 6.5a1.4 1.4 0 0 1-2 0l-3.6-3.6a1.4 1.4 0 0 1 0-2L8.4 2Z" {...STROKE} />
      <circle cx="11.2" cy="4.8" r="0.9" {...STROKE} />
    </Frame>
  );
}

export function TruckIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M1.6 4.4h7.2v6.4H1.6z" {...STROKE} />
      <path d="M8.8 6.8h2.8l2.8 2.4v1.6h-5.6z" {...STROKE} />
      <circle cx="4.4" cy="12.4" r="1.4" {...STROKE} />
      <circle cx="11.6" cy="12.4" r="1.4" {...STROKE} />
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

export function StarIcon({ size }: { size?: number }) {
  return (
    <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="m8 1.7 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SlidersIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M2.4 4.4h11.2M2.4 8h11.2M2.4 11.6h11.2" {...STROKE} />
      <circle cx="5.6" cy="4.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.8" cy="11.6" r="1.5" fill="currentColor" stroke="none" />
    </Frame>
  );
}

export function LayersIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 2.2 14 5.4 8 8.6 2 5.4 8 2.2Z" {...STROKE} />
      <path d="m2 8.2 6 3.2 6-3.2M2 11 8 14.2 14 11" {...STROKE} />
    </Frame>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="2.2" y="3.2" width="11.6" height="10.6" rx="2" {...STROKE} />
      <path d="M2.2 6.6h11.6M5.4 1.8v2.6M10.6 1.8v2.6" {...STROKE} />
    </Frame>
  );
}

/** A sport, drawn as the ball every sport on the shelf has in common. */
export function BallIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6" {...STROKE} />
      <path d="M2.4 6.2c2.2.9 4.4.9 5.6 0s3.4-.9 5.6 0M2.4 9.8c2.2-.9 4.4-.9 5.6 0s3.4.9 5.6 0" {...STROKE} />
    </Frame>
  );
}

/** A squad — the club and school orders the quote note is for. */
export function UsersIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="6" cy="5.4" r="2.4" {...STROKE} />
      <path d="M1.8 13.4c.5-2.4 2.1-3.8 4.2-3.8s3.7 1.4 4.2 3.8" {...STROKE} />
      <path d="M10.4 3.2a2.4 2.4 0 0 1 0 4.4M11.6 9.8c1.4.4 2.3 1.6 2.6 3.6" {...STROKE} />
    </Frame>
  );
}

/** An empty shelf: the empty states. */
export function BagIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M2.8 5.2h10.4l-.8 8.2a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9l-.8-8.2Z" {...STROKE} />
      <path d="M5.6 6.8V4.6a2.4 2.4 0 0 1 4.8 0v2.2" {...STROKE} />
    </Frame>
  );
}

export function CheckIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="m3.4 8.4 3 3 6.2-6.6" {...STROKE} strokeWidth={1.8} />
    </Frame>
  );
}

/* ---------------------------------------------------------------------------
 * CATEGORY GLYPHS.
 *
 * These stand in for product photography, which the client has not supplied —
 * see `product-media.tsx` for why a drawn glyph beats a grey rectangle here.
 * One per catalogue category, plus a fallback, on a 24-unit grid.
 * ------------------------------------------------------------------------- */
const GLYPH = {
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function GlyphFrame({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Equipment — a ball, the most recognisable object in the category. */
function EquipmentGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <circle cx="12" cy="12" r="9" {...GLYPH} />
      <path d="M12 3v3.6M12 17.4V21M3 12h3.6M17.4 12H21" {...GLYPH} />
      <path d="m8.4 8.4 2.2 2.2M13.4 13.4l2.2 2.2M15.6 8.4l-2.2 2.2M10.6 13.4l-2.2 2.2" {...GLYPH} />
      <circle cx="12" cy="12" r="2.1" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Apparel — a shirt. */
function ApparelGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M9 3h6l5 2.6-1.8 4L16 8.8V21H8V8.8L5.8 9.6 4 5.6 9 3Z" {...GLYPH} />
      <path d="M9 3a3 3 0 0 0 6 0" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Footwear — a side-on shoe. */
function FootwearGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M2.6 16.6V11h3.2l2.4 2 3-.6 2.6 1.6h5.2a2.6 2.6 0 0 1 2.4 2.6v1.8H2.6v-2.4Z" {...GLYPH} />
      <path d="M2.6 14.6h18.8M6.8 11l1 2M10.4 12.4l.9 1.8" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Strength — a dumbbell. */
function StrengthGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M8.4 12h7.2" {...GLYPH} />
      <rect x="4.6" y="8.6" width="3.2" height="6.8" {...GLYPH} />
      <rect x="16.2" y="8.6" width="3.2" height="6.8" {...GLYPH} />
      <path d="M2.4 10.4v3.2M21.6 10.4v3.2" {...GLYPH} />
    </GlyphFrame>
  );
}

function DefaultGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M3.4 7.4 12 3l8.6 4.4v9.2L12 21l-8.6-4.4V7.4Z" {...GLYPH} />
      <path d="M3.4 7.4 12 11.8l8.6-4.4M12 11.8V21" {...GLYPH} />
    </GlyphFrame>
  );
}

const GLYPHS: Readonly<Record<string, (props: { size: number }) => React.ReactElement>> = {
  "cat-equipment": EquipmentGlyph,
  "cat-apparel": ApparelGlyph,
  "cat-footwear": FootwearGlyph,
  "cat-strength": StrengthGlyph,
};

/**
 * Keyed by CATEGORY ID, not by a guess at the title. A product's category is a
 * fact the catalogue already knows; matching on words in the name would break
 * the moment the copy changed, and would only ever work in one language.
 */
export function CategoryGlyph({
  categoryIds,
  size = 64,
}: {
  categoryIds: readonly string[];
  size?: number;
}) {
  const match = categoryIds.find((id) => id in GLYPHS);
  const Glyph = match ? GLYPHS[match] : DefaultGlyph;
  return <Glyph size={size} />;
}
