import type { CourseEnrolmentState, CourseFormat, CourseLevel } from "@/features/education";
import type { TranslationKey } from "@/i18n";

/**
 * The domain's enumerations, mapped to the strings a reader sees.
 *
 * They live here rather than in either the page or the card because BOTH read
 * them, and because the mapping is the one place a new format or a new level
 * would otherwise be forgotten: these records are exhaustive by type, so adding
 * `CourseFormat = "self-paced"` fails the build here instead of printing the
 * raw id into an Arabic sentence.
 */
export const COURSE_FORMAT_LABEL: Readonly<Record<CourseFormat, TranslationKey>> = {
  online: "course.formatOnline",
  "in-person": "course.formatInPerson",
  hybrid: "course.formatHybrid",
  "self-paced": "course.formatSelfPaced",
};

export const COURSE_LEVEL_LABEL: Readonly<Record<CourseLevel, TranslationKey>> = {
  beginner: "course.levelBeginner",
  intermediate: "course.levelIntermediate",
  advanced: "course.levelAdvanced",
};

export const COURSE_STATE_LABEL: Readonly<Record<CourseEnrolmentState, TranslationKey>> = {
  open: "course.stateOpen",
  closing: "course.stateClosing",
  full: "course.stateFull",
  upcoming: "course.stateUpcoming",
};

/**
 * The domain's four cohort states, mapped onto the four the shared
 * `.stock-signal` class draws.
 *
 * The kit class is in `globals.css` and five surfaces already use it, so
 * availability reads identically whether it is a football, a bike or a seat on
 * a certification. What it must NOT do is push its vocabulary back into this
 * domain — a cohort is not stock, and "pre-order" is not a word anybody would
 * use about a course. Hence a mapping rather than a shared type.
 */
export const COURSE_STATE_STOCK: Readonly<
  Record<CourseEnrolmentState, "in-stock" | "low-stock" | "out-of-stock" | "pre-order">
> = {
  open: "in-stock",
  closing: "low-stock",
  full: "out-of-stock",
  upcoming: "pre-order",
};
