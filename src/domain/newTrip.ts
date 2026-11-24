import { nightsBetween } from './budget';
import { wallTimeAt } from './timeZone';
import type { BudgetBasis } from './types';

/** Answers collected by the step-by-step new-trip flow. */
export interface NewTripDraft {
  destination: string;
  name: string;
  region: string;
  /** IANA name (D10); dates, times and Opt in by are clock times in this zone. */
  timeZone: string;
  budget: number | null;
  budgetSkipped: boolean;
  currency: string;
  whenMode: 'date' | 'decision';
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  singleDay: boolean;
  earliest: string;
  latest: string;
  optInBy: string;
  idealDuration: string;
  airport: string;
  flexibility: string;
  adults: number | null;
  children: number | null;
}

export type BudgetMode = BudgetBasis;
export const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Resolve the entered amount only once the final traveler count is known. */
export function budgetTotalForEntry(amount: number | null, mode: BudgetMode, adults: number, children: number): number | null {
  if (amount === null) return null;
  return mode === 'perPerson' ? amount * (adults + children) : amount;
}

/** Convert common day/night durations to the existing trip-length preference when possible. */
export function preferredNightsForDuration(value: string): number | null {
  const text = value.trim().toLowerCase();
  if (/weekend/.test(text)) return 2;
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(days?|nights?)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Math.max(1, Math.round(match[2].startsWith('day') ? amount - 1 : amount));
}

/** The deadline `hours` from now, as a datetime-local value in the Venture's time zone (D10). */
export function optInDeadlineAfter(hours: number, timeZone: string, now = Date.now()): string {
  return wallTimeAt(now + hours * 3_600_000, timeZone);
}

export const NEW_TRIP_STEPS = ['where', 'when', 'who', 'budget'] as const;
export type NewTripStep = (typeof NEW_TRIP_STEPS)[number];

/**
 * True when a single day or evening runs past midnight: it starts and ends on the same date,
 * but its end time is earlier than its start time, so it ends the next day (PRD v0.25).
 */
export function endsNextDay(dates: { start: string; end: string; startTime?: string; endTime?: string }): boolean {
  return dates.start === dates.end && !!dates.startTime && !!dates.endTime && dates.endTime < dates.startTime;
}

/** Problems that block moving past a step. */
export function stepErrors(step: NewTripStep, d: NewTripDraft): string[] {
  const e: string[] = [];
  if (step === 'where' && !d.destination.trim()) e.push('Add a destination, region or idea.');
  if (step === 'budget') {
    if (!d.budgetSkipped && (d.budget === null || !Number.isFinite(d.budget) || d.budget <= 0)) e.push('Enter a budget greater than zero, or skip for now.');
    if (!CURRENCY_CODE.test(d.currency)) e.push('Currency must be a 3-letter code such as USD or EUR.');
  }
  if (step === 'when') {
    if (d.whenMode === 'date') {
      if (!d.date) e.push('Choose a date.');
      if (!d.singleDay && !d.endDate) e.push('Add an end date, or choose Single day / evening.');
      else if (d.date && d.endDate && d.endDate < d.date) e.push('The end date must be on or after the start date.');
      // A single day or evening may run past midnight (see endsNextDay). A multi-day Venture
      // names its end date, so backwards times on one date are a mistake there.
      if (d.date && !d.singleDay && d.endDate === d.date && d.startTime && d.endTime && d.endTime < d.startTime) {
        e.push('The end time must be at or after the start time on the same day.');
      }
    } else {
      if (!d.earliest || !d.latest) e.push('Add both possible window dates.');
      else {
        const span = nightsBetween(d.earliest, d.latest);
        if (span === null || span < 1) e.push('Latest wrap-up must be after earliest start.');
      }
      if (!d.optInBy) e.push('Set an opt-in deadline.');
    }
  }
  if (step === 'who') {
    if (!Number.isInteger(d.adults) || (d.adults ?? 0) < 1) e.push('Enter at least one adult using a whole number.');
    if (!Number.isInteger(d.children ?? 0) || (d.children ?? 0) < 0) e.push('Enter zero or a whole number of children.');
  }
  return e;
}
