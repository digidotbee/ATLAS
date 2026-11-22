import { nightsBetween } from './budget';
import type { BudgetBasis } from './types';

/** Answers collected by the step-by-step new-trip flow. */
export interface NewTripDraft {
  destination: string;
  name: string;
  region: string;
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

/** A datetime-local field needs wall time at the deadline, including its local offset. */
export function optInDeadlineAfter(hours: number, now = Date.now()): string {
  const deadline = new Date(now + hours * 3_600_000);
  const localTime = deadline.getTime() - deadline.getTimezoneOffset() * 60_000;
  return new Date(localTime).toISOString().slice(0, 16);
}

export const NEW_TRIP_STEPS = ['where', 'when', 'who', 'budget'] as const;
export type NewTripStep = (typeof NEW_TRIP_STEPS)[number];

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
