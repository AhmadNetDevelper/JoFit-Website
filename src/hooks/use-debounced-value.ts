"use client";

import { useEffect, useState } from "react";

/**
 * Generic, domain-free: shared hooks live here only when they contain no
 * business knowledge. Anything that knows about products, rentals or coaches
 * belongs in that feature's own `hooks/` folder.
 */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 300): TValue {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
