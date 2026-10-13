"use client";

import { useState } from "react";

import { hintClasses, labelClasses } from "@/components/ui";

/**
 * The cover letter, with a live character count — the one thing on the
 * application form that needs the browser. It is still a plain named
 * `<textarea>`, so the Server Action reads it from the form like any other
 * field and the form works before this hydrates. Every word arrives finished
 * from the server; only the digits are computed here. The textarea's look is
 * the kit's (`textareaClasses`), passed in by the page.
 */
export function CoverLetterField({
  id,
  name,
  label,
  hint,
  min,
  max,
  className,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  className: string;
}) {
  const [length, setLength] = useState(0);
  const short = length > 0 && length < min;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
        <span
          aria-hidden="true"
          dir="ltr"
          className={`text-[12.5px] tabular-nums ${short || length > max ? "font-semibold text-danger" : "text-body/60"}`}
        >
          {`${length} / ${max}`}
        </span>
      </div>
      <textarea
        id={id}
        name={name}
        required
        minLength={min}
        maxLength={max}
        rows={8}
        dir="auto"
        aria-describedby={`${id}-hint`}
        onChange={(event) => setLength(event.target.value.trim().length)}
        className={className}
      />
      <p id={`${id}-hint`} className={hintClasses}>
        {hint}
      </p>
    </div>
  );
}
