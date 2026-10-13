import { resolveText, type Locale } from "@/i18n";
import { AppError, paginate } from "@/lib";
import {
  LANGUAGE_NAMES,
  buildCoachSlots,
  mockCoaches,
  mockSpecialisations,
  type RawCoach,
  type RawCoachPackage,
} from "@/mocks/coaches";
import { accountStore, nextReference, notifySessionRequested } from "@/mocks/accounts";
import { withCatalogueImages } from "@/mocks/catalogue-images";
import { matchesAny, matchesText, simulateLatency, sortBy } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { SitemapEntry } from "@/types";

import type {
  Coach,
  CoachListQuery,
  CoachSessionPackage,
  CoachSortKey,
  CoachSpecialisation,
} from "../types";
import type { CoachesService } from "./coaches.contract";

function toPackage(raw: RawCoachPackage, locale: Locale): CoachSessionPackage {
  return {
    id: raw.id,
    name: resolveText(raw.name, locale),
    description: resolveText(raw.description, locale),
    durationMinutes: raw.durationMinutes,
    sessionCount: raw.sessionCount,
    mode: raw.mode,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice,
  };
}

/**
 * Id → label, for the three vocabularies a profile displays. An unknown id
 * falls through to the id itself rather than to an empty chip: a fixture that
 * has drifted should be visible, not invisible.
 */
function toSpecialisations(ids: readonly string[], locale: Locale): CoachSpecialisation[] {
  return ids.map((id) => {
    const found = mockSpecialisations.find((entry) => entry.id === id);
    return { id, name: found ? resolveText(found.name, locale) : id };
  });
}

/** Source → domain mapping; the HTTP adapter will do the same with a wire format. */
function toCoach(fixture: RawCoach, locale: Locale): Coach {
  /* Staff's latest avatar and gallery over the fixture — see `mocks/catalogue-images.ts`. */
  const raw = withCatalogueImages("coach", fixture);
  return {
    id: raw.id,
    slug: raw.slug,
    name: resolveText(raw.name, locale),
    headline: resolveText(raw.headline, locale),
    bio: resolveText(raw.bio, locale),
    sportIds: raw.sportIds,
    /*
     * `Coach.specializations` is now plain display names (to mirror the live
     * API's `string[]`, see `../types`) — the id list the mock still keys
     * filtering on lives on `raw.specializations`, read directly in
     * `applyFilters` below rather than recovered from this mapped field.
     */
    specializations: toSpecialisations(raw.specializations, locale).map((entry) => entry.name),
    certifications: raw.certifications,
    yearsOfExperience: raw.yearsOfExperience,
    languages: raw.languages.map((code) =>
      LANGUAGE_NAMES[code] ? resolveText(LANGUAGE_NAMES[code], locale) : code,
    ),
    location: {
      id: raw.location.id,
      name: resolveText(raw.location.name, locale),
      city: resolveText(raw.location.city, locale),
      countryCode: raw.location.countryCode,
    },
    isRemoteAvailable: raw.isRemoteAvailable,
    sessionRate: raw.sessionRate,
    packages: raw.packages.map((entry) => toPackage(entry, locale)),
    completedSessions: raw.completedSessions,
    responseTimeHours: raw.responseTimeHours,
    avatar: raw.avatar,
    gallery: raw.gallery,
    rating: raw.rating,
    publishedAt: raw.publishedAt,
  };
}

function applyFilters(query: CoachListQuery): Coach[] {
  const sportIds = query.sportSlugs?.length
    ? mockSports.filter((sport) => query.sportSlugs?.includes(sport.slug)).map((sport) => sport.id)
    : undefined;

  return mockCoaches.filter((raw) => {
    const coach = toCoach(raw, query.locale);
    if (!matchesText([coach.name, coach.headline, coach.bio], query.search)) return false;
    if (!matchesAny([...coach.sportIds], sportIds)) return false;
    /* Both compare IDS, not the labels the card happens to be showing. */
    if (!matchesAny([...raw.specializations], query.specializations)) return false;
    if (!matchesAny([...raw.languages], query.languages)) return false;
    if (query.locationIds?.length && !query.locationIds.includes(coach.location.id)) return false;
    if (query.minRating !== undefined && coach.rating.average < query.minRating) return false;
    if (query.remoteOnly && !coach.isRemoteAvailable) return false;
    return true;
  }).map((raw) => toCoach(raw, query.locale));
}

function applySort(coaches: readonly Coach[], sort?: string): Coach[] {
  switch (sort as CoachSortKey | undefined) {
    case "rating-desc":
      return sortBy(coaches, (a, b) => b.rating.average - a.rating.average);
    case "experience-desc":
      return sortBy(coaches, (a, b) => b.yearsOfExperience - a.yearsOfExperience);
    case "price-asc":
      return sortBy(
        coaches,
        (a, b) => (a.sessionRate?.amount ?? Number.MAX_SAFE_INTEGER) - (b.sessionRate?.amount ?? Number.MAX_SAFE_INTEGER),
      );
    default:
      return [...coaches];
  }
}

/**
 * A human-readable booking reference, the way a confirmation email quotes one.
 *
 * Derived from the slot rather than random, so re-submitting the same booking
 * in this mock produces the same reference instead of a second one — the mock
 * has no store to deduplicate against, and a reference that changes on every
 * click is worse than one that repeats.
 */
/**
 * A slot is taken when the seed says so OR when somebody holds a live booking
 * at that time in the account store — the second half is what makes a booking
 * made a minute ago disappear from the calendar for the next visitor.
 */
function withBookings(coachId: string, from: string, to: string) {
  const held = new Set(
    accountStore()
      .coachBookings.filter((row) => row.coachId === coachId && row.status !== "cancelled")
      .map((row) => Date.parse(row.startsAt)),
  );
  return buildCoachSlots(coachId, from, to).map((slot) =>
    held.has(Date.parse(slot.startsAt)) ? { ...slot, isBooked: true } : slot,
  );
}

export const mockCoachesService: CoachesService = {
  async listCoaches(query) {
    await simulateLatency();
    return paginate(applySort(applyFilters(query), query.sort), query);
  },

  async getCoachBySlug(slug, locale) {
    await simulateLatency();
    const raw = mockCoaches.find((coach) => coach.slug === slug);
    return raw ? toCoach(raw, locale) : null;
  },

  async getManyByIds(ids, locale) {
    await simulateLatency();
    return mockCoaches.filter((coach) => ids.includes(coach.id)).map((raw) => toCoach(raw, locale));
  },

  async listSpecializations(locale) {
    await simulateLatency();
    /* Only the ones a coach actually holds: an empty filter chip is a promise
       the result set cannot keep. */
    const used = new Set(mockCoaches.flatMap((coach) => coach.specializations));
    return toSpecialisations(
      mockSpecialisations.filter((entry) => used.has(entry.id)).map((entry) => entry.id),
      locale,
    );
  },

  async listAvailability(coachId, range) {
    await simulateLatency();
    return withBookings(coachId, range.from, range.to);
  },

  async createBooking(request, locale) {
    await simulateLatency();

    const raw = mockCoaches.find((coach) => coach.id === request.coachId);
    if (!raw) throw new AppError("not-found", "That coach is no longer listed.", { status: 404 });

    const coach = toCoach(raw, locale);
    const chosen = coach.packages.find((entry) => entry.id === request.packageId);
    if (!chosen) throw new AppError("validation", "That session type is not offered.", { status: 422 });

    /*
     * The slot is re-read from the source rather than trusted from the request.
     * The browser saw a snapshot; between rendering it and posting it the slot
     * may have been taken, and booking over someone else is the one failure
     * this flow must not produce.
     */
    const date = /(\d{4}-\d{2}-\d{2})-\d{2}$/.exec(request.slotId)?.[1];
    if (!date) throw new AppError("validation", "That time could not be read.", { status: 422 });

    const slot = withBookings(coach.id, date, date).find((entry) => entry.id === request.slotId);
    if (!slot) throw new AppError("not-found", "That time is no longer published.", { status: 404 });
    if (slot.isBooked) throw new AppError("conflict", "That time has just been taken.", { status: 409 });

    /*
     * Recorded in the account store, which is what carries the booking to the
     * two people it concerns: the coach sees it as a request in the coach
     * area, and the customer — when signed in — sees it on their account.
     */
    const rawPackage = raw.packages.find((entry) => entry.id === chosen.id)!;
    const reference = nextReference("CB-9");
    const id = `cb-${reference.toLowerCase()}`;
    accountStore().coachBookings.push({
      id,
      reference,
      coachId: coach.id,
      packageId: chosen.id,
      packageName: rawPackage.name,
      mode: chosen.mode,
      sessionCount: chosen.sessionCount,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      total: chosen.price,
      customerId: request.customerId ?? "guest",
      contact: request.contact,
      goal: request.goal,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    notifySessionRequested({ id, reference, coachId: coach.id }, request.contact.name);

    return {
      id,
      reference,
      coachId: coach.id,
      coachName: coach.name,
      coachSlug: coach.slug,
      packageName: chosen.name,
      slot: { ...slot, isBooked: true },
      total: chosen.price,
      contact: request.contact,
      /*
       * `pending`, not `confirmed`. Nothing has taken payment and no coach has
       * accepted yet, and a mock that says "confirmed" would teach the
       * confirmation screen to promise something the real flow cannot.
       */
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  },

  async listSitemapEntries(): Promise<readonly SitemapEntry[]> {
    await simulateLatency();
    return [
      { path: "/coaches", changeFrequency: "weekly", priority: 0.8 },
      ...mockCoaches.map((coach) => ({
        path: `/coaches/${coach.slug}`,
        lastModified: coach.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  },
};
