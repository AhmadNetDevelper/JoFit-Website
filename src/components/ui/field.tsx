import type { ReactNode } from "react";

/**
 * FORM FIELDS — one look for every form on the site.
 *
 * Before the formal redesign each form page carried its own `const FIELD = …`
 * (eight of them, all slightly different). These are the only field styles
 * now: 48px controls, 12px corners, a hairline border that turns brand green
 * with a soft ring on focus, and a red border when `aria-invalid` is set — so
 * the error state comes from the same attribute a screen reader reads.
 *
 * Classes rather than components, because the forms here are a mix of server
 * forms, client forms and Server Actions, and a class list travels to all of
 * them without deciding how the value is held.
 */
const BASE =
  "rounded-xl border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-body/45 " +
  "transition-[border-color,box-shadow] duration-200 outline-none focus-visible:outline-none " +
  "focus:border-primary focus:ring-4 focus:ring-primary/12 " +
  "aria-invalid:border-danger aria-invalid:ring-danger/10 disabled:cursor-not-allowed disabled:opacity-60";

/*
 * Full width unless the caller sets a width of its own: two width utilities on
 * one element are settled by stylesheet order, not by which was written last,
 * so `inputClasses("w-28")` must not also carry `w-full`. Only a bare `w-*`
 * counts; `sm:w-40` sits in a media query that already comes later.
 */
function width(className: string) {
  return /(^|\s)w-/.test(className) ? "" : "w-full";
}

export function inputClasses(className = "") {
  return `${BASE} ${width(className)} h-12 ${className}`;
}

export function textareaClasses(className = "") {
  return `${BASE} ${width(className)} min-h-32 py-3 leading-relaxed ${className}`;
}

/* The chevron (`.select-chevron`, globals.css) sits in the end padding. */
export function selectClasses(className = "") {
  return `${BASE} ${width(className)} select-chevron h-12 cursor-pointer appearance-none pe-11 ${className}`;
}

export const labelClasses = "mb-2 block text-[14px] font-semibold text-ink";
export const hintClasses = "mt-1.5 text-[13px] leading-snug text-body/70";
export const errorClasses = "mt-1.5 text-[13px] font-medium text-danger";

/**
 * A labelled field: label, the control (passed in), an optional hint and an
 * optional error. The caller owns the control's `id`, `aria-invalid` and
 * `aria-describedby`, because only the caller knows the field's name.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className={hintClasses}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className={errorClasses}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
