import type { Locale } from "@/i18n/locales";

import type { Sport, SportListQuery } from "../types";

/**
 * Every read takes a locale, because every read returns text. The adapter is
 * responsible for resolving it — the same job an HTTP adapter will do by sending
 * an `Accept-Language` header.
 */
export interface SportsService {
  list(query: SportListQuery): Promise<readonly Sport[]>;
  getBySlug(slug: string, locale: Locale): Promise<Sport | null>;
  getManyByIds(ids: readonly string[], locale: Locale): Promise<readonly Sport[]>;
}
