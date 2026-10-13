import { apiConfig } from "@/config";

/**
 * Helpers shared by every mock adapter.
 *
 * Everything under `src/mocks` is deletable: when the backend lands, the HTTP
 * adapters replace the mock adapters and this whole tree is removed. Nothing
 * outside `features/*​/services/*.mock.ts` may import from here.
 */
export async function simulateLatency(): Promise<void> {
  if (apiConfig.mockLatencyMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, apiConfig.mockLatencyMs));
}

export function matchesText(haystack: readonly (string | undefined)[], needle?: string): boolean {
  if (!needle) return true;
  const term = needle.trim().toLowerCase();
  if (!term) return true;
  return haystack.some((value) => value?.toLowerCase().includes(term));
}

export function matchesAny(values: readonly string[], allowed?: readonly string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return values.some((value) => allowed.includes(value));
}

export function inRange(value: number, range?: { min?: number; max?: number }): boolean {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

/** Deterministic ordering so server and client renders agree. */
export function sortBy<TItem>(
  items: readonly TItem[],
  compare: (a: TItem, b: TItem) => number,
): TItem[] {
  return [...items].sort(compare);
}

export function countFacet<TItem>(
  items: readonly TItem[],
  select: (item: TItem) => readonly string[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const value of select(item)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}
