import { cacheTags, fetchSitemapEntries, httpClient, orNull, toPaginated, type LivePagedResult } from "@/services";
import { listParams } from "@/services/http/query";
import type { CurrencyCode, Media, Money, SitemapEntry } from "@/types";

import type {
  Course,
  CourseCategory,
  CourseEnrolmentState,
  CourseFormat,
  CourseIntake,
  CourseLevel,
  CourseListResult,
  Enrolment,
  EnrolmentStatus,
} from "../types";
import type { EducationService } from "./education.contract";

const enc = encodeURIComponent;

/** `MediaImageDto` — see `docs/api-live/website.json`. */
interface LiveMediaImage {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

function toMediaImage(dto: LiveMediaImage): Media {
  // Every media field in `PublicCourseDto` is a photo (no video schema live).
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width ?? undefined, height: dto.height ?? undefined };
}

/** `MoneyDto`/`MoneyDto2` — see `docs/api-live/website.json`. */
interface LiveMoney {
  readonly amount: number;
  readonly currency?: string;
}

function toMoney(dto: LiveMoney): Money {
  // Live `currency` is a plain string defaulting to "JOD"; narrowed to the
  // domain's closed `CurrencyCode` union rather than widening it everywhere.
  return { amount: dto.amount, currency: (dto.currency ?? "JOD") as CurrencyCode };
}

/** `CourseCategoryRefDto` — see `docs/api-live/website.json`. */
interface LiveCourseCategoryRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

/** `NextIntakeDto` — see `docs/api-live/website.json`. */
interface LiveNextIntake {
  readonly startsOn: string;
  readonly seatsTotal: number;
  readonly seatsTaken: number;
  readonly seatsRemaining: number;
}

/**
 * Derives the same four-state signal the mock computes, from the live
 * `seatsRemaining` the API provides directly rather than reseating the math
 * from `seatsTotal`/`seatsTaken`. Live `nextIntake` can itself be null (no
 * cohort currently scheduled) — the contract's `CourseIntake` is required, so
 * that case reads as "full" rather than inventing a fake upcoming date.
 */
function deriveIntake(dto: LiveNextIntake | null): CourseIntake {
  if (!dto) {
    return { startsOn: "", seatsTotal: 0, seatsTaken: 0, state: "full" };
  }
  const daysAhead = Math.round((Date.parse(dto.startsOn) - Date.now()) / 86_400_000);
  const state: CourseEnrolmentState =
    dto.seatsRemaining <= 0 ? "full" : daysAhead > 49 ? "upcoming" : dto.seatsRemaining <= 3 ? "closing" : "open";
  return { startsOn: dto.startsOn, seatsTotal: dto.seatsTotal, seatsTaken: dto.seatsTaken, state };
}

/**
 * One syllabus entry. NOT in the live spec yet — the shape the backend needs to
 * return as `PublicCourseDto.modules`. Optional so the site keeps working
 * (empty syllabus) until the API ships it.
 */
interface LiveCourseModule {
  readonly id: number | string;
  readonly title: string;
  readonly summary?: string | null;
  readonly durationMinutes?: number | null;
  readonly sortOrder?: number | null;
}

/** `PublicCourseDto` — see `docs/api-live/website.json`. `instructors` is left untyped (`items: {}`) by the live spec itself. */
interface LiveCourse {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string | null;
  readonly format: string;
  readonly level: string;
  readonly durationHours: number;
  readonly moduleCount: number;
  /** Not in the live spec yet — see `LiveCourseModule`. */
  readonly modules?: readonly LiveCourseModule[] | null;
  readonly price: LiveMoney;
  readonly compareAtPrice: LiveMoney | null;
  readonly categories: readonly LiveCourseCategoryRef[];
  readonly instructors: readonly unknown[];
  readonly languages: readonly string[];
  readonly venue: string | null;
  readonly certificationName: string | null;
  readonly certificationIssuedBy: string | null;
  readonly nextIntake: LiveNextIntake | null;
  readonly media: readonly LiveMediaImage[];
  readonly publishedAt: string | null;
}

/** `PublicCourseCategoryDto` — see `docs/api-live/website.json`. */
interface LiveCourseCategory {
  readonly id: number;
  readonly slug: string | null;
  readonly name: string;
  readonly description: string | null;
}

/** `CourseRefDto`, nested on an enrolment. */
interface LiveCourseRef {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
}

/** `AccountEnrolmentDto` — see `docs/api-live/website.json`. */
interface LiveEnrolment {
  readonly id: number;
  readonly reference: string;
  readonly course: LiveCourseRef;
  readonly courseHref: string | null;
  readonly status: string;
  readonly cohortStartsOn: string | null;
  readonly amountPaid: LiveMoney;
  readonly progressPercent: number;
  readonly enrolledAt: string;
}

function toCourse(dto: LiveCourse): Course {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary,
    description: dto.description ?? "",
    // Live sends ref objects, not an id array.
    categoryIds: dto.categories.map((category) => String(category.id)),
    // Live PublicCourseDto has no sportIds field at all.
    sportIds: [],
    // Live sends plain strings for both; narrowed to the domain's vocabulary.
    format: dto.format as CourseFormat,
    level: dto.level as CourseLevel,
    durationHours: dto.durationHours,
    price: {
      current: toMoney(dto.price),
      compareAt: dto.compareAtPrice ? toMoney(dto.compareAtPrice) : undefined,
    },
    // `instructors` has no reliable shape live (the spec itself leaves it
    // untyped) — left empty rather than guessing at a field name.
    instructorIds: [],
    // Ordered by `sortOrder` when the API sends it, else in the order received.
    modules: [...(dto.modules ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((module) => ({
        id: String(module.id),
        title: module.title,
        summary: module.summary ?? undefined,
        durationMinutes: module.durationMinutes ?? undefined,
      })),
    moduleCount: dto.modules?.length ?? dto.moduleCount,
    // No outcomes/audience/assessment live at all.
    outcomes: [],
    audience: [],
    assessment: undefined,
    languages: dto.languages,
    venue: dto.venue ?? undefined,
    // Live flattens certification into two strings instead of a nested object.
    certification:
      dto.certificationName && dto.certificationIssuedBy
        ? { name: dto.certificationName, issuedBy: dto.certificationIssuedBy }
        : undefined,
    nextIntake: deriveIntake(dto.nextIntake),
    media: dto.media.map(toMediaImage),
    // Live PublicCourseDto has no rating field at all; default to zero rather
    // than fabricating a score.
    rating: { average: 0, count: 0 },
    // GetCourses/GetCourseBySlug only ever return published courses.
    status: "published",
    publishedAt: dto.publishedAt ?? "",
  };
}

function toCategory(dto: LiveCourseCategory): CourseCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    description: dto.description ?? undefined,
  };
}

function toEnrolment(dto: LiveEnrolment): Enrolment {
  return {
    id: String(dto.id),
    reference: dto.reference,
    courseId: String(dto.course.id),
    cohortStartsOn: dto.cohortStartsOn ?? "",
    courseTitle: dto.course.title,
    // Live sends a plain string; narrowed to the domain's closed vocabulary.
    status: dto.status as EnrolmentStatus,
    enrolledAt: dto.enrolledAt,
    progressPercent: dto.progressPercent,
  };
}

/** The academy catalogue over `/v1/courses`; places over `/v1/me/enrolments`. */
export const httpEducationService: EducationService = {
  listCourses: (query) =>
    httpClient
      .get<LivePagedResult<LiveCourse>>("/v1/courses", {
        query: {
          ...listParams(query),
          categorySlugs: query.categorySlugs,
          formats: query.formats,
          levels: query.levels,
          // `sportSlugs` and `minRating` aren't accepted by the live endpoint
          // (only Page/PageSize/Search/CategorySlugs/Formats/Levels/Languages/
          // Sort/language) — unsupported server-side, dropped rather than sent
          // as dead no-ops. (Live's `Languages` filter — course delivery
          // language — has no current UI filter and is left unused.)
        },
        revalidate: 60,
        tags: [cacheTags.courses],
      })
      .then((raw): CourseListResult => toPaginated(raw, toCourse)),

  getCourseBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveCourse>(`/v1/courses/${enc(slug)}`, {
          query: { language: locale },
          revalidate: 60,
          tags: [cacheTags.courses],
        })
        .then(toCourse),
    ),

  listCategories: (locale) =>
    httpClient
      .get<LiveCourseCategory[]>("/v1/course-categories", { query: { language: locale }, revalidate: 300 })
      .then((categories) => categories.map(toCategory)),

  getCategoryBySlug: (slug, locale) =>
    orNull(
      httpClient
        .get<LiveCourseCategory>(`/v1/course-categories/${enc(slug)}`, { query: { language: locale }, revalidate: 300 })
        .then(toCategory),
    ),

  listSitemapEntries: async () => [
    { path: "/education", changeFrequency: "weekly", priority: 0.8 } satisfies SitemapEntry,
    ...(await fetchSitemapEntries("education", (slug) => `/education/courses/${slug}`, {
      changeFrequency: "monthly",
      priority: 0.6,
    })),
  ],

  /* The customer comes from the token; the id argument is the session's own. */
  enrol: (_customerId, courseId, locale) =>
    httpClient
      .post<LiveEnrolment>(
        "/v1/me/enrolments",
        // Live `EnrolRequest.courseId` is an int64 JSON body field — a quoted
        // numeric string won't bind to a C# `long`, so this is sent as a bare
        // number, not the contract's string id.
        { courseId: Number(courseId) },
        { query: { language: locale }, auth: true },
      )
      .then(toEnrolment),

  findEnrolment: (_customerId, courseId, locale) =>
    orNull(
      httpClient
        .get<LiveEnrolment>(`/v1/me/enrolments/by-course/${enc(courseId)}`, { query: { language: locale }, auth: true })
        .then(toEnrolment),
    ),
};
