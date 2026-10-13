import { cookies } from "next/headers";

import { DISPLAY_COOKIE, SESSION_COOKIE, decodeCredential, encodeCredential, type Credential } from "@/services";

import type { Account } from "./types";

export type { Credential };

const TWO_WEEKS = 60 * 60 * 24 * 14;

/**
 * The two cookies a signed-in visitor carries, written the same way whichever
 * adapter signed them in.
 *
 * `SESSION_COOKIE` is httpOnly and holds the credential (JSON-encoded) — a
 * fixture account id against mock data, the API's access/refresh token pair
 * against the API. `DISPLAY_COOKIE` is readable and holds only what the header
 * prints (a first name, the role). It grants nothing; every signed-in page
 * checks the real session on the server.
 */
export async function writeSessionCookies(credential: Credential, account: Account): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, encodeCredential(credential), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: TWO_WEEKS,
  });
  await refreshAccountDisplay(account);
}

/**
 * Rewrites the session cookie in place after the HTTP client silently
 * refreshed an expired access token. The account hasn't changed, so the
 * display cookie is left alone.
 */
export async function writeRefreshedCredential(credential: Credential): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, encodeCredential(credential), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: TWO_WEEKS,
  });
}

/**
 * Rewrites only the readable display cookie — after the person renames
 * themselves, so the header greets them by the new name at once. It carries
 * no credential, so rewriting it on its own changes nothing about who is
 * signed in.
 */
export async function refreshAccountDisplay(account: Account): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(
    DISPLAY_COOKIE,
    JSON.stringify({
      name: account.name.split(" ")[0],
      nameAr: account.nameAr?.split(" ")[0],
      role: account.role,
    }),
    { sameSite: "lax", secure, path: "/", maxAge: TWO_WEEKS },
  );
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(DISPLAY_COOKIE);
}

/** Just the bearer token — what every call site that only needs "is anyone signed in, and with what token" wants. */
export async function readSessionCredential(): Promise<string | undefined> {
  return decodeCredential((await cookies()).get(SESSION_COOKIE)?.value)?.token;
}

/** The full credential, refresh token included — only the HTTP client's refresh-on-401 logic needs this. */
export async function readFullCredential(): Promise<Credential | undefined> {
  return decodeCredential((await cookies()).get(SESSION_COOKIE)?.value);
}
