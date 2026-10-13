import { apiConfig } from "@/config";
import { AppError, appErrorCodeFromStatus, toAppError } from "@/lib";
import { buildQueryString, type QueryParamValue } from "@/lib";

import { readErrorBody } from "./error-body";
import { SESSION_COOKIE, decodeCredential, encodeCredential, type Credential } from "./session";
import type { HttpRequestOptions } from "./types";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

/**
 * The single place the storefront talks to the JoFit API.
 *
 * THE CONTRACT IT SPEAKS is the one the reference server in
 * `mock-api/server.cjs` implements route by route. In short:
 *
 * - Every path is under `/v1`, relative to `NEXT_PUBLIC_API_BASE_URL`.
 * - Bodies are JSON in both directions — except an upload, which is a
 *   `FormData` body sent as multipart, and a private file (a CV), which comes
 *   back as bytes through `download`. List filters are query parameters, a
 *   list value repeats its key (`?categorySlugs=a&categorySlugs=b`), a nested
 *   value is dotted (`?price.min=1000`).
 * - Errors come back as RFC 7807 problem details from the live API (as
 *   `{ "error": { "code", "message", "fieldErrors"? } }` from the reference
 *   server), and become an `AppError` here (`./error-body`) — so a form shows the
 *   API's own "that time has just been taken" rather than "request failed".
 * - `204 No Content` resolves to `undefined`.
 *
 * SESSIONS. This app renders on the server, so it is the server — never the
 * browser — that calls the API on a signed-in visitor's behalf. The API's token
 * lives in the storefront's own httpOnly cookie (`SESSION_COOKIE`), and a call
 * made with `auth: true` forwards it as `Authorization: Bearer …`. No script in
 * the page can read it, which is the point.
 */
function resolveUrl(path: string, query?: Record<string, unknown>): string {
  const base = apiConfig.baseUrl.replace(/\/$/, "");
  const suffix = query
    ? buildQueryString(query as Record<string, QueryParamValue | readonly QueryParamValue[]>)
    : "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}${suffix}`;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  /* `application/json`, and `application/problem+json` for the live API's errors. */
  if (!/[/+]json\b/.test(contentType)) return undefined;
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

/** The signed-in visitor's credential, read from the httpOnly cookie. Server only. */
async function readCredential(): Promise<Credential | undefined> {
  const { cookies } = await import("next/headers");
  return decodeCredential((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Exchanges the stored refresh token for a new access token and rewrites the
 * session cookie in place. Returns the new access token, or `undefined` when
 * there is no refresh token to use or the API rejects it — the caller then
 * falls through to the ordinary 401 handling, same as any other expired
 * session.
 */
async function refreshSession(): Promise<string | undefined> {
  const refreshToken = (await readCredential())?.refreshToken;
  if (!refreshToken) return undefined;
  try {
    const refreshed = await httpRequest<Credential & { readonly session?: unknown }>("/v1/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      cache: "no-store",
    });
    const { cookies } = await import("next/headers");
    (await cookies()).set(SESSION_COOKIE, encodeCredential(refreshed), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return refreshed.token;
  } catch {
    return undefined;
  }
}

export async function httpRequest<TResponse>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<TResponse> {
  if (!apiConfig.baseUrl) {
    throw new AppError(
      "unavailable",
      "No API base URL is configured. Set NEXT_PUBLIC_API_BASE_URL before using the HTTP data source.",
    );
  }
  return attemptRequest<TResponse>(path, options, true);
}

/**
 * The actual fetch, retried at most once: a 401 on an `auth: true` call
 * triggers exactly one silent token refresh (`refreshSession`) before the
 * error is allowed to surface. `canRefresh` is `false` on the retry so a
 * refresh token the API also rejects can't loop.
 */
async function attemptRequest<TResponse>(
  path: string,
  options: HttpRequestOptions,
  canRefresh: boolean,
): Promise<TResponse> {
  const timeoutMs = options.timeoutMs ?? apiConfig.timeoutMs;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  const token = options.auth ? (await readCredential())?.token : undefined;
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  try {
    const response = await fetch(resolveUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        /* No Content-Type for a form: fetch writes it, with the boundary. */
        ...(options.body === undefined || isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body:
        options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      signal,
      /* A signed-in answer is that person's alone; it must never be cached and
         served to the next visitor. */
      cache: options.auth ? "no-store" : options.cache,
      next:
        options.auth || (options.revalidate === undefined && options.tags === undefined)
          ? undefined
          : { revalidate: options.revalidate, tags: options.tags as string[] | undefined },
    });

    if (response.status === 401 && options.auth && canRefresh) {
      const refreshedToken = await refreshSession();
      if (refreshedToken) return attemptRequest<TResponse>(path, options, false);
    }

    const payload = await parseBody(response);

    if (!response.ok) {
      const error = readErrorBody(payload);
      const code = (error.code as AppError["code"] | undefined) ?? appErrorCodeFromStatus(response.status);
      throw new AppError(code, error.message ?? `Request to ${path} failed with status ${response.status}.`, {
        status: response.status,
        details: { fieldErrors: error.fieldErrors ?? {} },
      });
    }

    return payload as TResponse;
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * For "get one" calls whose contract answers `null` when the thing is not
 * there: the API says 404, the service says `null`.
 */
export async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof AppError && error.code === "not-found") return null;
    throw error;
  }
}

/** A private file the API streams back — a CV — with what a download needs. */
export interface DownloadedFile {
  readonly bytes: ArrayBuffer;
  readonly contentType: string;
  readonly fileName: string;
}

/**
 * GET a private file with the visitor's token. Never cached: a CV is the
 * candidate's, the employer's and staff's, and nobody else's.
 */
export async function httpDownload(path: string): Promise<DownloadedFile> {
  if (!apiConfig.baseUrl) throw new AppError("unavailable", "No API base URL is configured.");
  /* No silent refresh here, unlike `attemptRequest`: an expired token on a
     download simply fails, same as any other 401 — downloads are infrequent
     enough that this isn't worth the added complexity. */
  const token = (await readCredential())?.token;
  try {
    const response = await fetch(resolveUrl(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(apiConfig.timeoutMs * 4),
    });
    if (!response.ok) {
      const error = readErrorBody(await parseBody(response));
      throw new AppError(
        (error.code as AppError["code"] | undefined) ?? appErrorCodeFromStatus(response.status),
        error.message ?? `Download of ${path} failed with status ${response.status}.`,
        { status: response.status },
      );
    }
    const disposition = response.headers.get("content-disposition") ?? "";
    const named = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1] ?? /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    return {
      bytes: await response.arrayBuffer(),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      fileName: named ? decodeURIComponent(named) : "download",
    };
  } catch (error) {
    throw toAppError(error);
  }
}

export const httpClient = {
  get: <TResponse>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<TResponse>(path, { ...options, method: "GET" }),
  post: <TResponse>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<TResponse>(path, { ...options, method: "POST", body }),
  put: <TResponse>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<TResponse>(path, { ...options, method: "PUT", body }),
  patch: <TResponse>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<TResponse>(path, { ...options, method: "PATCH", body }),
  delete: <TResponse>(path: string, options?: Omit<HttpRequestOptions, "method" | "body">) =>
    httpRequest<TResponse>(path, { ...options, method: "DELETE" }),
  download: httpDownload,
} as const;
