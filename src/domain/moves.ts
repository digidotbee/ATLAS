import type { Candidate, Move, PriceStatus, Trip } from './types';

/** Selected lodging with check-in days resolved (a single lodging with no day starts on day 0). */
export function placedLodging(trip: Trip): Candidate[] {
  const lodging = trip.candidates.filter((c) => c.status === 'selected' && c.category === 'lodging');
  return lodging.map((c) => (c.day === null && lodging.length === 1 ? { ...c, day: 0 } : c));
}

export function lodgingNights(c: Candidate, tripNights: number): number {
  return c.units !== null ? c.units : tripNights;
}

export const AIRPORT = 'Airport';

export function placeName(c: Candidate): string {
  return c.base?.trim() || c.name;
}

const norm = (s: string) => s.trim().toLowerCase();
export function moveKey(from: string, to: string): string {
  return `${norm(from)}>${norm(to)}`;
}

export function blankMove(): Move {
  return {
    mode: '',
    ridePerPerson: null,
    localPerPerson: null,
    mealPerPerson: null,
    hours: null,
    checkout: '10:00',
    checkin: '15:00',
    priceStatus: 'estimated' as PriceStatus,
    notes: '',
  };
}

export interface TravelLeg {
  key: string;
  kind: 'arrive' | 'move' | 'depart';
  from: string;
  to: string;
  /** Itinerary day the leg happens on. */
  day: number;
  move: Move;
  /** Whole-group cost, or null when no costs have been entered yet. */
  cost: number | null;
}

export function legCost(m: Move, people: number): number | null {
  const parts = [m.ridePerPerson, m.localPerPerson, m.mealPerPerson];
  if (parts.every((p) => p === null)) return null;
  return Math.round(parts.reduce<number>((s, p) => s + (p ?? 0), 0) * people * 100) / 100;
}

/**
 * Travel legs implied by the chosen places to stay, in order:
 * airport → first stay, each change of stay, last stay → airport.
 */
export function travelLegs(trip: Trip, nights: number, people: number): TravelLeg[] {
  if (nights <= 0) return [];
  const stays = placedLodging(trip)
    .filter((c) => c.day !== null)
    .sort((a, b) => a.day! - b.day!);
  if (stays.length === 0) return [];
  const stored = trip.moves ?? {};
  const make = (kind: TravelLeg['kind'], from: string, to: string, day: number): TravelLeg => {
    const key = moveKey(from, to);
    const move = stored[key] ?? blankMove();
    return { key, kind, from, to, day, move, cost: legCost(move, people) };
  };
  const legs = [make('arrive', AIRPORT, placeName(stays[0]), 0)];
  for (let i = 1; i < stays.length; i++) {
    const from = stays[i - 1];
    const to = stays[i];
    const sameBase = norm(placeName(from)) === norm(placeName(to));
    legs.push(make('move', sameBase ? from.name : placeName(from), sameBase ? to.name : placeName(to), to.day!));
  }
  legs.push(make('depart', placeName(stays[stays.length - 1]), AIRPORT, nights));
  return legs;
}

export function legLabel(l: TravelLeg): string {
  if (l.kind === 'arrive') return `Arrive: airport → ${l.to}`;
  if (l.kind === 'depart') return `Leave: ${l.from} → airport`;
  return `Move: ${l.from} → ${l.to}`;
}

function addHours(hhmm: string, hours: number): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const total = Number(m[1]) * 60 + Number(m[2]) + Math.round(hours * 60);
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Plain-language timeline for a moving day. */
export function legTimeline(l: TravelLeg): string[] {
  const m = l.move;
  const ride = m.mode || 'train';
  if (l.kind === 'arrive') {
    return [
      `Land, then ${m.mode || 'airport train or bus'} to ${l.to}${m.hours !== null ? ` (~${m.hours} h door to door)` : ''}`,
      `Check in from ${m.checkin}${m.mealPerPerson !== null ? ' · easy meal near the station' : ''}`,
    ];
  }
  if (l.kind === 'depart') {
    return [
      `Pack and check out by ${m.checkout}`,
      `${m.mode || 'Train or bus'} to the airport${m.hours !== null ? ` (~${m.hours} h)` : ''} — allow 2–3 h before an international flight`,
    ];
  }
  const arrive = m.hours !== null ? addHours(m.checkout, m.hours) : null;
  const steps = [
    `Pack and check out by ${m.checkout}`,
    `Get to the station, ${ride}${m.hours !== null ? ` (~${m.hours} h door to door)` : ''}${m.mealPerPerson !== null ? ', lunch on the way' : ''}`,
  ];
  if (arrive) {
    steps.push(
      arrive < m.checkin
        ? `Arrive ~${arrive}; drop bags and explore until check-in at ${m.checkin}`
        : `Arrive ~${arrive} and check in`,
    );
  } else steps.push(`Check in from ${m.checkin}`);
  return steps;
}
