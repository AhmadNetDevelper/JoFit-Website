"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui";

import { IDLE, type FormState } from "../../_components/portal/action-form";

/**
 * THE EMPLOYER AREA'S LONGER FORMS — the job editor, the company profile, an
 * application's next step.
 *
 * The same contract as the portal's `ActionForm` (a real `<form action>`, the
 * values kept while a refusal is shown, the message read out when it comes
 * back), with the two things a long form needs on top:
 *
 *   - MORE THAN ONE SUBMIT. "Save draft" and "Submit for review" are one form
 *     with two intents. The button pressed travels as `intent`, before
 *     hydration too, because a native submission carries its submitter.
 *   - ERRORS THAT POINT AT THEIR FIELD. Each refusal is listed with the name
 *     of the field it is about and a link that puts the cursor there, and the
 *     field itself is marked `aria-invalid` so its border turns. The fields
 *     are server markup; only their names are known here.
 */
export interface FormButton {
  readonly intent: string;
  readonly label: string;
  readonly tone?: "primary" | "quiet" | "danger";
}

/* The kit's pills. Danger has no kit variant (only these forms end something
   for good), so it is the same pill in the danger colour. */
const BUTTON: Readonly<Record<NonNullable<FormButton["tone"]>, string>> = {
  primary: buttonClasses({ className: "disabled:cursor-wait" }),
  quiet: buttonClasses({ variant: "outline", className: "bg-surface disabled:cursor-wait" }),
  danger:
    "relative inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-danger px-6 text-[15px] font-semibold whitespace-nowrap text-on-primary transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50",
};

export function EmployerForm({
  action,
  buttons,
  pendingLabel,
  fields = {},
  fixLabel,
  footnote,
  children,
  className = "",
  resetOnSuccess = false,
  noValidate = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  buttons: readonly FormButton[];
  pendingLabel: string;
  /** Field name → its label and the id of the control to focus. */
  fields?: Readonly<Record<string, { readonly label: string; readonly id: string }>>;
  /** The heading over a list of several refusals. */
  fixLabel?: string;
  /** A line beside the buttons, e.g. "Saving sends this job back for review." */
  footnote?: ReactNode;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Leave the checking to the server, whose refusals are in the page's language (a browser's are in its own). */
  noValidate?: boolean;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  const [intent, setIntent] = useState<string>();
  const form = useRef<HTMLFormElement>(null);
  const flagged = Object.entries(state.fieldErrors ?? {});

  /* Mark the flagged fields, and clear the marks a corrected submission left. */
  useEffect(() => {
    const root = form.current;
    if (!root) return;
    root.querySelectorAll("[aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));
    if (state.status !== "error") return;
    for (const name of Object.keys(state.fieldErrors ?? {})) {
      root.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach((node) => node.setAttribute("aria-invalid", "true"));
    }
  }, [state]);

  const focus = (id: string) => {
    const target = document.getElementById(id);
    target?.focus();
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <form
      ref={form}
      action={run}
      /* React resets a form after an `action` submission, a refused one too,
         which would empty every box the person has to correct. Once hydrated
         the submission is dispatched here instead, with the pressed button as
         the submitter so its `intent` is in the data. */
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const data = new FormData(event.currentTarget, submitter);
        setIntent(submitter?.value);
        startTransition(() => run(data));
      }}
      /* A field the person has started correcting stops being marked. */
      onInput={(event) => (event.target as Element).removeAttribute("aria-invalid")}
      key={resetOnSuccess && state.status === "ok" ? state.message : undefined}
      noValidate={noValidate}
      className={className}
    >
      {children}

      <div aria-live="polite" className="empty:hidden">
        {state.status === "error" ? (
          <div className="mt-6 rounded-2xl border border-danger/25 bg-danger-05 px-4 py-3.5 text-[14px] text-danger">
            <p className="font-semibold">{flagged.length > 1 && fixLabel ? fixLabel : state.message}</p>
            {flagged.length > 1 || (flagged.length === 1 && flagged[0]![1] !== state.message) ? (
              <ul className="mt-2 space-y-1">
                {flagged.map(([name, message]) => {
                  const field = fields[name];
                  return (
                    <li key={name}>
                      {field ? (
                        <a
                          href={`#${field.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            focus(field.id);
                          }}
                          className="font-semibold underline underline-offset-4"
                        >
                          {field.label}
                        </a>
                      ) : null}
                      {field ? " — " : null}
                      {message}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : state.status === "ok" && state.message ? (
          <p className="mt-6 rounded-2xl border border-primary/20 bg-primary-05 px-4 py-3.5 text-[14px] font-medium text-primary-dark">{state.message}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3">
        {buttons.map((button) => (
          <button
            key={button.intent}
            type="submit"
            name="intent"
            value={button.intent}
            disabled={pending}
            className={BUTTON[button.tone ?? "primary"]}
          >
            {pending && intent === button.intent ? pendingLabel : button.label}
          </button>
        ))}
        {footnote}
      </div>
    </form>
  );
}
