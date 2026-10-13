import type { Locale } from "@/i18n";
import type { SitemapEntry } from "@/types";

import type { Course, CourseCategory, CourseListQuery, CourseListResult, Enrolment } from "../types";

export interface EducationService {
  listCourses(query: CourseListQuery): Promise<CourseListResult>;
  getCourseBySlug(slug: string, locale: Locale): Promise<Course | null>;
  listCategories(locale: Locale): Promise<readonly CourseCategory[]>;
  getCategoryBySlug(slug: string, locale: Locale): Promise<CourseCategory | null>;
  listSitemapEntries(): Promise<readonly SitemapEntry[]>;
  /**
   * Takes a place on the course's next cohort for a signed-in customer. The
   * place is `pending` until payment clears — payment itself is an OPEN
   * BUSINESS DECISION, and staff confirm it in the admin. Rejects when the
   * cohort is full or the customer already holds a place on it.
   */
  enrol(customerId: string, courseId: string, locale: Locale): Promise<Enrolment>;
  /** The customer's live place on this course, if they hold one. */
  findEnrolment(customerId: string, courseId: string, locale: Locale): Promise<Enrolment | null>;
}
