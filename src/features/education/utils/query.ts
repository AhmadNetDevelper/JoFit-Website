import type { Locale } from "@/i18n";
import { readNumberParam, readParam, readParams, type RawSearchParams } from "@/lib";

import {
  COURSE_SORT_KEYS,
  type CourseFormat,
  type CourseLevel,
  type CourseListQuery,
  type CourseSortKey,
} from "../types";

export const COURSE_FORMATS: readonly CourseFormat[] = ["online", "in-person", "hybrid"];
export const COURSE_LEVELS: readonly CourseLevel[] = ["beginner", "intermediate", "advanced"];

function readSort(params: RawSearchParams): CourseSortKey | undefined {
  const raw = readParam(params, "sort");
  return COURSE_SORT_KEYS.find((key) => key === raw);
}

/**
 * The URL is the source of truth for catalogue state.
 *
 * Every facet is narrowed against the domain's own vocabulary before it reaches
 * the service, so a hand-edited `?format=carrier-pigeon` filters nothing instead
 * of quietly returning an empty page — and the rail's pressed states can be
 * exhaustive rather than string comparisons.
 */
export function parseCourseListQuery(
  params: RawSearchParams,
  locale: Locale,
): CourseListQuery {
  const formats = readParams(params, "format").filter((value): value is CourseFormat =>
    COURSE_FORMATS.includes(value as CourseFormat),
  );
  const levels = readParams(params, "level").filter((value): value is CourseLevel =>
    COURSE_LEVELS.includes(value as CourseLevel),
  );

  return {
    locale,
    page: readNumberParam(params, "page"),
    pageSize: readNumberParam(params, "pageSize"),
    search: readParam(params, "q"),
    sort: readSort(params),
    categorySlugs: readParams(params, "category"),
    sportSlugs: readParams(params, "sport"),
    formats,
    levels,
    minRating: readNumberParam(params, "rating"),
  };
}
