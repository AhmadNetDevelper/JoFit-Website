/**
 * Domain-level switches. Several domains are architecturally prepared but not
 * functionally built; a flag lets their routes exist (and their code stay
 * compiled and type-checked) without pretending the feature is finished.
 */
export const featureFlags = {
  shop: true,
  rental: true,
  sports: true,
  coaches: true,
  education: true,
  content: true,
  community: false,
  reviews: true,
  /* The READ side is built: `listSubjects` returns the five things JoFit
     quotes for. Submission is still an OPEN BUSINESS DECISION and the page is
     designed around that rather than around a form that posts nowhere — see
     the note at the top of `(site)/quotations/page.tsx`. */
  quotations: true,
  cart: true,
  /** Requires authentication, which does not exist yet. */
  checkout: true,
  account: true,
  search: true,
} as const;

export type FeatureKey = keyof typeof featureFlags;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return featureFlags[key];
}
