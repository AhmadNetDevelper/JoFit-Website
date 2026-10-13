"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { buttonClasses, inputClasses, labelClasses, type ButtonVariant } from "@/components/ui";

/**
 * Where "remember me" writes the email.
 *
 * THE EMAIL ONLY. Never the password — not even in a mock whose password is
 * ignored, because the shape of the code is what the next person copies, and
 * "we stored a password in localStorage" is not a habit worth seeding.
 *
 * It is also NOT a session. The mock keeps its session in memory on purpose
 * (see `auth.mock.ts`: a real session belongs in an httpOnly cookie the server
 * sets). Remembering the address you type is a convenience and is honestly all
 * this can promise until that cookie exists.
 */
const REMEMBERED_EMAIL = "jofit.signin.email";

/*
 * Storage read as an EXTERNAL STORE rather than copied into state by an effect.
 *
 * The obvious version — `useEffect(() => setEmail(localStorage.getItem(...)))`
 * — works, and React's own lint rejects it, correctly: it renders once with the
 * wrong value and schedules a second render to fix it. Seeding the initial
 * state instead is worse, because the server has no localStorage and the two
 * renders would disagree, which throws out the whole tree.
 *
 * `useSyncExternalStore` is built for exactly this split: the server snapshot
 * is null so both sides agree on the first paint, and React re-renders with the
 * real value straight after hydration.
 */
function subscribeToStorage(onChange: () => void) {
  /* Only fires for writes from OTHER tabs, which is all that needs watching —
     this form's own write happens after the value is already on screen. */
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readRememberedEmail(): string | null {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL);
  } catch {
    /* Private window, cleared site data, or a policy that blocks storage: the
       getter itself throws rather than returning null. */
    return null;
  }
}

/* The server has nothing remembered, by definition. */
const noRememberedEmail = (): string | null => null;

/**
 * The form is the only interactive part of the screen, so it is the only part
 * that ships to the browser. Its copy arrives as plain strings for the reason
 * every other client leaf in this codebase does: the dictionary stays on the
 * server, and a translator function is not serialisable across the boundary.
 */
export interface SignInCopy {
  readonly emailLabel: string;
  readonly emailPlaceholder: string;
  readonly passwordLabel: string;
  readonly passwordPlaceholder: string;
  readonly submit: string;
  readonly submitting: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly fixtureNotice: string;
  readonly success: string;
  readonly remember: string;
  readonly createAccount: string;
  readonly noAccount: string;
  /** "Try a demo account" — shown only while the mock answers. */
  readonly demoTitle: string;
}

/** A development account the visitor can drop into the form with one click. */
export interface DemoAccountView {
  readonly email: string;
  /** "Customer · Hussein Ayoub" — already translated. */
  readonly label: string;
}

export function SignInForm({
  copy,
  action,
  defaults,
  createAccountHref,
  demoAccounts = [],
  variant = "primary",
}: {
  copy: SignInCopy;
  /** The door's colour: the one filled pill on the screen takes it. */
  variant?: ButtonVariant;
  /**
   * Server Action. Resolves to an error message; on success it REDIRECTS —
   * the customer to their account, a coach to the coach area — so the promise
   * only settles here when something went wrong.
   */
  action: (email: string, password: string) => Promise<string | null>;
  demoAccounts?: readonly DemoAccountView[];
  /**
   * The fixture account, prefilled while the mock adapter is the one answering.
   * Empty strings once a real backend is wired, so the day this ships nobody
   * has to remember to take the demo credentials out of the login screen.
   */
  defaults: { readonly email: string; readonly password: string };
  createAccountHref: string;
}) {
  const [password, setPassword] = useState(defaults.password);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const remembered = useSyncExternalStore(
    subscribeToStorage,
    readRememberedEmail,
    noRememberedEmail,
  );

  /*
   * Three sources, in priority order: what the visitor typed, what was
   * remembered, and the fixture default. `null` means "not typed yet", which a
   * bare `""` could not express — an empty string is a thing someone can
   * deliberately type, and treating it as "untouched" would snap the field
   * back to the default the moment they cleared it.
   */
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [typedRemember, setTypedRemember] = useState<boolean | null>(null);
  const email = typedEmail ?? remembered ?? defaults.email;
  const remember = typedRemember ?? remembered !== null;

  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const message = await action(email, password);
        setPending(false);
        if (message) {
          setError(message);
          return;
        }
        /* Only on success. Remembering an address that was just rejected
           would hand it straight back on the next visit. */
        try {
          if (remember) window.localStorage.setItem(REMEMBERED_EMAIL, email);
          else window.localStorage.removeItem(REMEMBERED_EMAIL);
        } catch {
          /* See above. */
        }
        setDone(true);
      }}
      className="space-y-5"
    >
      {/* The kit's fields — the one field style on the site. */}
      <div>
        <label htmlFor="email" className={labelClasses}>
          {copy.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setTypedEmail(event.target.value)}
          placeholder={copy.emailPlaceholder}
          className={inputClasses()}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClasses}>
          {copy.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.passwordPlaceholder}
            className={inputClasses("pe-20")}
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            aria-pressed={visible}
            className="absolute inset-y-1 end-1 cursor-pointer rounded-lg px-3.5 text-[13px] font-semibold text-primary-dark transition-colors hover:bg-primary-05"
          >
            {visible ? copy.hidePassword : copy.showPassword}
          </button>
        </div>
      </div>

      {/*
        The label wraps the input, so the words are part of the hit target
        rather than something to aim past — on a phone the box alone is well
        under the 44px a thumb needs.
      */}
      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-body select-none">
        <input
          type="checkbox"
          name="remember"
          checked={remember}
          onChange={(event) => setTypedRemember(event.target.checked)}
          className="size-4 cursor-pointer accent-primary"
        />
        {copy.remember}
      </label>

      {error ? (
        <p
          role="alert"
          /* The service writes this sentence, and not always in the page's
             language: let it take its own direction. */
          dir="auto"
          className="rounded-xl border border-danger/20 bg-danger-05 px-4 py-3 text-[14px] text-danger"
        >
          {error}
        </p>
      ) : null}

      {done ? (
        <p
          role="status"
          className="rounded-xl border border-primary/20 bg-primary-05 px-4 py-3 text-[14px] font-medium text-primary-dark"
        >
          {copy.success}
        </p>
      ) : null}

      {/* The one filled action on the screen: signing in is what almost
          everyone here came to do. */}
      <button type="submit" disabled={pending} className={buttonClasses({ variant, size: "lg", className: "w-full" })}>
        {pending ? copy.submitting : copy.submit}
      </button>

      {/*
        The second action is a LINK, not a second filled button. Two buttons of
        equal weight make the visitor choose before they have read either;
        signing in keeps the pill and creating an account sits underneath it
        as text.
      */}
      <p className="text-center text-[14px] text-body">
        {copy.noAccount}{" "}
        <Link
          href={createAccountHref}
          className="font-semibold text-primary-dark underline decoration-1 underline-offset-4 hover:text-primary"
        >
          {copy.createAccount}
        </Link>
      </p>

      {demoAccounts.length > 0 ? (
        /* One per role, so both halves of the lifecycle can be walked through:
           book as the customer, then sign in as the coach and confirm it. */
        <div className="border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-ink">{copy.demoTitle}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => setTypedEmail(demo.email)}
                aria-pressed={email === demo.email}
                className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-primary/50 aria-pressed:border-primary aria-pressed:bg-primary-05 aria-pressed:text-primary-dark"
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-[12.5px] leading-relaxed text-body/75">{copy.fixtureNotice}</p>
    </form>
  );
}
