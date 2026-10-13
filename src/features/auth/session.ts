import { redirect } from "next/navigation";

import { localePath, type Locale } from "@/i18n";

import { authService } from "./services";
import type { Account, AccountRole } from "./types";

/**
 * Where each kind of account lands after signing in, and where the header's
 * name link points.
 */
export function homePathFor(role: AccountRole): string {
  return role === "coach" ? "/coach" : role === "employer" ? "/employer" : "/account";
}

/**
 * THE GATE ON EVERY SIGNED-IN SCREEN.
 *
 * Called at the top of a layout or page, on the server. Nobody signed in goes
 * to the sign-in screen with a `next` that brings them straight back; someone
 * signed in as the other role goes to their own area rather than to an error —
 * a coach who follows a link to `/account` wants their coach area, not a 403.
 *
 * It is also the one place a Server Action re-checks who is calling: an action
 * is a public endpoint whatever page rendered its button, so every write calls
 * this again instead of trusting the page that drew the form.
 */
export async function requireAccount(
  locale: Locale,
  role: AccountRole,
  returnTo: string,
): Promise<Account> {
  const session = await authService.getSession();
  if (!session) {
    const door = role === "coach" ? "/sign-in/coach" : role === "employer" ? "/sign-in/employer" : "/sign-in";
    redirect(`${localePath(locale, door)}?next=${encodeURIComponent(returnTo)}`);
  }
  if (session.account.role !== role) {
    redirect(localePath(locale, homePathFor(session.account.role)));
  }
  return session.account;
}

/** A `next` value is only followed when it is a path on this site. */
export function safeReturnPath(value: string | undefined | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
