"use client";

import { startTransition, useActionState, type ReactNode } from "react";

import { buttonClasses, type ButtonSize } from "@/components/ui";

/**
 * What every portal Server Action answers with. Returned, never thrown: a
 * thrown error inside an action reaches the browser as an opaque digest and the
 * person learns nothing.
 */
export interface FormState {
  readonly status: "idle" | "ok" | "error";
  readonly message?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

export const IDLE: FormState = { status: "idle" };

/* The kit has no danger pill; this is `buttonClasses`' shape in the danger ink. */
const DANGER =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-danger font-semibold whitespace-nowrap text-on-primary transition-[filter,opacity] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

/* The kit's three pill sizes, for the danger pill. */
const DANGER_SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
};

/**
 * The one interactive wrapper the signed-in screens share (and the public forms
 * that post to a Server Action: sign-up, enrol, apply, quotations).
 *
 * The fields themselves stay server-rendered and arrive as `children`; this
 * only owns the three things that need the browser: the pending state, the
 * message that comes back, and keeping the form's values while it is shown. It
 * is a real `<form action>`, so a submission works before hydration too.
 *
 * Errors are listed above the button in a live region rather than beside each
 * field: the fields are server markup this component does not own, and a list
 * of what to fix, read out when it appears, is the part of per-field errors
 * that matters.
 *
 * The submit button is a pill from the kit, and it stays a DIRECT child of the
 * form: callers adjust it with `[&>button]:…` (its margin, say).
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
  tone = "primary",
  className = "",
  submitClassName = "",
  submitSize = "md",
  resetOnSuccess = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
  children?: ReactNode;
  /** `danger` for cancelling something a person paid for; `quiet` for a second action. */
  tone?: "primary" | "danger" | "quiet";
  className?: string;
  /**
   * Extra classes for the submit pill, e.g. `w-full`. For a bigger pill use
   * `submitSize`, not size classes here (they fight the pill's own); for its
   * margin, `[&>button]:mt-…` on `className`.
   */
  submitClassName?: string;
  /** The pill's size, as in `buttonClasses`: `lg` for the one action of a form page. */
  submitSize?: ButtonSize;
  resetOnSuccess?: boolean;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  const errors = Object.values(state.fieldErrors ?? {});

  const button =
    tone === "danger"
      ? `${DANGER} ${DANGER_SIZES[submitSize]} ${submitClassName}`
      : buttonClasses({ variant: tone === "quiet" ? "outline" : "primary", size: submitSize, className: submitClassName });

  return (
    <form
      action={run}
      /* React resets a form after every \`action\` submission — a refused one
         too — which would empty every box the person has to correct. Once
         hydrated, the submission is dispatched here instead, so the values
         stay; \`action\` still carries it before JavaScript has loaded, and a
         success with \`resetOnSuccess\` still clears the form through the key. */
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => run(data));
      }}
      /* A new key after a success remounts the form, which is the reset. */
      key={resetOnSuccess && state.status === "ok" ? state.message : undefined}
      className={className}
    >
      {children}

      <div aria-live="polite" className="empty:hidden">
        {state.status === "error" ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-danger/20 bg-danger-05 px-4 py-3.5 text-[14px] text-danger">
            <NoticeIcon kind="error" />
            <div className="min-w-0">
              <p className="font-semibold">{state.message}</p>
              {errors.length > 0 && errors[0] !== state.message ? (
                <ul className="mt-1.5 list-disc space-y-0.5 ps-5 marker:text-danger/60">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : state.status === "ok" && state.message ? (
          <p className="mt-5 flex gap-3 rounded-2xl border border-primary/20 bg-primary-05 px-4 py-3.5 text-[14px] font-medium text-primary-dark">
            <NoticeIcon kind="ok" />
            <span className="min-w-0">{state.message}</span>
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} aria-busy={pending || undefined} className={`mt-5 ${button}`}>
        {pending ? <Spinner /> : null}
        <span>{pending ? pendingLabel : submitLabel}</span>
      </button>
    </form>
  );
}

function NoticeIcon({ kind }: { kind: "ok" | "error" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="mt-px shrink-0">
      <circle cx="9" cy="9" r="7.25" />
      {kind === "ok" ? (
        <path d="m5.8 9.2 2.2 2.2 4.2-4.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 5.2v4.6M9 12.4v.1" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-spin motion-reduce:animate-none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
