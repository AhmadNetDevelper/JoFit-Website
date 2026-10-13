/*
 * Inline SVG on a 16-unit grid, the same set and the same reasoning as the shop
 * and coaches pages carry: FontAwesome only exists on the `(template)` route,
 * and `currentColor` lets an icon re-tint with the text beside it rather than
 * carry a colour of its own.
 *
 * All `aria-hidden` — every one sits next to a label, and naming it here would
 * have a screen reader say the same thing twice.
 *
 * The CATEGORY GLYPHS at the bottom are larger and sit on a 24-unit grid. They
 * are not label decoration: they stand in for a photograph the client has not
 * supplied, so they are drawn at 48–72px and need the room to stay legible.
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

/** Duration. A clock, because hours are the unit a trainee plans around. */
export function ClockIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.2" {...STROKE} />
      <path d="M8 4.4V8l2.6 1.6" {...STROKE} />
    </Frame>
  );
}

/** The certificate itself — a sealed page. */
export function CertificateIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M3.2 1.8h9.6v8.4H3.2z" {...STROKE} />
      <path d="M5.4 4.4h5.2M5.4 6.6h3.4" {...STROKE} />
      <circle cx="8" cy="11.6" r="2.4" {...STROKE} />
      <path d="M6.6 13.4 6.1 15.2 8 14.3l1.9.9-.5-1.8" {...STROKE} />
    </Frame>
  );
}

/** An intake's start date. */
export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M2.4 3.8h11.2v9.8H2.4z" {...STROKE} />
      <path d="M2.4 6.6h11.2M5.4 1.8v2.8M10.6 1.8v2.8" {...STROKE} />
    </Frame>
  );
}

/** The enquiry that starts the path. */
export function ChatIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M2.2 3.2h11.6v7.4H6.6l-3 2.6v-2.6H2.2z" {...STROKE} />
      <path d="M5.2 5.8h5.6M5.2 8h3.4" {...STROKE} />
    </Frame>
  );
}

/* ---------------------------------------------------------------------------
 * CATEGORY GLYPHS.
 *
 * These stand in for course photography, which the client has not supplied —
 * see `course-media.tsx` for why a drawn tile beats a grey rectangle. One per
 * catalogue category, plus a fallback, on a 24-unit grid.
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

/** An NCSF certification — a sealed diploma. */
function CertificationGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M3.6 3h16.8v12H3.6z" {...GLYPH} />
      <path d="M6.8 7h10.4M6.8 10.4h6.8" {...GLYPH} />
      <circle cx="12" cy="17.4" r="3.4" {...GLYPH} />
      <path d="M9.9 20.1 9 23l3-1.5L15 23l-.9-2.9" {...GLYPH} />
    </GlyphFrame>
  );
}

/** A specialised course — an anatomical figure under study. */
function SpecialisedGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <circle cx="12" cy="4.2" r="2.2" {...GLYPH} />
      <path d="M12 6.4v7.2M12 13.6 8.6 21M12 13.6 15.4 21" {...GLYPH} />
      <path d="M5.8 9.2 12 7.6l6.2 1.6" {...GLYPH} />
      <circle cx="15.4" cy="13.6" r="3.4" {...GLYPH} />
    </GlyphFrame>
  );
}

/** A CPD workshop — a short stack of sessions with a tick. */
function WorkshopGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M3.4 4.6h13.2v14.8H3.4z" {...GLYPH} />
      <path d="M6.6 8.6h6.8M6.6 12h6.8M6.6 15.4h4.2" {...GLYPH} />
      <circle cx="18" cy="16.4" r="4" {...GLYPH} />
      <path d="m16.2 16.4 1.3 1.4 2.4-2.6" {...GLYPH} />
    </GlyphFrame>
  );
}

function DefaultGlyph({ size }: { size: number }) {
  return (
    <GlyphFrame size={size}>
      <path d="M12 3 21.4 7.4 12 11.8 2.6 7.4 12 3Z" {...GLYPH} />
      <path d="M6 9.6v5.6c0 1.6 2.7 3 6 3s6-1.4 6-3V9.6" {...GLYPH} />
      <path d="M21.4 7.4v5.4" {...GLYPH} />
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
 * fact the catalogue already holds; matching on words in the name would break
 * the moment the copy changed, and would only ever work in one language.
 */
export function CourseGlyph({
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
