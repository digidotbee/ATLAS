import { nightsBetween } from './budget';

/** Answers collected by the step-by-step new-trip flow. */
export interface NewTripDraft {
  destination: string;
  name: string;
  region: string;
  budget: number | null;
  budgetSkipped: boolean;
  currency: string;
  earliest: string;
  latest: string;
  minNights: number | null;
  prefNights: number | null;
  maxNights: number | null;
  airport: string;
  flexibility: string;
  adults: number | null;
  children: number | null;
  childAges: string;
}

export type BudgetMode = 'total' | 'perPerson';

/** Resolve the entered amount only once the final traveler count is known. */
export function budgetTotalForEntry(amount: number | null, mode: BudgetMode, adults: number, children: number): number | null {
  if (amount === null) return null;
  return mode === 'perPerson' ? amount * (adults + children) : amount;
}

export const NEW_TRIP_STEPS = ['where', 'budget', 'when', 'who'] as const;
export type NewTripStep = (typeof NEW_TRIP_STEPS)[number];

/** Problems that block moving past a step. "When" may be left blank ("not sure yet"). */
export function stepErrors(step: NewTripStep, d: NewTripDraft): string[] {
  const e: string[] = [];
  if (step === 'where' && !d.destination.trim()) e.push('Add a destination, region or idea.');
  if (step === 'budget') {
    if (!d.budgetSkipped && (d.budget === null || !Number.isFinite(d.budget) || d.budget <= 0)) e.push('Enter a budget greater than zero, or skip for now.');
    if (!/^[A-Z]{3}$/.test(d.currency)) e.push('Currency must be a 3-letter code such as USD or EUR.');
  }
  if (step === 'when') {
    if (Boolean(d.earliest) !== Boolean(d.latest)) e.push('Add both dates, or leave both blank if you’re not sure yet.');
    else if (d.earliest && d.latest) {
      const span = nightsBetween(d.earliest, d.latest);
      if (span === null || span < 1) e.push('The day you must be back has to be after the earliest day you can leave.');
    }
    if (d.minNights && d.maxNights && d.minNights > d.maxNights) e.push('Shortest trip can’t be longer than the longest trip.');
  }
  if (step === 'who' && (!d.adults || d.adults < 1)) e.push('At least one adult is needed.');
  return e;
}
