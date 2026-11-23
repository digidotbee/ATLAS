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
  startTime?: string; // HH:mm local time
  endTime?: string; // HH:mm local time
  /** Airfare estimate for this window, per person. */
  flightPerPerson: number | null;
  flightStatus: PriceStatus;
  notes: string;
  /**
   * Set by the v1.3 migration: this range was really an availability window entered before
   * ATLAS separated availability from trip dates. Kept for reference, never used for costs.
   */
  legacyAvailability?: boolean;
  /** The candidate window this trip-date option was locked from. */
  fromWindowId?: string;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

/** When the family COULD travel. Not the trip dates. */
export interface Availability {
  /** Earliest day the event or trip could start. */
  earliestDeparture: string;
  /** Latest day the event or trip could wrap up. */
  latestReturn: string;
  preferredRanges: DateRange[];
  excludedRanges: DateRange[];
  /** Optional local datetime by which collaborators should opt in. */
  optInBy?: string;
  /** Free-text ideal duration, e.g. "3 hours", "1 weekend", or "5 days". */
  idealDuration?: string;
}

export interface TripConstraints {
  departureAirport: string;
  minNights: number | null;
  preferredNights: number | null;
  maxNights: number | null;
}

export interface PriceSource {
  url: string;
  note: string;
  /** When the figure was looked up (YYYY-MM-DD). */
  checkedAt: string;
}

/** Historical climate for a month — an average, never a forecast. */
export interface ClimateMonth {
  /** 0 (poor) to 5 (ideal) for this family's plans. */
  score: number;
  summary: string;
}

/**
 * Stage A planning estimates. In Planning Estimate Mode every figure here is an ESTIMATE:
 * monthly airfares are route-level averages, not fares for specific dates.
 */
export interface PlanningAssumptions {
  /** Round-trip economy airfare per person, keyed by departure month "YYYY-MM". */
  airfarePerPersonByMonth: Record<string, number>;
  baggageIncluded: boolean;
  /** Days between leaving home and arriving (1 for overnight flights that land the next day). */
  arrivalOffsetDays: number;
  /** Days between leaving the destination and arriving home. */
  returnOffsetDays: number;
  lodgingPerNight: number | null;
  foodPerPersonPerDay: number | null;
  /** Whole group, per day: local trains, buses, taxis, car. */
  transportPerDay: number | null;
  activitiesPerPersonPerDay: number | null;
  /** Taxes and fees as a percent of lodging. */
  feesPct: number;
  /** Keyed by month "MM". */
  climateByMonth: Record<string, ClimateMonth>;
  sources: PriceSource[];
  researchedAt: string | null;
  origin: 'manual' | 'assistant';
}

export type WindowStatus = 'proposed' | 'kept' | 'rejected' | 'locked';

/** A possible vacation inside the availability window, fully costed. */
export interface CandidateTravelWindow {
  id: string;
  /** Leave home. */
  departureDate: string;
  /** Arrive at destination. */
  arrivalDate: string;
  /** Leave destination. */
  destinationDepartureDate: string;
  /** Back home. */
  returnDate: string;
  destinationNights: number;
  airfareTotal: number;
  lodgingTotal: number;
  groundTransportTotal: number;
  foodTotal: number;
  activitiesTotal: number;
  feesTotal: number;
  contingency: number;
  projectedTotal: number;
  remainingBudget: number | null;
  weatherScore: number | null;
  weatherAssessment: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
  labels: string[];
  reasons: string[];
  priceSources: PriceSource[];
  /** Always "estimated" unless the family verified every price themselves. */
  priceStatus: PriceStatus;
  status: WindowStatus;
  feedback: string;
  /** A fare looked up for these exact dates (per person). */
  fareOverridePerPerson?: number | null;
  /** True only when the family checked this exact fare themselves. */
  fareOverrideVerified?: boolean;
  fareOverrideSource?: string;
}

/** Transparent, user-adjustable weights for ranking windows. */
export interface ScoringWeights {
  cost: number;
  value: number;
  duration: number;
  weather: number;
  preferences: number;
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

/** How the Planner entered the budget. Data saved before bases existed counts as 'total'. */
export type BudgetBasis = 'total' | 'perPerson';

export interface Travelers {
  adults: number;
  children: number;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  region: string;
  /**
   * IANA time zone (D10) that dates, times and Opt in by are read in, e.g. "America/Los_Angeles".
   * Missing on Ventures saved before D10; read those with ventureTimeZone(), which uses the device's.
   */
  timeZone?: string;
  currency: string;
  /**
   * Group total, everything included. Every budget calculation reads this.
   * With a per-person basis it is derived: budgetPerPerson × headcount (see withBudgetTotal).
   */
  budgetTotal: number | null;
  /** Basis the Planner chose. Missing means 'total'. */
  budgetBasis?: BudgetBasis;
  /** The per-person amount the Planner entered; used only with the 'perPerson' basis. */
  budgetPerPerson?: number | null;
  /** Percent of the total budget held back for surprises. */
  contingencyPct: number;
  travelers: Travelers;
  /** Free-text description of how flexible dates are. */
  flexibility: string;
  dateOptions: DateOption[];
  chosenDateId: string | null;
  /** v1.2 fields, superseded by `availability`; read only by the migration. */
  windowStart?: string;
  windowEnd?: string;
  /** Typical whole-group spend per day, excluding flights (v1.2; still used by affordability). */
  dailyEstimate?: number | null;
  /** v1.3: when the family could travel (not the trip dates). */
  availability?: Availability;
  constraints?: TripConstraints;
  assumptions?: PlanningAssumptions;
  windows?: CandidateTravelWindow[];
  weights?: ScoringWeights;
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
  /** Historical climate reused across trips, keyed by normalized destination then month "MM". */
  climateCache?: Record<string, Record<string, ClimateMonth>>;
}
