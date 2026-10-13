/**
 * Public surface of the auth domain. Screens import from here and never reach
 * into `auth/services/*` directly.
 *
 * SERVER ONLY. The service reads and writes the session cookie through
 * `next/headers`, so nothing here may be imported by a Client Component; a
 * client leaf receives the finished strings it needs instead.
 */
export { authService, FIXTURE_EMAIL, FIXTURE_PASSWORD, type AuthService } from "./services";
export { homePathFor, requireAccount, safeReturnPath } from "./session";
export { refreshAccountDisplay } from "./cookies";
export type {
  Account,
  AccountRole,
  ChangeEmailInput,
  ChangePasswordInput,
  DemoAccount,
  RegisterInput,
  Session,
  SignInInput,
} from "./types";
