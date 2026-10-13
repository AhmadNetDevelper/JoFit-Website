import type { ReactNode } from "react";

import { isAppError, type AppErrorCode } from "@/lib";

import { StateMessage } from "./state-message";

/** Dictionary key for each error code — the copy itself lives in `i18n`. */
export const ERROR_MESSAGE_KEYS = {
  "not-found": "error.notFound",
  unauthorized: "error.unauthorized",
  forbidden: "error.forbidden",
  validation: "error.validation",
  conflict: "error.conflict",
  unavailable: "error.unavailable",
  network: "error.network",
  timeout: "error.timeout",
  unknown: "error.unknown",
} as const satisfies Record<AppErrorCode, string>;

export function errorCodeOf(error: unknown): AppErrorCode {
  return isAppError(error) ? error.code : "unknown";
}

/**
 * Presentational only: it receives already-translated copy.
 *
 * Mapping an error code to a message is done by the caller, which has a
 * translator; putting English strings in a shared component would make them
 * untranslatable.
 */
export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <StateMessage tone="error" title={title} description={description} action={action} />;
}
