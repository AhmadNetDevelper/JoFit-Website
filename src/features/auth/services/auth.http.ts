import { AppError } from "@/lib";
import { httpClient } from "@/services";

import { clearSessionCookies, readSessionCredential, writeSessionCookies } from "../cookies";
import type { AccountRole, Session } from "../types";
import type { AuthService } from "./auth.contract";

/** `AccountDto` — int64 ids, and `null` (not absent) for the ids and Arabic name an account doesn't have. */
interface LiveAccount {
  readonly id: number;
  readonly name: string;
  readonly nameAr: string | null;
  readonly email: string;
  readonly role: string;
  readonly customerId?: number | null;
  readonly coachId?: number | null;
  readonly employerId?: number | null;
}

/** `SessionDto`. */
interface LiveSession {
  readonly account: LiveAccount;
}

const optionalId = (id: number | null | undefined): string | undefined => (id == null ? undefined : String(id));

function toSession(dto: LiveSession): Session {
  const { account } = dto;
  return {
    account: {
      id: String(account.id),
      name: account.name,
      nameAr: account.nameAr ?? undefined,
      email: account.email,
      role: account.role as AccountRole,
      customerId: optionalId(account.customerId),
      coachId: optionalId(account.coachId),
      employerId: optionalId(account.employerId),
    },
  };
}

/**
 * Signing in against the JoFit API.
 *
 * The storefront is a server-rendered app, so it signs in ON THE VISITOR'S
 * BEHALF: `POST /v1/auth/sign-in` answers `{ token, session, refreshToken,
 * expiresAt }`, the whole credential goes into the storefront's httpOnly
 * cookie, and every signed-in call after that forwards the token as a bearer
 * (`auth: true` in the client, which also retries once with a refreshed token
 * on a 401 — see `services/http/client.ts`). The browser never holds the
 * token and never talks to the API about accounts directly.
 *
 * A staff address answers 403 `forbidden` — the sign-in screen turns that into
 * "use the admin console".
 */
/** `SignedInDto`. */
interface SignedIn {
  readonly token: string;
  readonly session: LiveSession;
  readonly refreshToken: string;
  readonly expiresAt: string;
}

async function startSession({ token, refreshToken, expiresAt, session: dto }: SignedIn): Promise<Session> {
  const session = toSession(dto);
  await writeSessionCookies({ token, refreshToken, expiresAt }, session.account);
  return session;
}

export const httpAuthService: AuthService = {
  async signIn(input) {
    const signedIn = await httpClient.post<SignedIn>("/v1/auth/sign-in", input, { cache: "no-store" });
    return startSession(signedIn);
  },

  async register(input) {
    /* Multipart-only server-side — no JSON option exists for this endpoint. */
    const form = new FormData();
    form.append("FullName", input.name);
    form.append("Email", input.email);
    form.append("Phone", input.phone ?? "");
    form.append("Password", input.password);
    form.append("Locale", input.locale);
    form.append("MarketingOptIn", String(input.marketingOptIn));
    if (input.profileImage) form.append("ProfileImage", input.profileImage, input.profileImage.name);
    if (input.birthOfDate) form.append("BirthOfDate", input.birthOfDate);
    if (input.genderId !== undefined) form.append("GenderId", String(input.genderId));
    if (input.countryId) form.append("CountryId", input.countryId);
    if (input.cityId) form.append("CityId", input.cityId);
    const signedIn = await httpClient.post<SignedIn>("/v1/auth/register", form, { cache: "no-store" });
    return startSession(signedIn);
  },

  async registerEmployer(input) {
    const signedIn = await httpClient.post<SignedIn>("/v1/auth/register-employer", input, { cache: "no-store" });
    return startSession(signedIn);
  },

  async signOut() {
    try {
      await httpClient.post<void>("/v1/auth/sign-out", undefined, { auth: true });
    } finally {
      // Signing out locally must work even when the API cannot be reached.
      await clearSessionCookies();
    }
  },

  async getSession() {
    if (!(await readSessionCredential())) return null;
    try {
      return toSession(await httpClient.get<LiveSession>("/v1/auth/session", { auth: true }));
    } catch (error) {
      // An expired or revoked token is "signed out", not an error page.
      if (error instanceof AppError && error.code === "unauthorized") return null;
      throw error;
    }
  },

  async changePassword(input) {
    await httpClient.put<void>("/v1/auth/password", input, { auth: true, cache: "no-store" });
  },

  changeEmail: (input) =>
    httpClient.put<LiveSession>("/v1/auth/email", input, { auth: true, cache: "no-store" }).then(toSession),

  async signOutOtherSessions() {
    await httpClient.post<void>("/v1/auth/sessions/revoke-others", undefined, { auth: true, cache: "no-store" });
  },

  /* Demo accounts are a development convenience of the mock data only. */
  async listDemoAccounts() {
    return [];
  },
};
