import type { Locale } from "@/i18n";

import type { EmployerRegistration } from "@/features/careers";

import type {
  ChangeEmailInput,
  ChangePasswordInput,
  DemoAccount,
  RegisterInput,
  Session,
  SignInInput,
} from "../types";

/**
 * FEATURE BOUNDARY.
 *
 * There is no identity provider behind the storefront yet, so this contract
 * describes what the site needs rather than what any particular provider
 * offers.
 *
 * `getSession` resolves from the server, from a cookie the browser sends and
 * JavaScript cannot read. That is not an implementation detail: a session the
 * client can read is a session the client can forge. Every call here runs on
 * the server — in a page, a layout or a Server Action — and never in the
 * browser bundle.
 *
 * `signIn` rejects a staff address with a `forbidden` error rather than a
 * generic one, so the screen can send staff to the admin console instead of
 * telling them their account does not exist.
 *
 * OPEN BUSINESS DECISIONS: whether shoppers get passwords at all or only a
 * one-time code, social sign-in, session lifetime, and whether a guest checkout
 * can be upgraded into an account after the fact.
 */
export interface AuthService {
  signIn(input: SignInInput): Promise<Session>;
  /**
   * Opens a CUSTOMER account and signs it in. Coaches are not self-serve —
   * they are verified by staff before they exist — so registration only ever
   * makes a customer. Rejects an address that already has an account.
   */
  register(input: RegisterInput): Promise<Session>;
  /**
   * Opens an EMPLOYER account for a sports business on the careers board and
   * signs it in. The company starts `pending` verification: its jobs can be
   * written and submitted, but none is public until JoFit staff verify it.
   * Rejects an email that already has any account.
   */
  registerEmployer(input: EmployerRegistration): Promise<Session>;
  signOut(): Promise<void>;
  /** `null` when nobody is signed in. */
  getSession(): Promise<Session | null>;
  /**
   * Changes the signed-in account's password. The current password is always
   * required — a session left open on a shared computer must not be enough to
   * take the account over — and the API ends every OTHER session of the
   * account afterwards, so a password changed because it leaked actually locks
   * the other person out. This session stays signed in.
   */
  changePassword(input: ChangePasswordInput): Promise<void>;
  /**
   * Changes the sign-in email of a CUSTOMER account, after the current
   * password. Rejects an email another account (or a staff member) already
   * uses. A coach's email is part of the profile staff verify, so it is
   * changed by JoFit, not here.
   */
  changeEmail(input: ChangeEmailInput): Promise<Session>;
  /** Ends every session of this account except this one — "sign out other devices". */
  signOutOtherSessions(): Promise<void>;
  /** Development accounts to offer on the sign-in screen; empty against a real provider. */
  listDemoAccounts(locale: Locale): Promise<readonly DemoAccount[]>;
}
