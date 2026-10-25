"use server";

import { coachRegistrationService, type RegistrationOption } from "@/features/coach-registration";
import { getTranslator, resolveLocale, type Locale } from "@/i18n";
import { fieldErrorsOf, isAppError } from "@/lib";

import type { FormState } from "../../_components/portal/action-form";
import { ERROR_KEYS, parseCoachForm, type ErrorMessages, type RowGroup, type RowKeys } from "./parse-form";

function errorMessagesFor(locale: Locale): ErrorMessages {
  const t = getTranslator(locale);
  return Object.fromEntries(ERROR_KEYS.map((key) => [key, t(`coachJoin.err.${key}`)])) as ErrorMessages;
}

/** The city picker, refilled when a country is chosen — no page reload. */
export async function loadCities(locale: Locale, countryId: string): Promise<readonly RegistrationOption[]> {
  if (!/^\d+$/.test(countryId)) return [];
  try {
    return await coachRegistrationService.listCities(countryId, resolveLocale(locale));
  } catch {
    return [];
  }
}

/* The contract's list names, and its account field names where the form's differ. */
const LIST_GROUP: Readonly<Record<string, RowGroup>> = {
  educations: "education",
  certificates: "certificate",
  experiences: "experience",
  skills: "skill",
};
const ACCOUNT_FIELD: Readonly<Record<string, string>> = {
  fullName: "firstName",
  phoneNumber: "phone",
  userName: "email",
  slug: "email",
  "profile.slug": "email",
  "profile.sportIds": "sportIds",
  "profile.locationId": "locationId",
  "profile.languages": "languages",
  sportIds: "sportIds",
  locationId: "locationId",
  languages: "languages",
  "headline.en": "headlineEn",
  "headline.ar": "headlineAr",
  "profile.headline.en": "headlineEn",
  "profile.headline.ar": "headlineAr",
  "profile.name.en": "profileNameEn",
  "profile.name.ar": "profileNameAr",
  "profile.bio.en": "bioEn",
  "profile.bio.ar": "bioAr",
};

/** The service's field errors (`educations.0.startDate`) under the form's names (`education.r3.startDate`). */
function toFormNames(fieldErrors: Readonly<Record<string, string>>, rowKeys: RowKeys): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    const row = /^(\w+)\.(\d+)\.(\w+)$/.exec(key);
    const group = row ? LIST_GROUP[row[1]] : undefined;
    const rowKey = group ? rowKeys[group][Number(row![2])] : undefined;
    if (group && rowKey) mapped[`${group}.${rowKey}.${row![3]}`] ??= message;
    else mapped[ACCOUNT_FIELD[key] ?? key] ??= message;
  }
  return mapped;
}

/** Names the form has a box for; an API error under any other name would be marked nowhere. */
const SHOWN_FIELDS = new Set([
  "firstName", "lastName", "email", "phone", "password", "confirmPassword", "genderId", "birthDate", "countryId",
  "cityId", "jobStatusId", "profileNameAr", "profileNameEn", "headlineAr", "headlineEn", "bioAr", "bioEn", "profileImage", "sportIds", "locationId", "languages",
]);

/** The API's messages for fields the form does not show, so a refusal is never silent. */
function unplacedMessages(fieldErrors: Readonly<Record<string, string>>): string[] {
  return [
    ...new Set(
      Object.entries(fieldErrors)
        .filter(([key]) => !SHOWN_FIELDS.has(key) && !/^(education|certificate|experience|skill)\./.test(key))
        .map(([, message]) => message),
    ),
  ];
}

/** The API's English sentences, in the reader's language where the form has a translation. */
function localizeApiMessage(message: string, t: ReturnType<typeof getTranslator>): string {
  if (/username or email already exists|already uses this (email|slug)/i.test(message)) return t("coachJoin.err.taken");
  if (/at least one sport/i.test(message)) return t("coachJoin.err.sport");
  if (/choose a location/i.test(message)) return t("coachJoin.err.basedIn");
  if (/at least one language/i.test(message)) return t("coachJoin.err.language");
  if (/headline is required/i.test(message)) return t("coachJoin.err.headline");
  return message;
}

export async function registerCoachAction(_state: FormState, formData: FormData): Promise<FormState> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const t = getTranslator(locale);
  const messages = errorMessagesFor(locale);

  const parsed = parseCoachForm(formData, messages);
  /* A bot that filled the hidden field is told it worked, and nothing is sent. */
  if (parsed.isBot) return { status: "ok" };
  if (!parsed.registration) return { status: "error", message: messages.fix, fieldErrors: parsed.fieldErrors };

  try {
    await coachRegistrationService.register(parsed.registration);
  } catch (error) {
    if (!isAppError(error)) return { status: "error", message: t("state.errorTitle") };
    const fieldErrors = Object.fromEntries(
      Object.entries(toFormNames(fieldErrorsOf(error), parsed.rowKeys)).map(([key, message]) => [key, localizeApiMessage(message, t)]),
    );
    const apiMessage = localizeApiMessage(error.message, t);
    /* The API's "same username or email" arrives with no field attached: it belongs on the email box. */
    if (apiMessage === t("coachJoin.err.taken") && !fieldErrors.email) fieldErrors.email = apiMessage;
    if (error.code === "conflict") {
      const taken = t("coachJoin.err.taken");
      return { status: "error", message: taken, fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : { email: taken } };
    }
    if (error.code === "validation" || Object.keys(fieldErrors).length > 0) {
      /* Nothing mapped to a box: the API's own sentence is all there is to say, so say it. */
      const unplaced = Object.keys(fieldErrors).length === 0 ? [apiMessage] : unplacedMessages(fieldErrors);
      return { status: "error", message: [messages.fix, ...unplaced].filter(Boolean).join(" — "), fieldErrors };
    }
    return { status: "error", message: error.message || t("state.errorTitle") };
  }
  return { status: "ok" };
}
