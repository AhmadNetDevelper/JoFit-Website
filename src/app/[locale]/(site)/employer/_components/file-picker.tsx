"use client";

import { useEffect, useState } from "react";

/**
 * A file field that speaks the page's language.
 *
 * A native `<input type="file">` draws its button and its "No file chosen"
 * in the BROWSER's language, so an Arabic page shows English controls. Here
 * the input is still the real one (it is what the form posts, and it works
 * before hydration), visually hidden behind a label drawn as the site's
 * button; the chosen file's name and a preview of it appear beside it.
 */
export function FilePicker({
  id,
  name,
  accept,
  chooseLabel,
  emptyLabel,
  describedBy,
}: {
  id: string;
  name: string;
  accept: string;
  chooseLabel: string;
  /** Shown until a file is chosen. */
  emptyLabel: string;
  describedBy?: string;
}) {
  const [file, setFile] = useState<{ name: string; url?: string }>();

  useEffect(() => () => (file?.url ? URL.revokeObjectURL(file.url) : undefined), [file]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
      <label
        htmlFor={id}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-primary/35 bg-primary-05 px-5 text-[14px] font-semibold text-primary-dark transition-colors hover:border-primary hover:bg-primary-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M8 10.6V2.2M4.6 5.6 8 2.2l3.4 3.4M2.2 10.4v3.4h11.6v-3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {chooseLabel}
        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          aria-describedby={describedBy}
          className="sr-only"
          onChange={(event) => {
            const chosen = event.currentTarget.files?.[0];
            setFile(
              chosen
                ? { name: chosen.name, url: chosen.type.startsWith("image/") ? URL.createObjectURL(chosen) : undefined }
                : undefined,
            );
          }}
        />
      </label>
      <span className="flex min-w-0 items-center gap-3 text-[13px] text-body">
        {file?.url ? (
          /* A local preview of a file not yet uploaded: an object URL, which next/image cannot take. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt="" className="size-10 shrink-0 rounded-xl border border-line bg-surface object-contain" />
        ) : null}
        <span dir={file ? "ltr" : undefined} className="min-w-0 truncate">
          {file ? file.name : emptyLabel}
        </span>
      </span>
    </div>
  );
}
