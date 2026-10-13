/**
 * One error shape for the whole data layer. Components branch on `code`, never
 * on an HTTP status or on a thrown `unknown`.
 */
export type AppErrorCode =
  | "not-found"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "unavailable"
  | "network"
  | "timeout"
  | "unknown";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

/**
 * Per-field messages a validation error carries in `details.fieldErrors`, keyed
 * by the field name the form uses. Empty for any other error.
 */
export function fieldErrorsOf(error: unknown): Readonly<Record<string, string>> {
  if (!(error instanceof AppError)) return {};
  const details = error.details as { fieldErrors?: Record<string, string> } | undefined;
  return details?.fieldErrors ?? {};
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function notFound(resource: string): AppError {
  return new AppError("not-found", `${resource} was not found.`, { status: 404 });
}

/** Normalises anything thrown by fetch, JSON parsing or an adapter. */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) return value;
  if (value instanceof DOMException && value.name === "AbortError") {
    return new AppError("timeout", "The request timed out.", { cause: value });
  }
  if (value instanceof TypeError) {
    return new AppError("network", "The network request failed.", { cause: value });
  }
  const message = value instanceof Error ? value.message : "Something went wrong.";
  return new AppError("unknown", message, { cause: value });
}

export function appErrorCodeFromStatus(status: number): AppErrorCode {
  switch (status) {
    case 400:
    case 422:
      return "validation";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not-found";
    case 409:
      return "conflict";
    case 408:
      return "timeout";
    case 503:
      return "unavailable";
    default:
      return status >= 500 ? "unavailable" : "unknown";
  }
}
