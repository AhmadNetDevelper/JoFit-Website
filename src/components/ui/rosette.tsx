/**
 * THE ROSETTE — the site's one ornament.
 *
 * Guilloché: the interlaced linework engraved on certificates, diplomas and
 * banknotes, there because it is hard to forge. It is the right image for a
 * body whose product IS a certificate, and it replaces the gym photography the
 * old design put behind every hero.
 *
 * Two rings of rotated ellipses and three circles. Stroked in `currentColor`,
 * so a caller sets its strength with a text colour (`text-accent/25`), and it
 * follows the theme. Server-rendered SVG, a few KB, no image request.
 */
export function Rosette({ className = "" }: { className?: string }) {
  const outer = Array.from({ length: 36 }, (_, index) => index * 5);
  const inner = Array.from({ length: 24 }, (_, index) => index * 7.5 + 3.75);

  return (
    <svg viewBox="-200 -200 400 400" fill="none" stroke="currentColor" aria-hidden="true" className={className}>
      <g strokeWidth="0.55">
        {outer.map((angle) => (
          <ellipse key={angle} rx="188" ry="62" transform={`rotate(${angle})`} />
        ))}
      </g>
      <g strokeWidth="0.5" opacity="0.8">
        {inner.map((angle) => (
          <ellipse key={angle} rx="118" ry="38" transform={`rotate(${angle})`} />
        ))}
      </g>
      <circle r="196" strokeWidth="0.9" />
      <circle r="190" strokeWidth="0.4" />
      <circle r="44" strokeWidth="0.6" />
    </svg>
  );
}
