import type { Candidate, Category, DateOption, PriceStatus, Trip } from './types';

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
  budget: number;
  lines: BudgetLine[];
  byCategory: Record<Category, number>;
  committed: number;
  estimated: number;
  verified: number;
  contingency: number;
  remaining: number;
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

  if (!date) warnings.push('Choose travel dates so nightly and daily costs can be calculated.');
  else if (shape.nights === 0) warnings.push('The chosen dates have no nights — check start and end.');
  if (shape.people === 0) warnings.push('Add at least one traveler.');
  if (selected.length > 0 && !selected.some((c) => c.category === 'transport')) {
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
  const contingency = round2((trip.budgetTotal * trip.contingencyPct) / 100);
  const remaining = round2(trip.budgetTotal - committed - contingency);

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

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code typed by the user: show the code explicitly rather than guessing a symbol.
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}
