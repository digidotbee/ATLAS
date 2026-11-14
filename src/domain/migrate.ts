import { nightsBetween } from './budget';
import type { AtlasData, Trip } from './types';

/** A stored "trip date" longer than this was almost certainly an availability range (pre-v1.3). */
export const LEGACY_AVAILABILITY_NIGHTS = 28;

/**
 * v1.3 compatibility: separates availability from trip dates without deleting anything.
 * - v1.2 windowStart/windowEnd become the availability window.
 * - Date options longer than 28 nights are marked legacyAvailability, folded into the availability
 *   window, and un-chosen so no costs are projected over the whole range.
 * Idempotent; does not touch updatedAt (so it never causes a sync conflict).
 */
export function migrateTrip(t: Trip): Trip {
  if (t.availability) return t;
  const long = t.dateOptions.filter((d) => (nightsBetween(d.start, d.end) ?? 0) > LEGACY_AVAILABILITY_NIGHTS);
  let earliest = t.windowStart || '';
  let latest = t.windowEnd || '';
  for (const d of long) {
    if (!earliest || d.start < earliest) earliest = d.start;
    if (!latest || d.end > latest) latest = d.end;
  }
  if (!earliest || !latest) return t;
  const longIds = new Set(long.map((d) => d.id));
  return {
    ...t,
    availability: { earliestDeparture: earliest, latestReturn: latest, preferredRanges: [], excludedRanges: [] },
    constraints: t.constraints ?? { departureAirport: '', minNights: null, preferredNights: null, maxNights: null },
    dateOptions: t.dateOptions.map((d) => (longIds.has(d.id) ? { ...d, legacyAvailability: true } : d)),
    chosenDateId: t.chosenDateId && longIds.has(t.chosenDateId) ? null : t.chosenDateId,
  };
}

export function migrateData(d: AtlasData): AtlasData {
  return { ...d, trips: d.trips.map(migrateTrip) };
}
