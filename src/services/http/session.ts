/**
 * The storefront's own session cookie — httpOnly, set by the server.
 *
 * Against mock data it holds a fixture account id; against the API it holds the
 * token the API issued at sign-in, forwarded as a bearer on signed-in calls
 * (see `client.ts`). One name for both, so switching data source signs nobody
 * into the wrong mode.
 */
export const SESSION_COOKIE = "jofit.session";

/** Readable by the header: a first name and a role, never a credential. */
export const DISPLAY_COOKIE = "jofit.account";

/**
 * What `SESSION_COOKIE` actually holds, JSON-encoded. Against mock data
 * `token` is a fixture account id and the other two fields are absent;
 * against the API it is the bearer access token, its refresh token, and when
 * the access token expires (the API's `SignedInDto`).
 */
export interface Credential {
  readonly token: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
}

export function encodeCredential(credential: Credential): string {
  return JSON.stringify(credential);
}

/** Tolerates a missing or malformed cookie value — returns `undefined` rather than throwing. */
export function decodeCredential(raw: string | undefined): Credential | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<Credential>;
    return typeof parsed.token === "string" ? (parsed as Credential) : undefined;
  } catch {
    return undefined;
  }
}
