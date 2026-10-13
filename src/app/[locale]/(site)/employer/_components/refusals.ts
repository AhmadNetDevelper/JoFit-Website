import type { JobDraft } from "@/features/careers";
import type { TranslationKey, Translate } from "@/i18n";
import { fieldErrorsOf, isAppError } from "@/lib";

import type { FormState } from "../../_components/portal/action-form";
import { isolate } from "./format";

/**
 * THE SERVICE'S REFUSALS, IN THE READER'S LANGUAGE.
 *
 * The employer portal service answers in English (every service does; the API
 * will too). A person using the Arabic site must not read "Only an open job
 * can be closed." So a refusal is translated from what is stable about it —
 * its CODE and the action that was attempted, plus the NAMES of the fields it
 * flags — never from its English wording, which is the service's to reword.
 *
 * The pages check the common mistakes first (`jobDraftErrors`, the logo's
 * size and type) so most refusals never reach the service; this is for the
 * ones only the service can know: a job that moved on in another tab, a
 * company suspended since the page was drawn.
 */
export type EmployerAction =
  | "createJob"
  | "updateJob"
  | "submitJob"
  | "withdrawJob"
  | "closeJob"
  | "reopenJob"
  | "deleteJob"
  | "moveApplication"
  | "saveNote"
  | "updateProfile"
  | "uploadLogo";

const JOB_ACTIONS: readonly EmployerAction[] = [
  "createJob",
  "updateJob",
  "submitJob",
  "withdrawJob",
  "closeJob",
  "reopenJob",
  "deleteJob",
];

/** What each state conflict means, per action. */
const CONFLICT: Partial<Record<EmployerAction, TranslationKey>> = {
  submitJob: "employer.errSubmitState",
  withdrawJob: "employer.errWithdrawState",
  closeJob: "employer.errCloseState",
  reopenJob: "employer.errReopenState",
  deleteJob: "employer.errDeleteApplied",
  updateJob: "employer.errJobGone",
  moveApplication: "employer.errMoveState",
};

/** A job draft's fields, as `jobDraftErrors` and the form both name them. */
const DRAFT_FIELDS: Readonly<Record<string, TranslationKey>> = {
  title: "jobForm.errTitle",
  categoryId: "jobForm.errCategory",
  sportIds: "jobForm.errSports",
  cityId: "jobForm.errCity",
  workMode: "jobForm.errMode",
  employmentType: "jobForm.errType",
  experienceLevel: "jobForm.errLevel",
  "salary.period": "jobForm.errPeriod",
  description: "jobForm.errDescription",
  requirements: "jobForm.errRequirements",
  benefits: "jobForm.errBenefits",
  languages: "jobForm.errLanguages",
  positions: "jobForm.errPositions",
  closesOn: "jobForm.errClosesOn",
};

/** The company profile's fields. */
const PROFILE_FIELDS: Readonly<Record<string, TranslationKey>> = {
  name: "employer.errName",
  kind: "employer.errKind",
  cityId: "jobForm.errCity",
  about: "employer.errAbout",
  size: "employer.errSize",
  email: "employer.errEmail",
  phone: "account.errorPhone",
  website: "employer.errWebsite",
  contactName: "employer.errContactName",
  logo: "employer.errLogoType",
  employerNote: "employer.errNoteLong",
};

/**
 * `jobDraftErrors` in the reader's language. The two salary fields each have
 * more than one way to be wrong, and which one it is can be read off the
 * draft itself, so the message says the actual problem.
 */
export function draftErrorsIn(t: Translate, errors: Readonly<Record<string, string>>, draft: JobDraft): Record<string, string> {
  const out: Record<string, string> = {};
  const min = draft.salary?.min;
  const max = draft.salary?.max;
  const bad = (money: typeof min) => money !== undefined && !(Number.isInteger(money.amount) && money.amount > 0);
  for (const field of Object.keys(errors)) {
    if (field === "salary.min") {
      out[field] = t(
        !draft.salary
          ? "jobForm.errSalaryShow"
          : !min && !max
            ? "jobForm.errSalaryEither"
            : "jobForm.errSalaryAmount",
      );
    } else if (field === "salary.max") {
      out[field] = t(!bad(max) && min && max && min.amount > max.amount ? "jobForm.errSalaryOrder" : "jobForm.errSalaryAmount");
    } else {
      out[field] = t(DRAFT_FIELDS[field] ?? "employer.errField");
    }
  }
  return out;
}

/** A failed service call as a `FormState` the reader can act on. */
export function refused(t: Translate, action: EmployerAction, error: unknown): FormState {
  if (!isAppError(error)) return { status: "error", message: t("state.errorTitle") };
  const flagged = fieldErrorsOf(error);

  switch (error.code) {
    case "unauthorized":
      return { status: "error", message: t("employer.errSignIn") };
    case "not-found":
      return {
        status: "error",
        message: t(JOB_ACTIONS.includes(action) ? "employer.errJobGone" : "employer.errApplicationGone"),
      };
    case "forbidden":
      return { status: "error", message: t("employer.errCannotPublish") };
    case "conflict":
      if (action === "reopenJob" && flagged.closesOn) return { status: "error", message: t("employer.errReopenDate") };
      return { status: "error", message: t(CONFLICT[action] ?? "state.errorTitle") };
    case "validation": {
      const fields = action === "createJob" || action === "updateJob" || action === "submitJob" ? DRAFT_FIELDS : PROFILE_FIELDS;
      const values = { scheme: isolate("https://") };
      const fieldErrors = Object.fromEntries(
        Object.keys(flagged).map((field) => [
          field,
          t(fields[field] ?? (field.startsWith("salary.") ? "jobForm.errSalaryAmount" : "employer.errField"), values),
        ]),
      );
      const only = Object.values(fieldErrors);
      return {
        status: "error",
        message: only.length === 1 ? only[0]! : t("account.fixFields"),
        fieldErrors,
      };
    }
    default:
      return { status: "error", message: t("state.errorTitle") };
  }
}
