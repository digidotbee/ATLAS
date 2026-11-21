import { legLabel, travelLegs } from './moves';
import type { BudgetBasis, Candidate, Category, DateOption, PriceStatus, Trip } from './types';

const DAY_MS = 86_400_000;

function parseDay(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(iso + 'T00:00:00Z');
  return Number.isNaN(t) ? null : t;
}

/** Nights between two YYYY-MM-DD dates. null when either date is missing/invalid or end < start. */
export function nightsBetween(start: string, end: string): number | null {
  const s = parseDay(start);
  const e = parseDay(end);
  if (s === null || e === null || e < s) return null;
  return Math.round((e - s) / DAY_MS);
}

export function addDays(start: string, days: number): string {
  const s = parseDay(start);
  if (s === null) throw new Error(`Invalid date "${start}"`);
  return new Date(s + days * DAY_MS).toISOString().slice(0, 10);
}

export function travelerCount(trip: Trip): number {
  return trip.travelers.adults + trip.travelers.children;
}

export function chosenDate(trip: Trip): DateOption | null {
  return trip.dateOptions.find((d) => d.id === trip.chosenDateId) ?? null;
}

export interface TripShape {
  people: number;
  nights: number;
  days: number;
}

/** People/nights/days used for cost math, for a given date option (or the chosen one). */
export function tripShape(trip: Trip, date: DateOption | null = chosenDate(trip)): TripShape {
  const nights = date ? nightsBetween(date.start, date.end) ?? 0 : 0;
  return { people: travelerCount(trip), nights, days: nights > 0 ? nights + 1 : 0 };
}

/** Multiplier applied to a candidate's price. `units` overrides the automatic value. */
export function multiplier(c: Candidate, shape: TripShape): number {
  if (c.units !== null && c.units >= 0) {
    return c.basis === 'perPersonPerDay' ? c.units * shape.people : c.units;
  }
  switch (c.basis) {
    case 'total':
      return 1;
    case 'perPerson':
      return shape.people;
    case 'perNight':
      return shape.nights;
    case 'perDay':
      return shape.days;
    case 'perPersonPerDay':
      return shape.people * shape.days;
  }
}

export function candidateCost(c: Candidate, shape: TripShape): number {
  return round2(c.price * multiplier(c, shape));
}

export interface BudgetLine {
  key: string;
  category: Category;
  label: string;
  amount: number;
  status: PriceStatus;
  candidateId: string | null;
}

export interface BudgetSummary {
  shape: TripShape;
  budget: number | null;
  lines: BudgetLine[];
  byCategory: Record<Category, number>;
  committed: number;
  estimated: number;
  verified: number;
  contingency: number;
  remaining: number | null;
  /** Cost of everything still marked "considering", if it were all chosen. */
  consideringTotal: number;
  warnings: string[];
}

function emptyByCategory(): Record<Category, number> {
  return { flights: 0, lodging: 0, transport: 0, food: 0, activities: 0, other: 0 };
}

/**
 * Budget for a trip under a given date option (defaults to the chosen dates).
 * Airfare: selected flight candidates win; otherwise the date option's per-person estimate is used.
 */
export function summarize(trip: Trip, date: DateOption | null = chosenDate(trip)): BudgetSummary {
  const shape = tripShape(trip, date);
  const lines: BudgetLine[] = [];
  const warnings: string[] = [];

  const selected = trip.candidates.filter((c) => c.status === 'selected');
  for (const c of selected) {
    lines.push({
      key: c.id,
      category: c.category,
      label: c.name || '(unnamed)',
      amount: candidateCost(c, shape),
      status: c.priceStatus,
      candidateId: c.id,
    });
  }

  const hasFlightSelection = selected.some((c) => c.category === 'flights');
  if (!hasFlightSelection && date && date.flightPerPerson !== null && date.flightPerPerson > 0) {
    lines.push({
      key: `flight-${date.id}`,
      category: 'flights',
      label: `Airfare (${shape.people} × ${date.flightPerPerson} for ${date.label || 'these dates'})`,
      amount: round2(date.flightPerPerson * shape.people),
      status: date.flightStatus,
      candidateId: null,
    });
  }

  const legs = travelLegs(trip, shape.nights, shape.people);
  for (const l of legs) {
    if (l.cost === null) continue;
    lines.push({ key: `move-${l.key}`, category: 'transport', label: legLabel(l), amount: l.cost, status: l.move.priceStatus, candidateId: null });
  }
  const unpriced = legs.filter((l) => l.cost === null);
  if (unpriced.length > 0) {
    warnings.push(`Travel-day costs not entered yet: ${unpriced.map(legLabel).join('; ')}. Add them on the Itinerary.`);
  }

  if (!date) warnings.push('Choose travel dates so nightly and daily costs can be calculated.');
  else if (shape.nights === 0) warnings.push('The chosen dates have no nights — check start and end.');
  if (shape.people === 0) warnings.push('Add at least one traveler.');
  if (legs.length === 0 && selected.length > 0 && !selected.some((c) => c.category === 'transport')) {
    const bases = new Set(selected.filter((c) => c.category === 'lodging').map((c) => c.id));
    warnings.push(
      bases.size > 1
        ? 'No transport chosen: travel between your places to stay and to/from the airport is not in the budget yet.'
        : 'No transport chosen: airport transfers and getting around are not in the budget yet.',
    );
  }

  const byCategory = emptyByCategory();
  let estimated = 0;
  let verified = 0;
  for (const l of lines) {
    byCategory[l.category] = round2(byCategory[l.category] + l.amount);
    if (l.status === 'verified') verified += l.amount;
    else estimated += l.amount;
  }
  const committed = round2(estimated + verified);
  const contingency = trip.budgetTotal === null ? 0 : round2((trip.budgetTotal * trip.contingencyPct) / 100);
  const remaining = trip.budgetTotal === null ? null : round2(trip.budgetTotal - committed - contingency);

  const consideringTotal = round2(
    trip.candidates
      .filter((c) => c.status === 'considering')
      .reduce((sum, c) => sum + candidateCost(c, shape), 0),
  );

  return {
    shape,
    budget: trip.budgetTotal,
    lines,
    byCategory,
    committed,
    estimated: round2(estimated),
    verified: round2(verified),
    contingency,
    remaining,
    consideringTotal,
    warnings,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The basis the Planner chose; data saved before bases existed counts as 'total'. */
export function budgetBasisOf(trip: Trip): BudgetBasis {
  return trip.budgetBasis === 'perPerson' ? 'perPerson' : 'total';
}

/** The amount as the Planner entered it: per person or for the whole group. */
export function enteredBudget(trip: Trip): number | null {
  return budgetBasisOf(trip) === 'perPerson' ? (trip.budgetPerPerson ?? null) : trip.budgetTotal;
}

/**
 * Keeps the saved group total in step with a per-person budget (per person × headcount).
 * The store applies this on every save and on load, so a headcount change never leaves a stale total.
 * Total budgets are returned unchanged.
 */
export function withBudgetTotal(trip: Trip): Trip {
  if (budgetBasisOf(trip) !== 'perPerson') return trip;
  const perPerson = trip.budgetPerPerson ?? null;
  const total = perPerson === null ? null : round2(perPerson * travelerCount(trip));
  return total === trip.budgetTotal ? trip : { ...trip, budgetTotal: total };
}

/** Sets the amount in the Venture's current basis. */
export function setBudgetAmount(trip: Trip, amount: number | null): Trip {
  return budgetBasisOf(trip) === 'perPerson'
    ? withBudgetTotal({ ...trip, budgetPerPerson: amount })
    : { ...trip, budgetTotal: amount };
}

/** Switches the basis and keeps the group total the Planner already set (to the cent). */
export function setBudgetBasis(trip: Trip, basis: BudgetBasis): Trip {
  if (basis === budgetBasisOf(trip)) return trip;
  if (basis === 'total') return { ...trip, budgetBasis: 'total', budgetPerPerson: undefined };
  const people = travelerCount(trip);
  const perPerson = trip.budgetTotal === null || people === 0 ? null : round2(trip.budgetTotal / people);
  return withBudgetTotal({ ...trip, budgetBasis: 'perPerson', budgetPerPerson: perPerson });
}

export function formatMoney(amount: number, currency: string, maximumFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : maximumFractionDigits,
    }).format(amount);
  } catch {
    // Unknown currency code typed by the user: show the code explicitly rather than guessing a symbol.
    const value = maximumFractionDigits === 0 ? Math.round(amount) : amount;
    return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits })}`;
  }
}

export interface Affordability {
  /** Longest stay the budget covers, in nights (0 when even flights don't fit). */
  nights: number;
  /** Whole-group cost of one extra night (lodging + daily spending). */
  perNight: number;
  /** Costs that don't grow with trip length: airfare, one-off items, travel days. */
  fixed: number;
  source: 'choices' | 'estimate';
}

/**
 * How many nights the budget allows, given an airfare per person.
 * Uses chosen items when a place to stay has been chosen; otherwise the trip's daily estimate.
 * Returns null when there is nothing to base a daily cost on yet.
 */
export function affordableNights(trip: Trip, flightPerPerson: number | null): Affordability | null {
  if (trip.budgetTotal === null) return null;
  const people = travelerCount(trip);
  const selected = trip.candidates.filter((c) => c.status === 'selected');
  const flightItems = selected.filter((c) => c.category === 'flights');
  const airfare = flightItems.length
    ? flightItems.reduce((s, c) => s + candidateCost(c, { people, nights: 0, days: 0 }), 0)
    : (flightPerPerson ?? 0) * people;
  const available = trip.budgetTotal * (1 - trip.contingencyPct / 100);

  const lodging = selected.filter((c) => c.category === 'lodging' && c.basis === 'perNight');
  let perNight: number;
  let fixed = airfare;
  let source: Affordability['source'];
  if (lodging.length > 0) {
    source = 'choices';
    // You sleep in one place at a time: use the average nightly rate of the chosen places.
    const lodgingRate = lodging.reduce((s, c) => s + c.price, 0) / lodging.length;
    let daily = 0;
    for (const c of selected) {
      if (c.category === 'flights' || lodging.includes(c)) continue;
      const scalesWithLength = c.units === null && (c.basis === 'perNight' || c.basis === 'perDay' || c.basis === 'perPersonPerDay');
      if (scalesWithLength) daily += candidateCost(c, { people, nights: 1, days: 1 });
      else fixed += candidateCost(c, { people, nights: 1, days: 1 });
    }
    perNight = lodgingRate + daily;
    fixed += daily; // one more day than nights
    const legs = travelLegs(trip, Math.max(1, tripShape(trip).nights), people);
    fixed += legs.reduce((s, l) => s + (l.cost ?? 0), 0);
  } else if (trip.dailyEstimate && trip.dailyEstimate > 0) {
    source = 'estimate';
    perNight = trip.dailyEstimate;
  } else {
    return null;
  }
  const nights = perNight > 0 ? Math.max(0, Math.floor((available - fixed) / perNight)) : 0;
  return { nights, perNight: round2(perNight), fixed: round2(fixed), source };
}
