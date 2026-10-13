import type { RentalAvailabilityDay } from "@/features/rental";

/**
 * AVAILABILITY IS GENERATED FROM TODAY, NEVER A TABLE OF LITERAL DATES.
 *
 * The previous version of this file listed five calendar dates in September
 * 2026 and nothing else. It was correct for about a fortnight: after that every
 * rental item reported full availability every day forever, the "these dates
 * are taken" branch of the detail page became unreachable, and the calendar
 * strip read as a shop that never sells anything.
 *
 * So demand is expressed as a PROFILE per item — how hard it books out, which
 * days from today are already gone, whether the whole fleet is on a block
 * booking — and resolved against the date being asked about. It is the same
 * reasoning as `buildCoachSlots` in `mocks/coaches`: a fixture that describes a
 * pattern stays true; a fixture that describes a week stops being true in a
 * week.
 *
 * Every answer is a pure function of `itemId + date`, so it is stable across a
 * re-render, identical on the server and in the browser, and a period posted
 * back in a URL still resolves to the same answer it was quoted from.
 */
const MS_PER_DAY = 86_400_000;

/** Midnight UTC today — the anchor every offset below is measured from. */
function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function offsetFromToday(date: string): number {
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) return 0;
  return Math.round((parsed - todayUtc()) / MS_PER_DAY);
}

/** FNV-1a: same seed, same answer, everywhere. */
function hash(seed: string): number {
  let value = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16_777_619);
  }
  return value >>> 0;
}

interface DemandProfile {
  /**
   * Every unit is out for this many days from today. A fleet on one long
   * booking — the state a detail page has to be able to draw, and the one a
   * fixture where everything is free never exercises.
   */
  readonly blockedForDays?: number;
  /** Individual days, counted from today, that are gone whatever the draw says. */
  readonly bookedOffsets?: readonly number[];
  /** How often an ordinary day is short, as a percentage. */
  readonly pressure: number;
}

const PROFILES: Readonly<Record<string, DemandProfile>> = {
  /* Aqaba in season: the weekends go first, and there is a school group on the
     boards at the start of next week. */
  "rent-paddleboard": { bookedOffsets: [3, 4, 12], pressure: 34 },
  "rent-gravel-bike": { bookedOffsets: [1, 9], pressure: 40 },
  "rent-expedition-tent": { pressure: 22 },
  /* BOTH COURTS ARE ON A LEAGUE BLOCK. Nothing to hire for two and a half
     weeks, which is what makes the "no availability at all" state on the detail
     page a real state with a real date attached rather than a hypothetical. */
  "rent-indoor-court": { blockedForDays: 17, pressure: 45 },
};

const DEFAULT_PROFILE: DemandProfile = { pressure: 25 };

export function buildAvailabilityDay(
  itemId: string,
  date: string,
  totalUnits: number,
): RentalAvailabilityDay {
  const profile = PROFILES[itemId] ?? DEFAULT_PROFILE;
  const offset = offsetFromToday(date);

  /* Yesterday is not a hire window. */
  if (offset < 0) return { date, unitsAvailable: 0 };
  if (profile.blockedForDays !== undefined && offset < profile.blockedForDays) {
    return { date, unitsAvailable: 0 };
  }
  if (profile.bookedOffsets?.includes(offset)) return { date, unitsAvailable: 0 };

  /* Friday and Saturday are the Jordanian weekend, so they book out first. */
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const pressure = profile.pressure + (weekday === 5 || weekday === 6 ? 18 : 0);
  const draw = hash(`${itemId}:${date}`) % 100;

  if (draw >= pressure) return { date, unitsAvailable: totalUnits };
  if (draw * 4 < pressure) return { date, unitsAvailable: 0 };
  return { date, unitsAvailable: Math.max(1, Math.floor(totalUnits / 2)) };
}
