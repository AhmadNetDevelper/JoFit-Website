"use client";

import { useEffect, useRef, useState } from "react";

import { inputClasses } from "@/components/ui";

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
}) {
  const [visible, setVisible] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const input = useRef<HTMLInputElement>(null);
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
