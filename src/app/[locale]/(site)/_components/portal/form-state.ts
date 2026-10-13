import { fieldErrorsOf, isAppError } from "@/lib";

import type { FormState } from "./action-form";

/**
 * An action's failure as a `FormState`. An `AppError` carries a sentence
 * written for a person ("that time has just been taken"); anything else is a
 * bug and gets the generic line rather than a stack trace.
 */
export function failed(error: unknown, fallback: string): FormState {
  return {
    status: "error",
    message: isAppError(error) ? error.message : fallback,
    fieldErrors: fieldErrorsOf(error),
  };
}

export function succeeded(message?: string): FormState {
  return { status: "ok", message };
}
