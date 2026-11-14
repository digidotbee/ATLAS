import { addDays, chosenDate, tripShape } from './budget';
import type { Candidate, Trip } from './types';

export interface ItineraryDay {
  index: number;
  date: string;
  /** Where you sleep that night (null on departure day or if unplanned). */
  lodging: Candidate | null;
  items: Candidate[];
  note: string;
}

export interface Itinerary {
  days: ItineraryDay[];
  /** Chosen items (excluding flights) not yet placed on a day. */
  unscheduled: Candidate[];
  /** Night indexes with no chosen lodging. */
  nightsWithoutLodging: number[];
  /** Night indexes covered by more than one lodging. */
  doubleBooked: number[];
  /** Items planned on a day when you are staying at a different base. */
  baseMismatches: { day: number; item: Candidate; itemBase: string; stayBase: string }[];
}

const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();

/** Nights a lodging candidate covers, starting at its check-in day. */
export function lodgingNights(c: Candidate, tripNights: number): number {
  if (c.units !== null) return c.units;
  return tripNights;
}

export function buildItinerary(trip: Trip): Itinerary | null {
  const date = chosenDate(trip);
  const shape = tripShape(trip, date);
  if (!date || shape.days === 0) return null;

  const selected = trip.candidates.filter((c) => c.status === 'selected');
  const lodging = selected.filter((c) => c.category === 'lodging');
  const placedLodging = lodging.map((c) => (c.day === null && lodging.length === 1 ? { ...c, day: 0 } : c));

  const days: ItineraryDay[] = [];
  const nightsWithoutLodging: number[] = [];
  const doubleBooked: number[] = [];
  for (let i = 0; i < shape.days; i++) {
    const isNight = i < shape.nights;
    const tonight = isNight
      ? placedLodging.filter((c) => c.day !== null && i >= c.day && i < c.day + lodgingNights(c, shape.nights))
      : [];
    if (isNight && tonight.length === 0) nightsWithoutLodging.push(i);
    if (tonight.length > 1) doubleBooked.push(i);
    days.push({
      index: i,
      date: addDays(date.start, i),
      lodging: tonight[0] ?? null,
      items: selected.filter((c) => c.category !== 'lodging' && c.day === i),
      note: trip.dayNotes[String(i)] ?? '',
    });
  }

  const unscheduled = [
    ...placedLodging.filter((c) => c.day === null),
    ...selected.filter((c) => c.category !== 'lodging' && c.category !== 'flights' && (c.day === null || c.day >= shape.days)),
  ];
  const baseMismatches: Itinerary['baseMismatches'] = [];
  for (const d of days) {
    // On departure day you set out from where you slept the night before.
    const stay = d.lodging ?? (d.index > 0 ? days[d.index - 1].lodging : null);
    const stayBase = stay?.base?.trim() ?? '';
    for (const item of d.items) {
      const itemBase = item.base?.trim() ?? '';
      if (stayBase && itemBase && norm(stayBase) !== norm(itemBase)) {
        baseMismatches.push({ day: d.index, item, itemBase, stayBase });
      }
    }
  }
  return { days, unscheduled, nightsWithoutLodging, doubleBooked, baseMismatches };
}
