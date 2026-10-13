/**
 * Denormalised rating aggregate embedded in any reviewable entity, exactly as a
 * real API would return it — listing pages must be able to sort and render
 * ratings without fetching the review collection.
 */
export interface RatingSummary {
  /** 0–5, one decimal. */
  readonly average: number;
  readonly count: number;
  /** Optional histogram keyed by star value. */
  readonly distribution?: Readonly<Record<1 | 2 | 3 | 4 | 5, number>>;
}
