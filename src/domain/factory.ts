import { withBudgetTotal } from './budget';
import {
  SCHEMA_VERSION,
  type AtlasData,
  type BudgetBasis,
  type Candidate,
  type DateOption,
  type FamilyProfile,
  type Trip,
} from './types';

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Interests drawn from the family's stated travel preferences. Editable in Profile. */
export const DEFAULT_INTERESTS = [
  'Historic neighborhoods',
  'UNESCO World Heritage',
  'Architecture',
  'History',
  'Local markets',
  'Traditional communities',
  'Authentic food',
  'Landscapes',
  'Beaches',
  'Outdoor activities',
  'Surfing',
  'Bike-friendly',
  'Walkable',
  'Independent lodging with character',
  'Good value',
  'Quiet / local life',
];

export function defaultProfile(): FamilyProfile {
  return {
    familyName: '',
    homeAirport: '',
    defaultCurrency: 'USD',
    defaultAdults: 2,
    defaultChildren: 2,
    interests: [...DEFAULT_INTERESTS],
    notes: '',
  };
}

export function emptyData(): AtlasData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: defaultProfile(),
    trips: [],
    updatedAt: nowIso(),
  };
}

export interface NewTripInput {
  name: string;
  destination: string;
  region: string;
  currency: string;
  budgetTotal: number | null;
  budgetBasis?: BudgetBasis;
  /** Required with the 'perPerson' basis; the group total is derived from it. */
  budgetPerPerson?: number | null;
  adults: number;
  children: number;
  flexibility: string;
  dateOptions: Omit<DateOption, 'id'>[];
}

export function createTrip(input: NewTripInput): Trip {
  const ts = nowIso();
  const dateOptions = input.dateOptions.map((d) => ({ ...d, id: newId() }));
  const basis = input.budgetBasis ?? 'total';
  return withBudgetTotal({
    id: newId(),
    name: input.name.trim() || input.destination.trim(),
    destination: input.destination.trim(),
    region: input.region.trim(),
    currency: input.currency,
    budgetTotal: input.budgetTotal,
    budgetBasis: basis,
    ...(basis === 'perPerson' ? { budgetPerPerson: input.budgetPerPerson ?? null } : {}),
    contingencyPct: 10,
    travelers: { adults: input.adults, children: input.children },
    flexibility: input.flexibility,
    dateOptions,
    chosenDateId: dateOptions.length === 1 ? dateOptions[0].id : null,
    answers: {},
    candidates: [],
    dayNotes: {},
    notes: '',
    createdAt: ts,
    updatedAt: ts,
  });
}

export function blankDateOption(): DateOption {
  return {
    id: newId(),
    label: '',
    start: '',
    end: '',
    flightPerPerson: null,
    flightStatus: 'estimated',
    notes: '',
  };
}

export function blankCandidate(category: Candidate['category']): Candidate {
  const basisByCategory: Record<Candidate['category'], Candidate['basis']> = {
    flights: 'perPerson',
    lodging: 'perNight',
    transport: 'total',
    food: 'perPersonPerDay',
    activities: 'perPerson',
    other: 'total',
  };
  return {
    id: newId(),
    category,
    name: '',
    location: '',
    url: '',
    notes: '',
    price: 0,
    basis: basisByCategory[category],
    units: null,
    priceStatus: 'estimated',
    status: 'considering',
    tags: [],
    day: null,
    createdAt: nowIso(),
  };
}

/** A full copy of a trip with fresh ids; window → date links are preserved. */
export function duplicateTrip(t: Trip): Trip {
  const ts = nowIso();
  const winIds = new Map((t.windows ?? []).map((w) => [w.id, newId()]));
  const dateIds = new Map(t.dateOptions.map((d) => [d.id, newId()]));
  const candIds = new Map(t.candidates.map((c) => [c.id, newId()]));
  return {
    ...structuredClone(t),
    id: newId(),
    name: `${t.name} (copy)`,
    createdAt: ts,
    updatedAt: ts,
    candidates: t.candidates.map((c) => ({ ...structuredClone(c), id: candIds.get(c.id)! })),
    dateOptions: t.dateOptions.map((d) => ({
      ...d,
      id: dateIds.get(d.id)!,
      ...(d.fromWindowId ? { fromWindowId: winIds.get(d.fromWindowId) ?? d.fromWindowId } : {}),
    })),
    chosenDateId: t.chosenDateId ? (dateIds.get(t.chosenDateId) ?? null) : null,
    windows: t.windows?.map((w) => ({ ...structuredClone(w), id: winIds.get(w.id)! })),
  };
}
