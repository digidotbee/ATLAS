// ATLAS domain model. Everything persisted lives under AtlasData.

export const SCHEMA_VERSION = 1;

export type Category = 'flights' | 'lodging' | 'transport' | 'food' | 'activities' | 'other';

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'flights', label: 'Flights', icon: '✈' },
  { id: 'lodging', label: 'Lodging', icon: '⌂' },
  { id: 'transport', label: 'Getting around', icon: '⇄' },
  { id: 'food', label: 'Meals & food', icon: '◍' },
  { id: 'activities', label: 'Experiences', icon: '✦' },
  { id: 'other', label: 'Other', icon: '•' },
];

/** How a price scales with the trip. */
export type PriceBasis = 'total' | 'perPerson' | 'perNight' | 'perDay' | 'perPersonPerDay';

export const PRICE_BASES: { id: PriceBasis; label: string }[] = [
  { id: 'total', label: 'total' },
  { id: 'perPerson', label: 'per person' },
  { id: 'perNight', label: 'per night' },
  { id: 'perDay', label: 'per day' },
  { id: 'perPersonPerDay', label: 'per person / day' },
];

/** Estimated = a guess or typical range. Verified = you saw the real quote. */
export type PriceStatus = 'estimated' | 'verified';

export type CandidateStatus = 'considering' | 'selected' | 'rejected';

export interface Candidate {
  id: string;
  category: Category;
  name: string;
  location: string;
  url: string;
  notes: string;
  price: number;
  basis: PriceBasis;
  /**
   * Overrides the automatic multiplier (nights, days or people) when set.
   * e.g. lodging booked for 4 of the 9 nights.
   */
  units: number | null;
  priceStatus: PriceStatus;
  status: CandidateStatus;
  tags: string[];
  /**
   * Which base (town / area you stay in) this belongs to, e.g. "Kyoto".
   * Optional: data saved before v1.1 has no base.
   */
  base?: string;
  /** 0-based itinerary day. For lodging this is the check-in day. */
  day: number | null;
  createdAt: string;
}

export interface DateOption {
  id: string;
  label: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Airfare estimate for this window, per person. */
  flightPerPerson: number | null;
  flightStatus: PriceStatus;
  notes: string;
}

/**
 * Cost and timing of a travel leg: arriving from the airport, moving between bases, or leaving.
 * Stored per route (e.g. "kanazawa>kamakura"); all money is per person.
 */
export interface Move {
  /** Main ride, e.g. Shinkansen or airport express. */
  mode: string;
  ridePerPerson: number | null;
  /** Getting to/from stations: taxi, bus, subway. */
  localPerPerson: number | null;
  /** Food on a travel day (e.g. a station bento). */
  mealPerPerson: number | null;
  /** Door to door, including packing up, station time and the ride. */
  hours: number | null;
  /** Check-out time at the old place (HH:MM). */
  checkout: string;
  /** Earliest check-in at the new place (HH:MM). */
  checkin: string;
  priceStatus: PriceStatus;
  notes: string;
}

export interface Travelers {
  adults: number;
  children: number;
  childAges: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  region: string;
  currency: string;
  budgetTotal: number;
  /** Percent of the total budget held back for surprises. */
  contingencyPct: number;
  travelers: Travelers;
  /** Free-text description of how flexible dates are. */
  flexibility: string;
  dateOptions: DateOption[];
  chosenDateId: string | null;
  /** Open travel window: earliest arrival and latest departure (YYYY-MM-DD). Optional (added in v1.2). */
  windowStart?: string;
  windowEnd?: string;
  /** Typical whole-group spend per day, excluding flights; used before lodging is chosen. */
  dailyEstimate?: number | null;
  /** Travel legs keyed by route, see moves.ts. Optional (added in v1.2). */
  moves?: Record<string, Move>;
  /** Follow-up question answers keyed by question id. */
  answers: Record<string, string>;
  candidates: Candidate[];
  dayNotes: Record<string, string>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyProfile {
  familyName: string;
  homeAirport: string;
  defaultCurrency: string;
  defaultAdults: number;
  defaultChildren: number;
  interests: string[];
  notes: string;
}

export interface AtlasData {
  schemaVersion: number;
  profile: FamilyProfile;
  trips: Trip[];
  updatedAt: string;
}
