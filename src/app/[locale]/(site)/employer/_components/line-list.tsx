"use client";

import { useEffect, useRef, useState } from "react";

import { inputClasses } from "@/components/ui";

/**
 * A list written one line at a time — a job's requirements or its benefits.
 *
 * Every line is its own `<input name={name}>`, so the form posts them as a
 * list (`formData.getAll(name)`) and a blank line is simply dropped. The
 * inputs are uncontrolled and keyed, so removing line 2 keeps what was typed
 * in line 3. Adding a line moves the cursor to it.
 *
 * All wording arrives finished; `{n}` in a label is the line's number.
 */
export function LineList({
  name,
  id,
  initial,
  max,
  listLabel,
  lineLabel,
  addLabel,
  removeLabel,
}: {
  name: string;
  /** The first line's id — where an error summary sends the cursor. */
  id: string;
  initial: readonly string[];
  max: number;
  listLabel: string;
  /** e.g. "Requirements, line {n}" */
  lineLabel: string;
  addLabel: string;
  /** e.g. "Remove line {n}" */
  removeLabel: string;
}) {
  const [rows, setRows] = useState(() =>
    (initial.length > 0 ? initial : [""]).map((value, index) => ({ key: index, value })),
  );
  const nextKey = useRef(rows.length);
  const focusKey = useRef<number | null>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (focusKey.current === null) return;
    list.current?.querySelector<HTMLInputElement>(`[data-key="${focusKey.current}"]`)?.focus();
    focusKey.current = null;
  }, [rows]);

  const add = () => {
    const key = nextKey.current++;
    focusKey.current = key;
    setRows((current) => [...current, { key, value: "" }]);
  };

  const remove = (key: number) =>
    setRows((current) => (current.length === 1 ? [{ key: nextKey.current++, value: "" }] : current.filter((row) => row.key !== key)));

  const numbered = (template: string, n: number) => template.replace("{n}", String(n)).replace("{list}", listLabel);

  return (
    <div>
      <ol ref={list} className="grid gap-2">
        {rows.map((row, index) => (
          <li key={row.key} className="flex items-stretch gap-2">
            <span
              aria-hidden="true"
              dir="ltr"
              className="grid size-8 shrink-0 self-center place-items-center rounded-full bg-canvas font-heading text-[12.5px] font-bold text-body ring-1 ring-line tabular-nums"
            >
              {index + 1}
            </span>
            <input
              id={index === 0 ? id : `${id}-${row.key}`}
              data-key={row.key}
              name={name}
              defaultValue={row.value}
              maxLength={200}
              dir="auto"
              aria-label={numbered(lineLabel, index + 1)}
              className={inputClasses("min-w-0 flex-1")}
            />
            <button
              type="button"
              onClick={() => remove(row.key)}
              aria-label={numbered(removeLabel, index + 1)}
              className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-[18px] leading-none text-body transition-colors hover:border-danger/50 hover:bg-danger-05 hover:text-danger"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={add}
        disabled={rows.length >= max}
        className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary-05 ps-3 pe-4 text-[14px] font-semibold text-primary-dark transition-colors hover:bg-primary-10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-[15px] leading-none text-on-primary">
          +
        </span>
        {addLabel}
      </button>
    </div>
  );
}
