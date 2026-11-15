import { describe, expect, it } from 'vitest';
import { stepErrors, type NewTripDraft } from './newTrip';

const base: NewTripDraft = {
  destination: 'Japan', name: '', region: '', budget: 9000, currency: 'USD', earliest: '', latest: '',
  minNights: null, prefNights: null, maxNights: null, airport: 'LAS', flexibility: '', adults: 2, children: 2, childAges: '',
};

describe('new trip steps', () => {
  it('requires a destination and a budget', () => {
    expect(stepErrors('where', { ...base, destination: '  ' })).toHaveLength(1);
    expect(stepErrors('budget', { ...base, budget: null })).toHaveLength(1);
    expect(stepErrors('budget', { ...base, currency: 'us' })).toHaveLength(1);
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
