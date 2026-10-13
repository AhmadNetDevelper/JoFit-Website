/*
 * Inline SVG, same reasoning and the same 16-unit grid as the coaches and shop
 * sets: FontAwesome only exists on the `(template)` route, and `currentColor`
 * lets an icon re-tint with the text beside it instead of carrying a colour.
 *
 * All `aria-hidden` — every one of them sits next to a label, so naming it here
 * would have a screen reader read the same thing twice.
 *
 * The COURSE GLYPHS at the bottom are larger and live on a 24-unit grid. They
 * are not label decoration: they stand in for a photograph the client has not
 * supplied, so they are drawn at 90–160px and need the extra room to stay
 * legible at that size.
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

export function CheckIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="m3.2 8.4 3.2 3.2 6.4-7" {...STROKE} />
    </Frame>
  );
}

export function ClockIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.2" {...STROKE} />
      <path d="M8 4.4V8l2.6 1.6" {...STROKE} />
    </Frame>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="2.2" y="3.4" width="11.6" height="10.4" {...STROKE} />
      <path d="M2.2 6.6h11.6M5.4 1.8v3M10.6 1.8v3" {...STROKE} />
    </Frame>
  );
}

/** A rosette: the certificate, wherever the awarding body is named. */
export function CertificateIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="6.2" r="4.2" {...STROKE} />
      <path d="M5.8 9.8 4.6 14.2l3.4-1.7 3.4 1.7-1.2-4.4" {...STROKE} />
    </Frame>
  );
}

/** Stacked planes: the delivery format, which is a shape not a place. */
export function LayersIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 1.8 14.4 5 8 8.2 1.6 5 8 1.8Z" {...STROKE} />
      <path d="m1.6 8.4 6.4 3.2 6.4-3.2M1.6 11.4l6.4 3.2 6.4-3.2" {...STROKE} />
    </Frame>
  );
}

/** Rising bars: the level, read left to right in both directions by shape. */
export function BarsIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M3.2 13.2V9.6M8 13.2V6.2M12.8 13.2V2.8" {...STROKE} />
    </Frame>
  );
}

export function GlobeIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.2" {...STROKE} />
      <path d="M2 8h12M8 1.8c1.8 2 2.7 4 2.7 6.2S9.8 14.2 8 14.2 5.3 12.2 5.3 8 6.2 1.8 8 1.8Z" {...STROKE} />
    </Frame>
  );
}

export function PinIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 14.2s4.8-4 4.8-7.6a4.8 4.8 0 1 0-9.6 0C3.2 10.2 8 14.2 8 14.2Z" {...STROKE} />
      <circle cx="8" cy="6.4" r="1.8" {...STROKE} />
    </Frame>
  );
}

export function UsersIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="6.2" cy="5.6" r="2.6" {...STROKE} />
      <path d="M1.8 13.4c0-2.4 2-4 4.4-4s4.4 1.6 4.4 4" {...STROKE} />
      <path d="M11 3.4a2.6 2.6 0 0 1 0 4.8M12.4 9.9c1.2.6 1.9 1.8 1.9 3.5" {...STROKE} />
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

/* ---------------------------------------------------------------------------
 * COURSE GLYPHS.
 *
 * These stand in for course photography, which the client has not supplied —
 * see `course-media.tsx` for why a drawn glyph beats a grey rectangle here.
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

/** Certifications — a sealed award with its ribbon. */
function CertificationGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <circle cx="12" cy="9" r="6" {...GLYPH} />
      <circle cx="12" cy="9" r="2.6" {...GLYPH} />
      <path d="M8.4 13.9 6.6 22l5.4-2.8 5.4 2.8-1.8-8.1" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Specialised courses — a target, because the whole point is a narrow one. */
function SpecialisedGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <circle cx="12" cy="12" r="9" {...GLYPH} />
      <circle cx="12" cy="12" r="5.2" {...GLYPH} />
      <circle cx="12" cy="12" r="1.6" {...GLYPH} />
      <path d="M12 1.6v3.4M12 19v3.4M1.6 12H5M19 12h3.4" {...GLYPH} />
    </GlyphFrame>
  );
}

/** CPD workshops — a short session: a clock over an open page. */
function WorkshopGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M2.6 6.2h6.2c1.2 0 2.2.9 2.2 2v11c0-1.1-1-2-2.2-2H2.6V6.2Z" {...GLYPH} />
      <path d="M21.4 6.2h-6.2c-1.2 0-2.2.9-2.2 2v11c0-1.1 1-2 2.2-2h6.2V6.2Z" {...GLYPH} />
      <circle cx="12" cy="5" r="3.2" {...GLYPH} />
      <path d="M12 3.4V5l1.2.8" {...GLYPH} />
    </GlyphFrame>
  );
}

/** Anything else — a diploma, rolled. */
function DefaultGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M4.2 3.4h12.2a2.6 2.6 0 0 1 2.6 2.6v14.6H6.8a2.6 2.6 0 0 1-2.6-2.6V3.4Z" {...GLYPH} />
      <path d="M8 8h7.4M8 12h7.4M8 16h4.4" {...GLYPH} />
    </GlyphFrame>
  );
}

const GLYPHS: Readonly<Record<string, (props: { size: number }) => React.ReactElement>> = {
  "ccat-certifications": CertificationGlyph,
  "ccat-specialised": SpecialisedGlyph,
  "ccat-cpd": WorkshopGlyph,
};

/**
 * Keyed by CATEGORY ID, not by a guess at the title. A course's category is a
 * fact the catalogue already knows; matching on words in the name would break
 * the moment the copy changed, and would only ever work in one language.
 */
export function CourseGlyph({
  categoryIds,
  size = 96,
}: {
  categoryIds: readonly string[];
  size?: number;
}) {
  const match = categoryIds.find((id) => id in GLYPHS);
  const Glyph = match ? GLYPHS[match] : DefaultGlyph;
  return <Glyph size={size} />;
}
