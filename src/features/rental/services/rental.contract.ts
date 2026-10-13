import type { Locale } from "@/i18n";
import type { DateRange, SitemapEntry } from "@/types";

import type {
  RentalAvailability,
  RentalCategory,
  RentalItem,
  RentalListQuery,
  RentalListResult,
  RentalPeriod,
  RentalQuote,
} from "../types";

export interface RentalService {
  listItems(query: RentalListQuery): Promise<RentalListResult>;
  getItemBySlug(slug: string, locale: Locale): Promise<RentalItem | null>;
  listCategories(locale: Locale): Promise<readonly RentalCategory[]>;
  getCategoryBySlug(slug: string, locale: Locale): Promise<RentalCategory | null>;
  /** Calendar for a window; the UI never derives availability itself. */
  getAvailability(itemId: string, range: DateRange): Promise<RentalAvailability>;
  /**
   * Prices a period. Lives on the service — and therefore on the backend once
   * one exists — because rental pricing is business policy, not presentation.
   */
  quote(itemId: string, period: RentalPeriod): Promise<RentalQuote>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;
}
