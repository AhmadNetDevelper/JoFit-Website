"use client";

import { useEffect, useRef, useState } from "react";

import { errorClasses, hintClasses, inputClasses, labelClasses } from "@/components/ui";

/**
 * A password box with Show / Hide, for the signed-in screens. The field is a
 * plain named input, so the Server Action reads it from the form like any
 * other; this only owns whether it is shown. It wears the kit's field styles.
 */
export function PasswordField({
  id,
  name,
  label,
  hint,
  autoComplete,
  showLabel,
  hideLabel,
  error,
  markRequired = false,
  matchName,
  mismatchMessage,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
  /** A message for this field; marks the box invalid. */
  error?: string;
  /** The red star `Field` shows on a required label, for a form that marks them. */
  markRequired?: boolean;
  /** Another field of the form this one must equal; until it does the box is invalid and says so. */
  matchName?: string;
  mismatchMessage?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const box = input.current;
    const form = box?.form;
    if (!box || !form || !matchName) return;
    const check = () => {
      const other = form.elements.namedItem(matchName) as HTMLInputElement | null;
      const differs = Boolean(other) && box.value !== other!.value;
      box.setCustomValidity(differs ? (mismatchMessage ?? "") : "");
      /* Only once something is typed here, so an untouched box is not scolded. */
      setMismatch(differs && box.value !== "");
    };
    check();
    form.addEventListener("input", check);
    return () => form.removeEventListener("input", check);
  }, [matchName, mismatchMessage]);
  const message = mismatch ? mismatchMessage : error;
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
        {markRequired ? (
          <span aria-hidden="true" className="ms-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      {/* Follows the page direction: the eye sits at the end of the box, so on
          the right in English and on the left in Arabic. */}
      <div className="relative">
        <input
          ref={input}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          aria-invalid={message ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : "", message ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? null : <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={hintClasses}>
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={`${id}-error`} role="alert" className={errorClasses}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
