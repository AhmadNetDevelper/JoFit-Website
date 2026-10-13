import type { Locale } from "@/i18n";

import type { CoachRegistration, CoachRegistrationOptions, RegistrationOption } from "../types";

/**
 * FEATURE BOUNDARY — a coach signing themselves up.
 *
 * `register` opens the account and does NOT sign it in: the live endpoint
 * answers the new `UserDto`, not a session. A coach is listed on the
 * storefront once JoFit staff have verified the profile, so the screen says
 * so and points to the coach sign-in.
 *
 * Field errors come back keyed by the form's own names: `email`, `userName`,
 * … for the account, and `educations.<index>.<field>` (same for
 * `certificates`, `experiences`, `skills`) for a row, by its position in the
 * list that was sent.
 */
export interface CoachRegistrationService {
  listOptions(locale: Locale): Promise<CoachRegistrationOptions>;
  /** The cities of one country — what the city picker shows once a country is chosen. */
  listCities(countryId: string, locale: Locale): Promise<readonly RegistrationOption[]>;
  /** Rejects with `conflict` when the email or username already has an account. */
  register(input: CoachRegistration): Promise<void>;
}
