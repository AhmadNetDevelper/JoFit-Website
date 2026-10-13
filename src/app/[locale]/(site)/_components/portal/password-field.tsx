"use client";

import { useState } from "react";

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
}) {
  const [visible, setVisible] = useState(false);
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
      {/* LTR as a unit: a password is typed left to right in every language,
          and the Show button must sit at the end of THAT box, not the page's. */}
      <div className="relative" dir="ltr">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
          className={inputClasses("pe-20")}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-1.5 end-1.5 cursor-pointer rounded-lg px-3 text-[13px] font-semibold text-primary-dark transition-colors hover:bg-primary-05"
        >
          {visible ? hideLabel : showLabel}
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={hintClasses}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className={errorClasses}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
