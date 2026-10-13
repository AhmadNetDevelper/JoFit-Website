/*
 * Inline SVG on a 16-unit grid, same reasoning as the shop's and the coaches'
 * sets: FontAwesome only exists on the `(template)` route, and `currentColor`
 * lets an icon re-tint with the text beside it instead of carrying a colour.
 *
 * All `aria-hidden` — every one sits next to a label, so naming it would have a
 * screen reader read the same thing twice.
 *
 * The ITEM GLYPHS at the bottom are larger and live on a 24-unit grid. They are
 * not label decoration: they stand in for a photograph, so they are drawn at
 * 48–72px and need the room to stay legible.
 *
 * Deliberately NOT imported from `shop/_components/icons.tsx`. A rental item is
 * not a product — the two sets already disagree about what a card needs, and a
 * shared file would have to grow every glyph either page ever wants.
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

/** The date window — the control this page is built around. */
export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="2" y="3.2" width="12" height="10.8" {...STROKE} />
      <path d="M2 6.4h12M5.2 1.8v2.8M10.8 1.8v2.8" {...STROKE} />
      <path d="M4.8 9.2h2.4v2.4H4.8z" fill="currentColor" stroke="none" />
    </Frame>
  );
}

export function PinIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 14.2s4.6-4 4.6-7.4a4.6 4.6 0 1 0-9.2 0c0 3.4 4.6 7.4 4.6 7.4Z" {...STROKE} />
      <circle cx="8" cy="6.8" r="1.7" {...STROKE} />
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

/** The refundable deposit — money held, not money spent. */
export function DepositIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 1.8 13.2 4v4.3c0 3-2.1 5-5.2 5.9-3.1-.9-5.2-2.9-5.2-5.9V4L8 1.8Z" {...STROKE} />
      <path d="M8 5.6v4.8M6.4 7.2h3.2M6.4 9h3.2" {...STROKE} />
    </Frame>
  );
}

/** How many of the thing the operator owns. */
export function StackIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="m8 2 5.6 2.8L8 7.6 2.4 4.8 8 2Z" {...STROKE} />
      <path d="m2.4 8 5.6 2.8L13.6 8M2.4 11.2 8 14l5.6-2.8" {...STROKE} />
    </Frame>
  );
}

/* ---------------------------------------------------------------------------
 * ITEM GLYPHS.
 *
 * These stand in for the photography the client has not supplied — see
 * `rental-media.tsx` for why a drawn glyph beats a grey rectangle. One per
 * category, plus a fallback, on a 24-unit grid.
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

/** Water — a board and a paddle over open water. */
function WaterGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M4.4 13.4c2.6-4.4 4.8-6.6 7.6-6.6s5 2.2 7.6 6.6c-2.6 1.6-5.1 2.4-7.6 2.4s-5-.8-7.6-2.4Z" {...GLYPH} />
      <path d="M15.4 3.6 9.8 11.2M14 3l2.6 1.8" {...GLYPH} />
      <path d="M2.6 19.2c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Cycling — a bike, side on. */
function CyclingGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <circle cx="5.4" cy="16.4" r="3.8" {...GLYPH} />
      <circle cx="18.6" cy="16.4" r="3.8" {...GLYPH} />
      <path d="m5.4 16.4 4-8h5.2l4 8" {...GLYPH} />
      <path d="M9.4 8.4h6.2M12 16.4l2.6-8" {...GLYPH} />
      <path d="M8 6.6h3" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Camping — a tent pitched. */
function CampingGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M12 3.6 21.4 19H2.6L12 3.6Z" {...GLYPH} />
      <path d="M12 8.4 15.8 19h-7.6L12 8.4Z" {...GLYPH} />
      <path d="M12 3.6V19" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Facilities — a court, marked out. */
function FacilityGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <rect x="2.6" y="4.6" width="18.8" height="14.8" {...GLYPH} />
      <path d="M12 4.6v14.8" {...GLYPH} />
      <circle cx="12" cy="12" r="2.8" {...GLYPH} />
      <path d="M2.6 8.6h3.4v6.8H2.6M21.4 8.6H18v6.8h3.4" {...GLYPH} />
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
  "rcat-water": WaterGlyph,
  "rcat-cycling": CyclingGlyph,
  "rcat-cycling-road": CyclingGlyph,
  "rcat-cycling-trail": CyclingGlyph,
  "rcat-camping": CampingGlyph,
  "rcat-facility": FacilityGlyph,
};

/**
 * Keyed by CATEGORY ID, never by a word in the title: the category is a fact
 * the fixture already knows, and matching on the name would break the moment
 * the copy changed and would only ever work in one language.
 */
export function ItemGlyph({
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
