import { fetchSitemapEntries, httpClient, orNull } from "@/services";
import { listParams } from "@/services/http/query";
import type { MediaImage, Money, PageMeta } from "@/types";

import type {
  Coach,
  CoachAvailabilitySlot,
  CoachBooking,
  CoachListQuery,
  CoachListResult,
  CoachLocation,
  CoachSpecialisation,
} from "../types";
import type { CoachesService } from "./coaches.contract";

const enc = encodeURIComponent;

/** `PublicRef` — `{id, slug, name}`, used for `sports` on `PublicCoachDto`. */
interface LivePublicRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

/** `LocationRef` — no city/country breakdown, unlike the shared `Location` type. */
interface LiveLocationRef {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
}

interface LivePackage {
  readonly id: number;
  readonly name: string;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: string;
  readonly price: Money;
  readonly compareAtPrice?: Money;
}

interface LiveCertification {
  readonly name: string;
  readonly issuer: string;
  readonly year?: number;
}

/** `PublicCoachDto`. */
interface LiveCoach {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly headline: string;
  readonly bio?: string;
  readonly location: LiveLocationRef;
  readonly sports: readonly LivePublicRef[];
  /** Plain names, not id+name pairs — see `Coach.specializations` in `../types`. */
  readonly specializations: readonly string[];
  readonly languages: readonly string[];
  readonly yearsOfExperience: number;
  readonly responseTimeHours: number;
  readonly sessionRate?: Money;
  readonly packages: readonly LivePackage[];
  readonly certifications: readonly LiveCertification[];
  readonly avatar?: { readonly id: string; readonly url: string; readonly alt: string; readonly width?: number; readonly height?: number };
  readonly gallery: readonly {
    readonly id: string;
    readonly url: string;
    readonly alt: string;
    readonly width?: number;
    readonly height?: number;
  }[];
  readonly completedSessions: number;
}

/** `MediaImageDto`/`MediaImageDto2` — always an image on this endpoint, despite carrying their own stray nullable `kind` string. */
function toMediaImage(dto: { id: string; url: string; alt: string; width?: number; height?: number }): MediaImage {
  return { kind: "image", id: dto.id, url: dto.url, alt: dto.alt, width: dto.width, height: dto.height };
}

interface LivePagedCoaches {
  readonly items: readonly LiveCoach[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  readonly meta?: PageMeta;
}

/** `CoachSlotDto` — note: the endpoint only ever returns FREE slots, so every entry it gives back is, by construction, not booked. */
interface LiveCoachSlot {
  readonly id: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

/** `CoachBookingContactDto`/`CoachBookingContactRequest`. */
interface LiveCoachContact {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
}

/** `CoachBookingDto` — flat `startsAt`/`endsAt`, no nested `slot`, no `coachSlug`. */
interface LiveCoachBooking {
  readonly id: number;
  readonly reference: string;
  readonly coachId: number;
  readonly coachName: string;
  readonly packageName: string;
  readonly contact: LiveCoachContact;
  readonly goal?: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total: Money;
  readonly audit: { readonly createdAt: string };
}

/** `PublicCoachSpecialisationDto` — a clean `{id, name}` match. */
interface LiveSpecialisation {
  readonly id: number;
  readonly name: string;
}

function toLocation(ref: LiveLocationRef): CoachLocation {
  return {
    id: String(ref.id),
    name: ref.name,
    // No live city/countryCode — see `CoachLocation` in `../types`.
  };
}

function toCertification(dto: LiveCertification, index: number) {
  return {
    // No live id on `PublicCertificationDto` — a stable per-response index is
    // fine since the UI only uses this as a React list key, never an identity.
    id: `cert-${index}`,
    name: dto.name,
    issuedBy: dto.issuer,
    // Only a year is known live; turned into a Jan 1 date so the existing
    // date formatter (expecting an ISO date) still renders something sane.
    issuedAt: dto.year ? `${dto.year}-01-01` : undefined,
  };
}

function toCoach(dto: LiveCoach): Coach {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    headline: dto.headline,
    bio: dto.bio ?? "",
    sportIds: dto.sports.map((ref) => String(ref.id)),
    specializations: dto.specializations,
    certifications: dto.certifications.map(toCertification),
    yearsOfExperience: dto.yearsOfExperience,
    languages: dto.languages,
    location: toLocation(dto.location),
    // No live remote-availability flag — see `Coach.isRemoteAvailable`.
    sessionRate: dto.sessionRate,
    packages: dto.packages.map((pkg) => ({
      id: String(pkg.id),
      name: pkg.name,
      // No live `description` on `PublicPackageDto`.
      description: "",
      durationMinutes: pkg.durationMinutes,
      sessionCount: pkg.sessionCount,
      mode: pkg.mode as Coach["packages"][number]["mode"],
      price: pkg.price,
      compareAtPrice: pkg.compareAtPrice,
    })),
    completedSessions: dto.completedSessions,
    responseTimeHours: dto.responseTimeHours,
    avatar: dto.avatar ? toMediaImage(dto.avatar) : undefined,
    gallery: dto.gallery.map(toMediaImage),
    // No live source at all — `coaches` may only depend on `sports` per
    // ARCHITECTURE.md §7, so this can't be resolved from `reviews` either.
    rating: { average: 0, count: 0 },
    // No live publish timestamp.
  };
}

function toListResult(dto: LivePagedCoaches): CoachListResult {
  return {
    items: dto.items.map(toCoach),
    // The live wrapper is flat with an optional `meta` — build one from the
    // flat fields when it's absent, same pattern as careers' `listEmployers`.
    meta:
      dto.meta ?? {
        page: dto.page,
        pageSize: dto.pageSize,
        totalItems: dto.totalCount,
        totalPages: dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(1, dto.pageSize))),
        hasNextPage: dto.hasNextPage ?? dto.page * dto.pageSize < dto.totalCount,
        hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
      },
  };
}

function toSlot(dto: LiveCoachSlot): CoachAvailabilitySlot {
  return {
    id: dto.id,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    // The endpoint documents itself as "free slots" only — every entry it
    // returns is therefore unbooked, not fabricated.
    isBooked: false,
  };
}

/** Coaches and their bookings over `/v1/coaches` and `/v1/coach-bookings`. */
export const httpCoachesService: CoachesService = {
  listCoaches: async (query: CoachListQuery) => {
    const dto = await httpClient.get<LivePagedCoaches>("/v1/coaches", {
      query: {
        ...listParams(query),
        sportSlugs: query.sportSlugs,
        specializations: query.specializations,
        locationIds: query.locationIds,
        languages: query.languages,
        // minRating/remoteOnly: no live backing (`GET /coaches` takes no such
        // filters) — client-side-only today, intentionally not sent.
      },
      revalidate: 60,
    });
    return toListResult(dto);
  },

  getCoachBySlug: (slug, locale) =>
    orNull(httpClient.get<LiveCoach>(`/v1/coaches/${enc(slug)}`, { query: { language: locale }, revalidate: 60 })).then(
      (dto) => (dto ? toCoach(dto) : null),
    ),

  getManyByIds: async (ids, locale) => {
    if (ids.length === 0) return [];
    const dtos = await httpClient.get<LiveCoach[]>("/v1/coaches/by-ids", { query: { language: locale, ids }, revalidate: 60 });
    return dtos.map(toCoach);
  },

  listSpecializations: async (locale) => {
    const dtos = await httpClient.get<LiveSpecialisation[]>("/v1/coach-specialisations", {
      query: { language: locale },
      revalidate: 300,
    });
    return dtos.map((dto): CoachSpecialisation => ({ id: String(dto.id), name: dto.name }));
  },

  listAvailability: async (coachId, range) => {
    const dtos = await httpClient.get<LiveCoachSlot[]>(`/v1/coaches/${enc(coachId)}/availability`, {
      query: { from: range.from, to: range.to },
      cache: "no-store",
    });
    return dtos.map(toSlot);
  },

  /*
   * `auth: true` forwards the visitor's token when there is one, which is how
   * the API knows whose account the booking belongs to. A guest has none and
   * the booking still reaches the coach. `customerId` is NOT sent: the API
   * takes the customer from the token, never from the body. No `language`
   * query parameter exists on this endpoint.
   */
  createBooking: async (request) => {
    const dto = await httpClient.post<LiveCoachBooking>(
      "/v1/coach-bookings",
      {
        // `coachId`/`packageId` are int64 on `CreateCoachBookingRequest` (JSON numbers);
        // `slotId` really is a string.
        coachId: Number(request.coachId),
        packageId: Number(request.packageId),
        slotId: request.slotId,
        contact: request.contact,
        goal: request.goal,
      },
      { auth: true },
    );
    return {
      id: String(dto.id),
      reference: dto.reference,
      coachId: String(dto.coachId),
      coachName: dto.coachName,
      // No live source — see `CoachBooking.coachSlug` in `../types`.
      packageName: dto.packageName,
      slot: {
        // No slot id comes back on the booking DTO — reuse the one just booked with.
        id: request.slotId,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        isBooked: true,
      },
      total: dto.total,
      contact: { name: dto.contact.name, email: dto.contact.email, phone: dto.contact.phone ?? "" },
      status: dto.status as CoachBooking["status"],
      createdAt: dto.audit.createdAt,
    };
  },

  listSitemapEntries: () => fetchSitemapEntries("coaches", (slug) => `/coaches/${slug}`),
};
