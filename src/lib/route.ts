import type { RawSearchParams } from "./url";

/**
 * In the App Router, `params` and `searchParams` are Promises. Next's generated
 * `PageProps<"/route">` types cover route components; this helper normalises the
 * awaited search params for pages that may receive none.
 */
export async function resolveSearchParams(
  searchParams: Promise<RawSearchParams> | undefined,
): Promise<RawSearchParams> {
  return (await searchParams) ?? {};
}
