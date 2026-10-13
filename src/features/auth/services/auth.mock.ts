import { resolveText } from "@/i18n";
import { AppError } from "@/lib";
import { EMPLOYER_KINDS, JOB_CITIES } from "@/features/careers";
import { accountStore, coachAccounts, nextReference, notify, staffEmails, touch } from "@/mocks/accounts";

import { clearSessionCookies, readSessionCredential, writeSessionCookies } from "../cookies";
import type { Account } from "../types";
import type { AuthService } from "./auth.contract";

/**
 * Development sign-in against the fixture people — the same forty customers and
 * ten coaches the admin holds.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It does not check the password, and it does not pretend to. A mock that
 * compared a password would be theatre: it would teach the screens to trust a
 * check that does not exist. The form still requires one, because the real
 * provider will.
 *
 * THE SESSION IS A COOKIE THE SERVER SETS. httpOnly, so no script on the page
 * can read or copy it, and per-visitor, so two people on the dev server are not
 * signed in as each other. It holds an account id and nothing else, and it is
 * NOT signed — that is fine for fixtures and is the first thing a real adapter
 * replaces with the provider's own session.
 *
 * Beside it sits `jofit.account`, a readable cookie with a first name and a
 * role. It is not a credential and grants nothing: it lets the header — which
 * is shared by statically rendered pages and so cannot read the session —
 * greet the person and link to the right area.
 */

/** Kept for old bookmarks and remembered emails: the original demo address. */
const LEGACY_SHOPPER = "shopper@jofit.test";
const DEMO_CUSTOMER_ID = "cust-1";

function findAccountByEmail(email: string): Account | null {
  const normalized = email.trim().toLowerCase();
  const store = accountStore();

  const customerEmail = normalized === LEGACY_SHOPPER
    ? store.customers.find((entry) => entry.id === DEMO_CUSTOMER_ID)?.email
    : normalized;
  const customer = store.customers.find((entry) => entry.email.toLowerCase() === customerEmail);
  if (customer) {
    return {
      id: `acc-${customer.id}`,
      name: customer.name,
      email: customer.email,
      role: "customer",
      customerId: customer.id,
    };
  }

  const employerAccount = store.employerAccounts.find((entry) => entry.email.toLowerCase() === normalized);
  if (employerAccount) {
    return {
      id: `acc-${employerAccount.employerId}`,
      name: employerAccount.name,
      email: employerAccount.email,
      role: "employer",
      employerId: employerAccount.employerId,
    };
  }

  const coach = coachAccounts.find((entry) => entry.email.toLowerCase() === normalized);
  if (coach) {
    return {
      id: `acc-${coach.coachId}`,
      name: resolveText(coach.name, "en"),
      nameAr: resolveText(coach.name, "ar"),
      email: coach.email,
      role: "coach",
      coachId: coach.coachId,
    };
  }

  return null;
}

function findAccountById(id: string): Account | null {
  if (id.startsWith("acc-emp-")) {
    const employer = accountStore().employerAccounts.find((entry) => `acc-${entry.employerId}` === id);
    return employer ? findAccountByEmail(employer.email) : null;
  }
  if (id.startsWith("acc-coach-")) {
    const coach = coachAccounts.find((entry) => `acc-${entry.coachId}` === id);
    return coach ? findAccountByEmail(coach.email) : null;
  }
  const customer = accountStore().customers.find((entry) => `acc-${entry.id}` === id);
  return customer ? findAccountByEmail(customer.email) : null;
}

export const mockAuthService: AuthService = {
  async signIn({ email }) {
    const normalized = email.trim().toLowerCase();

    if (staffEmails.includes(normalized)) {
      throw new AppError("forbidden", "Staff accounts sign in to the admin console.", { status: 403 });
    }

    const account = findAccountByEmail(normalized);
    if (!account) {
      throw new AppError("unauthorized", "No account uses that email address.", { status: 401 });
    }

    await startSession(account);
    return { account };
  },

  async register(input) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim().replace(/\s+/g, " ");
    const phone = input.phone?.trim() || undefined;
    const fieldErrors: Record<string, string> = {};
    if (name.length < 3 || !name.includes(" ")) fieldErrors.name = "Your first and last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "An email address we can reach you on.";
    if (phone && !/^\+?[\d\s]{8,}$/.test(phone)) fieldErrors.phone = "A phone number, digits only.";
    if (input.password.length < 8) fieldErrors.password = "At least eight characters.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    if (findAccountByEmail(email) || staffEmails.includes(email)) {
      const message = "That email already has an account — sign in instead.";
      throw new AppError("conflict", message, { status: 409, details: { fieldErrors: { email: message } } });
    }

    const store = accountStore();
    /* The password is required and then DISCARDED: there is nothing to check it
       against, and a mock that stored one would be the first place a real
       password leaked from. The provider will own it. */
    const id = nextReference("cust-w");
    store.customers.push({
      id,
      name,
      email,
      phone,
      locale: input.locale,
      marketingOptIn: input.marketingOptIn,
      favouriteSportIds: [],
      joinedDaysAgo: 0,
    });
    store.addresses.set(id, []);

    const account = findAccountByEmail(email)!;
    await startSession(account);
    return { account };
  },

  async registerEmployer(input) {
    /* The body may come from any client; a missing field is an empty one. */
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    const email = text(input.email).trim().toLowerCase();
    const companyName = text(input.companyName).trim().replace(/\s+/g, " ");
    const contactName = text(input.contactName).trim().replace(/\s+/g, " ");
    const phone = text(input.phone).trim();
    const website = text(input.website).trim() || undefined;
    const fieldErrors: Record<string, string> = {};
    if (companyName.length < 2) fieldErrors.companyName = "Your company's name.";
    if (!EMPLOYER_KINDS.includes(input.kind)) fieldErrors.kind = "Choose what kind of business it is.";
    if (!JOB_CITIES.includes(input.cityId)) fieldErrors.cityId = "Choose the city.";
    if (contactName.length < 3 || !contactName.includes(" ")) fieldErrors.contactName = "The first and last name of the person we talk to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "An email address we can reach you on.";
    if (!/^\+?[\d\s]{8,}$/.test(phone)) fieldErrors.phone = "A phone number, digits only.";
    if (website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(website)) fieldErrors.website = "A full address, starting with https://";
    if (text(input.password).length < 8) fieldErrors.password = "At least eight characters.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    if (findAccountByEmail(email) || staffEmails.includes(email)) {
      const message = "That email already has an account — sign in instead.";
      throw new AppError("conflict", message, { status: 409, details: { fieldErrors: { email: message } } });
    }

    const store = accountStore();
    const id = nextReference("emp-w");
    const base = companyName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "employer";
    let slug = base;
    for (let n = 2; store.employers.some((entry) => entry.slug === slug); n += 1) slug = `${base}-${n}`;
    const now = new Date().toISOString();
    store.employers.push({
      id,
      slug,
      name: companyName,
      kind: input.kind,
      cityId: input.cityId,
      about: "",
      website,
      email,
      phone,
      contactName,
      verificationStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    store.employerAccounts.push({ employerId: id, email, name: contactName });
    notify({
      audience: "staff",
      kind: "employer-registered",
      title: { en: `New employer to verify: ${companyName}`, ar: `جهة توظيف جديدة للتوثيق: ${companyName}` },
      body: { en: "Check the company before its jobs can go live.", ar: "راجِع الجهة قبل أن تُنشر وظائفها." },
      href: `/careers/employers/${id}`,
    });
    touch();

    const account = findAccountByEmail(email)!;
    await startSession(account);
    return { account };
  },

  async signOut() {
    await clearSessionCookies();
  },

  async getSession() {
    const id = await readSessionCredential();
    if (!id) return null;
    const account = findAccountById(id);
    return account ? { account } : null;
  },

  /* Validated exactly as the API validates, then — like every password in
     this mock — discarded: there is no stored password to compare the
     current one with, and pretending otherwise would be theatre. */
  async changePassword(input) {
    await requireSignedIn();
    const fieldErrors: Record<string, string> = {};
    if (!input.currentPassword) fieldErrors.currentPassword = "Enter your current password.";
    if (input.newPassword.length < 8) fieldErrors.newPassword = "At least eight characters.";
    else if (input.newPassword === input.currentPassword) {
      fieldErrors.newPassword = "Choose a password different from the current one.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
  },

  async changeEmail(input) {
    const account = await requireSignedIn();
    if (account.role !== "customer") {
      throw new AppError("forbidden", "A coach's email address is changed by JoFit.", { status: 403 });
    }
    const email = input.email.trim().toLowerCase();
    const fieldErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "An email address we can reach you on.";
    else if (email === account.email.toLowerCase()) fieldErrors.email = "That is already your email address.";
    if (!input.currentPassword) fieldErrors.currentPassword = "Enter your current password.";
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppError("validation", "Some fields need attention.", { status: 422, details: { fieldErrors } });
    }
    if (findAccountByEmail(email) || staffEmails.includes(email)) {
      const message = "Another account already uses that email address.";
      throw new AppError("conflict", message, { status: 409, details: { fieldErrors: { email: message } } });
    }
    const store = accountStore();
    const index = store.customers.findIndex((entry) => entry.id === account.customerId);
    const customer = store.customers[index];
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    store.customers[index] = { ...customer, email };
    touch();
    return { account: { ...account, email } };
  },

  /* A mock session is one cookie per browser; there is no list of other
     sessions to end. The API keeps one row per token and deletes the others. */
  async signOutOtherSessions() {
    await requireSignedIn();
  },

  async listDemoAccounts(locale) {
    const store = accountStore();
    const customer = store.customers.find((entry) => entry.id === DEMO_CUSTOMER_ID)!;
    const coach = coachAccounts[0]!;
    const employer = store.employerAccounts[0]!;
    return [
      { role: "customer", email: customer.email, name: customer.name },
      { role: "coach", email: coach.email, name: resolveText(coach.name, locale) },
      { role: "employer", email: employer.email, name: store.employers.find((entry) => entry.id === employer.employerId)?.name ?? employer.name },
    ];
  },
};

async function requireSignedIn(): Promise<Account> {
  const id = await readSessionCredential();
  const account = id ? findAccountById(id) : null;
  if (!account) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
  return account;
}

/** Signs the account in: its id is the credential while the data is mock. */
async function startSession(account: Account): Promise<void> {
  await writeSessionCookies({ token: account.id }, account);
}

/** Prefilled on the sign-in screen while the mock answers: the demo customer. */
export const FIXTURE_EMAIL = "hussein@example.test";
export const FIXTURE_PASSWORD = "jofit-demo";
