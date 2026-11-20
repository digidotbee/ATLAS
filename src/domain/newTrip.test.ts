import { describe, expect, it } from 'vitest';
import { budgetTotalForEntry, NEW_TRIP_STEPS, optInDeadlineAfter, preferredNightsForDuration, stepErrors, type NewTripDraft } from './newTrip';

const base: NewTripDraft = {
  destination: 'Japan',
  name: '',
  region: '',
  budget: 9000,
  budgetSkipped: false,
  currency: 'USD',
  whenMode: 'date',
  date: '',
  endDate: '',
  startTime: '',
  endTime: '',
  singleDay: true,
  earliest: '',
  latest: '',
  optInBy: '',
  idealDuration: '',
  airport: 'LAS',
  flexibility: '',
  adults: 2,
  children: 2,
  childAges: '',
};

describe('new trip steps', () => {
  it('collects Schedule and Crew before Budget & Launch', () => {
    expect(NEW_TRIP_STEPS).toEqual(['where', 'when', 'who', 'budget']);
  });
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
  it('validates a fixed date and permits a single-day event without an end date', () => {
    expect(stepErrors('when', base)[0]).toMatch(/Choose a date/);
    expect(stepErrors('when', { ...base, date: '2027-05-21' })).toEqual([]);
    expect(stepErrors('when', { ...base, date: '2027-05-21', singleDay: false })[0]).toMatch(/end date/);
    expect(stepErrors('when', { ...base, date: '2027-07-30', endDate: '2027-05-21', singleDay: false })[0]).toMatch(/on or after/);
  });
  it('requires a valid date-decision window and opt-in deadline', () => {
    const decision: NewTripDraft = { ...base, whenMode: 'decision' };
    expect(stepErrors('when', decision)).toHaveLength(2);
    expect(stepErrors('when', { ...decision, earliest: '2027-05-21' })[0]).toMatch(/both possible window dates/);
    expect(stepErrors('when', { ...decision, earliest: '2027-07-30', latest: '2027-05-21', optInBy: '2027-05-01T18:00' })[0]).toMatch(/after earliest start/);
    expect(stepErrors('when', { ...decision, earliest: '2027-05-21', latest: '2027-07-30', optInBy: '2027-05-01T18:00' })).toEqual([]);
  });
  it('maps familiar day and weekend duration text to trip-length preferences', () => {
    expect(preferredNightsForDuration('1 weekend')).toBe(2);
    expect(preferredNightsForDuration('5 days')).toBe(4);
    expect(preferredNightsForDuration('3 hours')).toBeNull();
  });
  it('sets the deadline shortcuts in local time across the end of a month', () => {
    const now = new Date(2030, 0, 31, 18, 45).getTime();
    expect(optInDeadlineAfter(24, now)).toBe('2030-02-01T18:45');
    expect(optInDeadlineAfter(72, now)).toBe('2030-02-03T18:45');
  });
  it('uses whole-person counts with at least one adult', () => {
    expect(stepErrors('who', { ...base, adults: 0 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, adults: 1.5 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, children: -1 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, children: null })).toEqual([]);
  });
});
