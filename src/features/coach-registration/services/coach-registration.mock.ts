import { resolveText, type Locale } from "@/i18n";
import { AppError } from "@/lib";
import { accountStore, coachAccounts, staffEmails } from "@/mocks/accounts";
import {
  mockAcademicDegrees,
  mockCitiesByCountry,
  mockCountries,
  mockJobStatuses,
  mockJobTypes,
  mockSkills,
  mockUniversityMajors,
  type RawOption,
} from "@/mocks/coach-registration";
import { simulateLatency } from "@/mocks/runtime";

import type { RegistrationOption } from "../types";
import type { CoachRegistrationService } from "./coach-registration.contract";

const localize = (rows: readonly RawOption[], locale: Locale): RegistrationOption[] =>
  rows.map((row) => ({ id: row.id, name: resolveText(row.name, locale) }));

/** Emails registered in this process, so a second attempt is refused as the API would. */
const registered = new Set<string>();

function emailTaken(email: string): boolean {
  const store = accountStore();
  return (
    registered.has(email) ||
    staffEmails.includes(email) ||
    coachAccounts.some((entry) => entry.email.toLowerCase() === email) ||
    store.customers.some((entry) => entry.email.toLowerCase() === email) ||
    store.employerAccounts.some((entry) => entry.email.toLowerCase() === email)
  );
}

/**
 * The reference tables come from `mocks/coach-registration`. A registration is
 * checked and remembered, not stored: the mock coach roster is a fixture, and
 * a half-filled profile would surface on the storefront without the staff
 * verification a real one waits for.
 */
export const mockCoachRegistrationService: CoachRegistrationService = {
  async listOptions(locale) {
    await simulateLatency();
    return {
      countries: localize(mockCountries, locale),
      jobStatuses: localize(mockJobStatuses, locale),
      academicDegrees: localize(mockAcademicDegrees, locale),
      universityMajors: localize(mockUniversityMajors, locale),
      jobTypes: localize(mockJobTypes, locale),
      skills: localize(mockSkills, locale),
    };
  },

  async listCities(countryId, locale) {
    await simulateLatency();
    return localize(mockCitiesByCountry[countryId] ?? [], locale);
  },

  async register(input) {
    await simulateLatency();
    const email = input.email.trim().toLowerCase();
    if (emailTaken(email)) {
      const message = "That email already has an account — sign in instead.";
      throw new AppError("conflict", message, { status: 409, details: { fieldErrors: { email: message } } });
    }
    registered.add(email);
  },
};
