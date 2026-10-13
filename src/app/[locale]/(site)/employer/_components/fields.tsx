import type { ReactNode } from "react";

import { Field as KitField, hintClasses, labelClasses } from "@/components/ui";

/**
 * The employer forms' field furniture, on the kit's field styles
 * (`inputClasses`, `selectClasses`, `textareaClasses` from `@/components/ui`
 * — the site's only form styles). Server markup: the labels, hints and choices
 * are drawn here; `EmployerForm` only marks a field `aria-invalid` when the
 * service or the pre-check flags it, and the kit's border reads that.
 *
 * `Field` is the kit's, with one addition these forms need: the word
 * "Optional" beside the label, quieter than it.
 */
export function Field({
  id,
  label,
  hint,
  optional,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  /** The word "Optional", shown beside the label. */
  optional?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <KitField
      htmlFor={id}
      hint={hint}
      className={className}
      label={
        optional ? (
          <>
            {label}
            <OptionalMark text={optional} />
          </>
        ) : (
          label
        )
      }
    >
      {children}
    </KitField>
  );
}

function OptionalMark({ text }: { text: string }) {
  return <span className="ms-2 text-[13px] font-normal text-body/70">{text}</span>;
}

/**
 * A set of choices drawn as the site's pills — radios for one of a few
 * (contract type, work mode), checkboxes for several (sports, languages).
 * The input is visually hidden inside its label, so the whole pill is the
 * target and the keyboard still moves through a real radio group.
 */
export function Choices({
  legend,
  name,
  type,
  options,
  selected,
  hint,
  optional,
  firstId,
}: {
  legend: string;
  name: string;
  type: "radio" | "checkbox";
  options: readonly { readonly value: string; readonly label: string }[];
  selected: readonly string[];
  hint?: string;
  optional?: string;
  /** The first input's id — where an error summary sends the cursor. */
  firstId: string;
}) {
  return (
    <fieldset>
      <legend className={labelClasses}>
        {legend}
        {optional ? <OptionalMark text={optional} /> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label
            key={option.value}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] font-medium text-body transition-colors hover:border-primary/40 hover:text-primary-dark has-checked:border-primary has-checked:bg-primary has-checked:text-on-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary has-aria-invalid:border-danger"
          >
            <input
              id={index === 0 ? firstId : undefined}
              type={type}
              name={name}
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {hint ? <p className={hintClasses}>{hint}</p> : null}
    </fieldset>
  );
}

/** One on/off setting, drawn as a switch. A real checkbox underneath. */
export function Switch({
  id,
  name,
  label,
  hint,
  checked,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-line bg-canvas px-4 py-3.5">
      <input id={id} type="checkbox" role="switch" name={name} value="1" defaultChecked={checked} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-1 after:start-1 after:size-4 after:rounded-full after:bg-surface after:shadow-soft after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
      />
      <span>
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[13px] leading-snug text-body/75">{hint}</span> : null}
      </span>
    </label>
  );
}
