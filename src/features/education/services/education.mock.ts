import { resolveText, type Locale } from "@/i18n";
import { AppError, paginate } from "@/lib";
import { accountStore, nextReference, notifyStaff, type RawEnrolment } from "@/mocks/accounts";
import {
  buildCourseIntake,
  coursePublishedAt,
  mockCourseCategories,
  mockCourses,
  type RawCourse,
  type RawCourseCategory,
} from "@/mocks/education";
import {
  COURSE_LANGUAGE_NAMES,
  courseDetail,
  mockCourseModuleSummaries,
} from "@/mocks/education/course-detail";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { SitemapEntry } from "@/types";

import type {
  Course,
  CourseCategory,
  CourseEnrolmentState,
  CourseIntake,
  CourseListQuery,
  Enrolment,
} from "../types";
import type { EducationService } from "./education.contract";

/**
 * Source → domain mapping; the HTTP adapter will do the same with a wire format.
 *
 * EVERYTHING DISPLAYED IS RESOLVED HERE. The certificate's name and its issuer
 * are localized alongside the prose, and so are the outcomes, the audience
 * lines, the assessment sentence, the venue and the language names: a
 * qualification title left as free English text is exactly how an Arabic page
 * ends up with an English line running through the middle of it.
 *
 * The date and the intake are DERIVED rather than read, both relative to today,
 * so the catalogue never states a date that has been and gone.
 */
/**
 * The next cohort with its seats COUNTED from the places customers actually
 * hold, rather than from the seed alone. The seed fixes the date and the size
 * of the room; the account store says how full it is — so enrolling from this
 * site, or cancelling from the admin, moves the signal every visitor sees.
 *
 * The state rule is the one `buildCourseIntake` documents.
 */
function liveIntake(courseId: string): CourseIntake {
  const seeded = buildCourseIntake(courseId);
  const seatsTaken = accountStore().enrolments.filter(
    (row) =>
      row.courseId === courseId &&
      row.cohortStartsOn === seeded.startsOn &&
      (row.status === "pending" || row.status === "active"),
  ).length;
  const remaining = seeded.seatsTotal - seatsTaken;
  const daysAhead = Math.round((Date.parse(seeded.startsOn) - Date.now()) / 86_400_000);
  const state: CourseEnrolmentState =
    remaining <= 0 ? "full" : daysAhead > 49 ? "upcoming" : remaining <= 3 ? "closing" : "open";
  return { ...seeded, seatsTaken, state };
}

function toEnrolment(raw: RawEnrolment, locale: Locale): Enrolment {
  const course = mockCourses.find((entry) => entry.id === raw.courseId);
  return {
    id: raw.id,
    reference: raw.reference,
    courseId: raw.courseId,
    cohortStartsOn: raw.cohortStartsOn,
    courseTitle: course ? resolveText(course.title, locale) : raw.courseId,
    status: raw.status,
    enrolledAt: raw.enrolledAt,
    progressPercent: raw.progressPercent,
  };
}

function liveEnrolment(customerId: string, courseId: string): RawEnrolment | undefined {
  return accountStore().enrolments.find(
    (row) =>
      row.customerId === customerId &&
      row.courseId === courseId &&
      (row.status === "pending" || row.status === "active"),
  );
}

function toCourse(fixture: RawCourse, locale: Locale): Course {
  /* Staff's latest pictures over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("course", fixture);
  const detail = courseDetail(raw.id);

  return {
    id: raw.id,
    slug: raw.slug,
    title: resolveText(raw.title, locale),
    summary: resolveText(raw.summary, locale),
    description: resolveText(raw.description, locale),
    categoryIds: raw.categoryIds,
    sportIds: raw.sportIds,
    format: raw.format,
    level: raw.level,
    durationHours: raw.durationHours,
    price: raw.price,
    instructorIds: raw.instructorIds,
    modules: raw.modules.map((module) => {
      const summary = mockCourseModuleSummaries[module.id];
      return {
        id: module.id,
        title: resolveText(module.title, locale),
        summary: summary ? resolveText(summary, locale) : undefined,
        durationMinutes: module.durationMinutes,
      };
    }),
    outcomes: detail.outcomes.map((outcome) => resolveText(outcome, locale)),
    audience: detail.audience.map((entry) => resolveText(entry, locale)),
    assessment: detail.assessment ? resolveText(detail.assessment, locale) : undefined,
    /* Unknown codes are dropped rather than printed: a BCP-47 tag in a list of
       languages is a bug leaking onto a public page. */
    languages: detail.languages
      .map((code) => COURSE_LANGUAGE_NAMES[code])
      .filter((name) => name !== undefined)
      .map((name) => resolveText(name, locale)),
    venue: detail.venue ? resolveText(detail.venue, locale) : undefined,
    certification: raw.certification
      ? {
          name: resolveText(raw.certification.name, locale),
          issuedBy: resolveText(raw.certification.issuedBy, locale),
        }
      : undefined,
    nextIntake: liveIntake(raw.id),
    media: raw.media,
    rating: raw.rating,
    status: raw.status,
    publishedAt: coursePublishedAt(raw),
  };
}

function toCategory(raw: RawCourseCategory, locale: Locale): CourseCategory {
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    description: raw.description ? resolveText(raw.description, locale) : undefined,
  };
}

function applyFilters(query: CourseListQuery): Course[] {
  const categoryIds = query.categorySlugs?.length
    ? mockCourseCategories.filter((c) => query.categorySlugs?.includes(c.slug)).map((c) => c.id)
    : undefined;
  const sportIds = query.sportSlugs?.length
    ? mockSports.filter((s) => query.sportSlugs?.includes(s.slug)).map((s) => s.id)
    : undefined;

  return mockCourses.map((raw) => toCourse(raw, query.locale)).filter((course) => {
    if (course.status !== "published") return false;
    if (!matchesText([course.title, course.summary, course.description], query.search)) return false;
    if (!matchesAny([...course.categoryIds], categoryIds)) return false;
    if (!matchesAny([...course.sportIds], sportIds)) return false;
    if (query.formats?.length && !query.formats.includes(course.format)) return false;
    if (query.levels?.length && !query.levels.includes(course.level)) return false;
    if (query.minRating !== undefined && course.rating.average < query.minRating) return false;
    return true;
  });
}

/**
 * Sorting, over the catalogue's own vocabulary (`COURSE_SORT_KEYS`).
 *
 * The default is newest-first and is stated rather than left to array order: a
 * catalogue's default view is a decision, and "whatever order the fixture is
 * in" changes silently the day somebody reorders the file.
 */
function applySort(courses: Course[], sort: string | undefined): Course[] {
  switch (sort) {
    case "price-asc":
      return sortBy(courses, (a, b) => a.price.current.amount - b.price.current.amount);
    case "price-desc":
      return sortBy(courses, (a, b) => b.price.current.amount - a.price.current.amount);
    case "rating-desc":
      return sortBy(courses, (a, b) => b.rating.average - a.rating.average);
    case "duration-asc":
      return sortBy(courses, (a, b) => a.durationHours - b.durationHours);
    default:
      return sortBy(courses, (a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
}

export const mockEducationService: EducationService = {
  async listCourses(query) {
    await simulateLatency();
    return paginate(applySort(applyFilters(query), query.sort), query);
  },

  async getCourseBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockCourses.find((course) => course.slug === slug);
    return raw ? toCourse(raw, locale) : null;
  },

  async listCategories(locale) {
    await simulateLatency();
    return mockCourseCategories.map((raw) => toCategory(raw, locale));
  },

  async getCategoryBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockCourseCategories.find((category) => category.slug === slug);
    return raw ? toCategory(raw, locale) : null;
  },

  async enrol(customerId, courseId, locale) {
    await simulateLatency();
    const course = mockCourses.find((entry) => entry.id === courseId);
    if (!course || course.status !== "published") {
      throw new AppError("not-found", "That course is not open for enrolment.", { status: 404 });
    }
    const customer = accountStore().customers.find((entry) => entry.id === customerId);
    if (!customer) throw new AppError("unauthorized", "Sign in again to continue.", { status: 401 });
    if (liveEnrolment(customerId, courseId)) {
      throw new AppError("conflict", "You already hold a place on this course.", { status: 409 });
    }
    const intake = liveIntake(courseId);
    if (intake.state === "full") {
      throw new AppError("conflict", "The next cohort has just filled.", { status: 409 });
    }
    const reference = nextReference("EN-9");
    const raw: RawEnrolment = {
      id: `enr-${reference.toLowerCase()}`,
      reference,
      courseId,
      customerId,
      customerName: customer.name,
      cohortStartsOn: intake.startsOn,
      status: "pending",
      progressPercent: 0,
      enrolledAt: new Date().toISOString(),
      // Nothing is charged here; the place is held until payment is settled.
      amountPaid: { amount: 0, currency: course.price.current.currency },
    };
    accountStore().enrolments.push(raw);
    notifyStaff(
      "enrolment-requested",
      { en: `Course place reserved ${reference}`, ar: `حجز مقعد في دورة ${reference}` },
      { en: `${customer.name} is waiting for payment to be arranged.`, ar: `${customer.name} بانتظار ترتيب الدفع.` },
      "/education/enrolments",
    );
    return toEnrolment(raw, locale);
  },

  async findEnrolment(customerId, courseId, locale) {
    await simulateLatency();
    const raw = liveEnrolment(customerId, courseId);
    return raw ? toEnrolment(raw, locale) : null;
  },

  async listSitemapEntries(): Promise<readonly SitemapEntry[]> {
    await simulateLatency();
    return [
      { path: "/education", changeFrequency: "weekly", priority: 0.8 },
      ...mockCourses
        .filter((course) => course.status === "published")
        .map((course) => ({
          path: `/education/courses/${course.slug}`,
          lastModified: coursePublishedAt(course),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        })),
    ];
  },
};
