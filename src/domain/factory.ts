import {
  SCHEMA_VERSION,
  type AtlasData,
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
  budgetTotal: number;
  adults: number;
  children: number;
  childAges: string;
  flexibility: string;
  dateOptions: Omit<DateOption, 'id'>[];
}

export function createTrip(input: NewTripInput): Trip {
  const ts = nowIso();
  const dateOptions = input.dateOptions.map((d) => ({ ...d, id: newId() }));
  return {
    id: newId(),
    name: input.name.trim() || input.destination.trim(),
    destination: input.destination.trim(),
    region: input.region.trim(),
    currency: input.currency,
    budgetTotal: input.budgetTotal,
    contingencyPct: 10,
    travelers: { adults: input.adults, children: input.children, childAges: input.childAges },
    flexibility: input.flexibility,
    dateOptions,
    chosenDateId: dateOptions.length === 1 ? dateOptions[0].id : null,
    answers: {},
    candidates: [],
    dayNotes: {},
    notes: '',
    createdAt: ts,
    updatedAt: ts,
  };
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
