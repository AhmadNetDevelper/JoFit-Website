import { siteConfig } from "@/config";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}

export type QueryParamValue = string | number | boolean | undefined | null;

export function buildQueryString(
  params: Record<string, QueryParamValue | readonly QueryParamValue[]>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === undefined || entry === null || entry === "") continue;
        search.append(key, String(entry));
      }
      continue;
    }
    search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

/** Next.js gives route search params as `string | string[] | undefined`. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function readParam(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function readParams(params: RawSearchParams, key: string): string[] {
  const value = params[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function readNumberParam(
  params: RawSearchParams,
  key: string,
): number | undefined {
  const raw = readParam(params, key);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
