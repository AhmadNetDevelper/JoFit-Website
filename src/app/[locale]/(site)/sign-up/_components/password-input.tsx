"use client";

import { useEffect, useRef, useState } from "react";

import { inputClasses } from "@/components/ui";

const RULES = [
  { id: "length", test: (value: string) => value.length >= 8 },
  { id: "lower", test: (value: string) => /[a-z]/.test(value) },
  { id: "upper", test: (value: string) => /[A-Z]/.test(value) },
  { id: "digit", test: (value: string) => /\d/.test(value) },
  { id: "symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

const LEVEL_BAR = ["bg-danger", "bg-accent", "bg-primary"] as const;
const LEVEL_TEXT = ["text-danger", "text-body", "text-primary-dark"] as const;

export interface StrengthCopy {
  /** The browser's validity message while a rule is unmet. */
  invalid: string;
  /** Weak, medium, strong. */
  levels: readonly [string, string, string];
  rules: Record<(typeof RULES)[number]["id"], string>;
}

/**
 * The sign-up password box with an eye button to show or hide what was typed.
 * A plain named input, so the Server Action reads it from the form as usual.
 * It follows the page direction, so the eye is on the right in English and on
 * the left in Arabic.
 */
export function PasswordInput({
  id,
  name,
  autoComplete,
  minLength,
  showLabel,
  hideLabel,
  matchName,
  mismatchMessage,
  strength,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  showLabel: string;
  hideLabel: string;
  /** Another field of the form this one must equal; until it does the box is invalid. */
  matchName?: string;
  mismatchMessage?: string;
  /**
   * Turns on the strength meter. Until every rule is met the box is invalid, so
   * a form that waits on `checkValidity()` keeps its submit button off.
   */
  strength?: StrengthCopy;
}) {
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [passed, setPassed] = useState<readonly boolean[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const box = input.current;
    const form = box?.form;
    if (!box || !form || !strength) return;
    const check = () => {
      const results = RULES.map((rule) => rule.test(box.value));
      box.setCustomValidity(results.every(Boolean) ? "" : strength.invalid);
      setPassed(box.value === "" ? null : results);
    };
    check();
    form.addEventListener("input", check);
    return () => form.removeEventListener("input", check);
  }, [strength]);
  const met = passed?.filter(Boolean).length ?? 0;
  const level = met === RULES.length ? 2 : met >= 3 ? 1 : 0;
  useEffect(() => {
    const box = input.current;
    const form = box?.form;
    if (!box || !form || !matchName) return;
    const check = () => {
      const other = form.elements.namedItem(
        matchName,
      ) as HTMLInputElement | null;
      const differs = Boolean(other) && box.value !== other!.value;
      box.setCustomValidity(differs ? (mismatchMessage ?? "") : "");
      /* Only once something is typed here, so an untouched box is not scolded. */
      setMismatch(differs && box.value !== "");
    };
    check();
    form.addEventListener("input", check);
    return () => form.removeEventListener("input", check);
  }, [matchName, mismatchMessage]);
  return (
    <div>
      <div className="relative">
        <input
          ref={input}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? `${id}-error` : undefined}
          className={inputClasses("pe-14")}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className="absolute inset-y-1.5 end-1.5 grid w-10 cursor-pointer place-items-center rounded-lg text-body transition-colors hover:bg-primary-05 hover:text-primary-dark"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? null : <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {strength && passed ? (
        <div className="mt-2.5" aria-live="polite">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${bar <= level ? LEVEL_BAR[level] : "bg-line"}`}
                />
              ))}
            </div>
            <p className={`text-[13px] font-semibold ${LEVEL_TEXT[level]}`}>{strength.levels[level]}</p>
          </div>
          <ul className="mt-2 grid gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-2">
            {RULES.map((rule, index) => (
              <li key={rule.id} className={`flex items-center gap-1.5 ${passed[index] ? "text-primary-dark" : "text-body/70"}`}>
                <span aria-hidden="true">{passed[index] ? "✓" : "○"}</span>
                {strength.rules[rule.id]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {mismatch ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-[13px] font-medium text-danger"
        >
          {mismatchMessage}
        </p>
      ) : null}
    </div>
  );
}
