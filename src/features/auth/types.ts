/**
 * Who is signed in, and as what.
 *
 * Three kinds of people sign in to the storefront, and they land in different
 * places: a CUSTOMER in the account area (orders, hires, sessions, courses,
 * job applications), a COACH in the coach area (their sessions to confirm,
 * their students, their reviews), and an EMPLOYER — a gym, club or sports
 * company on the careers board — in the employer portal (their jobs and the
 * people who applied). Staff do not sign in here at all — they have the admin console —
 * so a staff address is recognised and pointed there rather than rejected as
 * unknown.
 *
 * Deliberately thin. Each area fetches its own records per screen; copying them
 * onto the session would give two sources of truth for the same fact.
 *
 * OPEN BUSINESS DECISION: whether a coach who also buys from the shop has one
 * account with two roles or two accounts. The fixtures give each person one.
 */
export type AccountRole = "customer" | "coach" | "employer";

export interface Account {
  readonly id: string;
  readonly name: string;
  /** Set when the name was authored in Arabic too — a coach's is. */
  readonly nameAr?: string;
  readonly email: string;
  readonly role: AccountRole;
  /** Set for a customer: the record every order and booking points at. */
  readonly customerId?: string;
  /** Set for a coach: the published profile they manage. */
  readonly coachId?: string;
  /** Set for an employer: the company whose jobs they post. */
  readonly employerId?: string;
}

export interface Session {
  readonly account: Account;
}

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

/** Changing the password of the signed-in account. */
export interface ChangePasswordInput {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** Changing the sign-in email of the signed-in customer. */
export interface ChangeEmailInput {
  readonly email: string;
  readonly currentPassword: string;
}

/** A development account shown on the sign-in screen, one per role. */
export interface DemoAccount {
  readonly role: AccountRole;
  readonly email: string;
  readonly name: string;
}

export interface RegisterInput {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly password: string;
  readonly locale: "en" | "ar";
  readonly marketingOptIn: boolean;
  /**
   * Not collected by the sign-up screen today — the live API accepts them but
   * doesn't require them. Here so the type is ready whenever that form grows.
   */
  readonly profileImage?: File;
  readonly birthOfDate?: string;
  readonly genderId?: number;
  readonly countryId?: string;
  readonly cityId?: string;
}
