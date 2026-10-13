import { StarIcon } from "./icons";

/**
 * A rating, drawn twice.
 *
 * The faint row is the scale; the gold row is the score, clipped to a
 * percentage of it. Clipping rather than picking whole/half/empty glyphs is
 * what lets 4.6 look like 4.6 instead of rounding to 4.5, and because the clip
 * is anchored with `start` it fills from the reading edge in both scripts —
 * a `left`-anchored one would fill backwards in Arabic.
 *
 * `label` is the whole accessible name. Screen readers get one sentence
 * ("4.9 out of 5, 47 reviews"); the glyphs themselves are decoration.
 *
 * `tone="dark"` is for the deep hero, where an ink-tinted scale would vanish.
 */
export function RatingStars({
  value,
  label,
  size = 14,
  tone = "light",
}: {
  value: number;
  label: string;
  size?: number;
  tone?: "light" | "dark";
}) {
  const stars = [0, 1, 2, 3, 4];
  const filled = `${Math.max(0, Math.min(5, value)) * 20}%`;

  return (
    <span role="img" aria-label={label} className="relative inline-flex align-middle">
      <span aria-hidden="true" className={`flex gap-0.5 ${tone === "dark" ? "text-white/20" : "text-ink/15"}`}>
        {stars.map((index) => (
          <StarIcon key={index} size={size} />
        ))}
      </span>

      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 overflow-hidden text-accent"
        style={{ inlineSize: filled }}
      >
        <span className="flex gap-0.5">
          {stars.map((index) => (
            <StarIcon key={index} size={size} />
          ))}
        </span>
      </span>
    </span>
  );
}

/**
 * The compact form: one gold star and the number on a white pill, for a card
 * where five glyphs plus a count would crowd out the name they sit beside.
 *
 * The digits are forced to `ltr`. `4.9` is a Latin-digit decimal in both
 * dictionaries, and inside an RTL paragraph the bidi algorithm is entitled to
 * reorder a number that sits against neighbouring text — `dir="ltr"` on the
 * span isolates it so it always reads as written.
 */
export function RatingChip({
  value,
  count,
  label,
  className = "",
}: {
  value: number;
  /** Already formatted — the number of reviews behind the score. */
  count?: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] leading-none font-bold text-ink shadow-soft ring-1 ring-line ${className}`}
    >
      <span aria-hidden="true" className="text-accent">
        <StarIcon size={13} />
      </span>
      <span aria-hidden="true" dir="ltr">
        {value.toFixed(1)}
      </span>
      {count ? (
        <span aria-hidden="true" className="font-medium text-body/60" dir="ltr">
          {`(${count})`}
        </span>
      ) : null}
    </span>
  );
}
