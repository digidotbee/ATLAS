import { describe, expect, it } from 'vitest';
import { budgetTotalForEntry, stepErrors, type NewTripDraft } from './newTrip';

const base: NewTripDraft = {
  destination: 'Japan', name: '', region: '', budget: 9000, budgetSkipped: false, currency: 'USD', earliest: '', latest: '',
  minNights: null, prefNights: null, maxNights: null, airport: 'LAS', flexibility: '', adults: 2, children: 2, childAges: '',
};

describe('new trip steps', () => {
  it('requires a destination and a budget', () => {
    expect(stepErrors('where', { ...base, destination: '  ' })).toHaveLength(1);
    expect(stepErrors('budget', { ...base, budget: null })).toHaveLength(1);
    expect(stepErrors('budget', { ...base, currency: 'us' })).toHaveLength(1);
  });
  it('allows skipping the budget step and converts per-person spend using the final group size', () => {
    expect(stepErrors('budget', { ...base, budget: null, budgetSkipped: true })).toEqual([]);
    expect(budgetTotalForEntry(1000, 'perPerson', 2, 1)).toBe(3000);
    expect(budgetTotalForEntry(1000, 'total', 2, 1)).toBe(1000);
    expect(budgetTotalForEntry(null, 'perPerson', 2, 1)).toBeNull();
  });
  it('allows "not sure yet" but not half-entered or backwards dates', () => {
    expect(stepErrors('when', base)).toEqual([]);
    expect(stepErrors('when', { ...base, earliest: '2027-05-21' })[0]).toMatch(/both dates/);
    expect(stepErrors('when', { ...base, earliest: '2027-07-30', latest: '2027-05-21' })[0]).toMatch(/after/);
    expect(stepErrors('when', { ...base, earliest: '2027-05-21', latest: '2027-07-30', minNights: 14, maxNights: 7 })[0]).toMatch(/Shortest/);
    expect(stepErrors('when', { ...base, earliest: '2027-05-21', latest: '2027-07-30' })).toEqual([]);
  });
  it('needs at least one adult', () => {
    expect(stepErrors('who', { ...base, adults: 0 })).toHaveLength(1);
  });
});
