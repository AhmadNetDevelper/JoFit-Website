export interface ApiErrorBody {
  readonly code?: string;
  readonly message?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

interface Envelope {
  readonly error?: { readonly code?: string; readonly message?: string; readonly fieldErrors?: Record<string, string> };
}

interface ProblemDetails {
  readonly title?: string | null;
  readonly detail?: string | null;
  readonly errors?: Readonly<Record<string, string | readonly string[]>>;
}

const camel = (segment: string) => segment.charAt(0).toLowerCase() + segment.slice(1);

/**
 * ASP.NET keys a validation message by the property path it bound to
 * (`UserName`, `User.UserName`, `$.name`); forms key their fields by the
 * camelCase name. Each message lands under the full path and, unless taken,
 * under its last segment, which is the field a form usually calls it.
 */
function toFieldErrors(errors: NonNullable<ProblemDetails["errors"]>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    const message = typeof value === "string" ? value : value[0];
    const segments = key.replace(/^\$\.?/, "").split(".").filter(Boolean).map(camel);
    const last = segments.at(-1);
    if (!message || !last) continue;
    fieldErrors[segments.join(".")] ??= message;
    fieldErrors[last] ??= message;
  }
  return fieldErrors;
}

/**
 * An error response in either shape the storefront meets: the reference server's
 * `{ error: { code, message, fieldErrors } }`, or the live API's RFC 7807
 * problem details (`title`, `detail`, and `errors` on a validation failure).
 */
export function readErrorBody(payload: unknown): ApiErrorBody {
  if (!payload || typeof payload !== "object") return {};
  const envelope = (payload as Envelope).error;
  if (envelope && typeof envelope === "object") {
    return { code: envelope.code, message: envelope.message, fieldErrors: envelope.fieldErrors };
  }
  const problem = payload as ProblemDetails;
  return {
    message: problem.detail || problem.title || undefined,
    fieldErrors: problem.errors && typeof problem.errors === "object" ? toFieldErrors(problem.errors) : undefined,
  };
}
