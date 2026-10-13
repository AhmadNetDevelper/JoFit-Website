"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks";
import { buildQueryString } from "@/lib";

/**
 * Client component because it owns transient input state. It writes the term to
 * the URL rather than to a store, so the server re-renders the results: search
 * stays shareable, cacheable and server-rendered.
 */
export function SearchBox({
  scope,
  basePath,
  labels,
}: {
  scope?: string;
  /** Already locale-prefixed by the caller. */
  basePath: string;
  labels: { label: string; placeholder: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(term, 350);

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (debounced === current) return;
    router.replace(`${basePath}${buildQueryString({ q: debounced, scope })}`);
  }, [debounced, params, router, scope, basePath]);

  return (
    <div>
      {/*
        The label is for screen readers only. On this page the field is the
        hero, directly under a heading that says what it searches, so a visible
        "Search the platform" above it would be the same sentence twice.
      */}
      <label htmlFor="search-term" className="sr-only">
        {labels.label}
      </label>
      <input
        id="search-term"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={labels.placeholder}
        autoComplete="off"
        /* A white pill on the dark band rather than a bordered box: this is the
           one control the page exists for, and it should look like the thing
           you type into. The start padding leaves room for the glyph the
           caller lays over the field's start edge. */
        className="h-14 w-full rounded-full border-0 bg-white ps-14 pe-6 text-[16px] text-ink shadow-lift outline-none placeholder:text-body/50 focus-visible:ring-2 focus-visible:ring-accent"
      />
    </div>
  );
}
