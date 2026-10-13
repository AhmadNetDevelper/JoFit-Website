"use client";

import { useState } from "react";

import { hintClasses, labelClasses } from "@/components/ui";

/**
 * The CV picker. A native file input draws its button and its "No file
 * chosen" in the BROWSER's language, not the page's — English words in the
 * middle of an Arabic form. So the input itself is visually hidden (still
 * focusable, still the field the Server Action reads) and this draws the
 * button and the chosen file's name with finished strings from the server.
 *
 * The drop area is the kit's field language at a larger size: a dashed
 * hairline on the canvas, 16px corners, the brand focus ring; the button is a
 * pill. Once a file is chosen the area turns to the brand tint and shows a
 * document mark beside the name, so the state is read without the words.
 */
export function CvField({
  id,
  name,
  accept,
  label,
  hint,
  choose,
  change,
  none,
}: {
  id: string;
  name: string;
  accept: string;
  label: string;
  hint: string;
  choose: string;
  change: string;
  none: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <label
        htmlFor={id}
        className={[
          "flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-dashed p-4 transition-[border-color,background-color,box-shadow] duration-200",
          "has-[:focus-visible]:border-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/12",
          fileName ? "border-primary/40 bg-primary-05" : "border-line bg-canvas hover:border-primary/40",
        ].join(" ")}
      >
        <input
          id={id}
          name={name}
          type="file"
          required
          accept={accept}
          aria-describedby={`${id}-hint`}
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-full ${fileName ? "bg-primary text-on-primary" : "bg-surface text-primary ring-1 ring-line"}`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 2H5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 5 16h8a1.5 1.5 0 0 0 1.5-1.5V6L10.5 2Z" />
            <path d="M10.5 2v4h4M6.5 10h5M6.5 12.8h3.5" />
          </svg>
        </span>
        <span className={`min-w-0 flex-1 text-[14px] [overflow-wrap:anywhere] ${fileName ? "font-semibold text-ink" : "text-body/75"}`}>
          {fileName ? <span dir="auto">{fileName}</span> : none}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-[13px] font-semibold text-on-primary"
        >
          {fileName ? change : choose}
        </span>
      </label>
      <p id={`${id}-hint`} className={hintClasses}>
        {hint}
      </p>
    </div>
  );
}
