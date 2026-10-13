/**
 * Public surface of the sports domain. Other features import from here and never
 * reach into `sports/services/*` or `sports/components/*` directly.
 */
export { sportsService, type SportsService } from "./services";
export type { Sport, SportId, SportListQuery } from "./types";
