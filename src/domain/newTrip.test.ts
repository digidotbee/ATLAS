import { describe, expect, it } from 'vitest';
import { budgetTotalForEntry, endsNextDay, NEW_TRIP_STEPS, optInDeadlineAfter, preferredNightsForDuration, stepErrors, type NewTripDraft } from './newTrip';
import { deviceTimeZone } from './timeZone';

const base: NewTripDraft = {
  destination: 'Japan',
  name: '',
  region: '',
  timeZone: 'America/Los_Angeles',
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
  it('LAUNCH-02 reads a single evening that ends before it starts as ending the next day', () => {
    const evening = { ...base, singleDay: true, date: '2027-05-21', startTime: '21:00', endTime: '01:00' };
    expect(stepErrors('when', evening)).toEqual([]);
    // A multi-day Venture names its end date, so the same backwards times on one date are still a mistake.
    expect(stepErrors('when', { ...evening, singleDay: false, endDate: evening.date })).toEqual([
      'The end time must be at or after the start time on the same day.',
    ]);
    expect(stepErrors('when', { ...evening, singleDay: false, endDate: '2027-05-22' })).toEqual([]);
  });
  it.each([
    [{ start: '2027-05-21', end: '2027-05-21', startTime: '21:00', endTime: '01:00' }, true],
    [{ start: '2027-05-21', end: '2027-05-21', startTime: '18:00', endTime: '21:00' }, false],
    [{ start: '2027-05-21', end: '2027-05-21', startTime: '18:00', endTime: '18:00' }, false],
    [{ start: '2027-05-21', end: '2027-05-21', endTime: '01:00' }, false],
    [{ start: '2027-05-21', end: '2027-05-22', startTime: '21:00', endTime: '01:00' }, false],
  ])('LAUNCH-02 says when a single day ends the next day %#', (dates, expected) => {
    expect(endsNextDay(dates)).toBe(expected);
  });
  it.each([
    ['18:00', '21:00'],
    ['18:00', '18:00'],
    ['18:00', ''],
    ['', '18:00'],
  ])('LAUNCH-02 accepts optional same-day times [%s, %s]', (startTime, endTime) => {
    expect(stepErrors('when', { ...base, date: '2027-05-21', startTime, endTime })).toEqual([]);
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
    expect(optInDeadlineAfter(24, deviceTimeZone(), now)).toBe('2030-02-01T18:45');
    expect(optInDeadlineAfter(72, deviceTimeZone(), now)).toBe('2030-02-03T18:45');
  });
  it('D10 sets the deadline shortcuts in the Venture time zone, not the device zone', () => {
    const now = Date.UTC(2026, 10, 22, 12, 0); // Nov 22, 2026, noon UTC
    expect(optInDeadlineAfter(24, 'America/Los_Angeles', now)).toBe('2026-11-23T04:00');
    expect(optInDeadlineAfter(24, 'Asia/Tokyo', now)).toBe('2026-11-23T21:00');
    expect(optInDeadlineAfter(72, 'Asia/Kolkata', now)).toBe('2026-11-25T17:30');
  });
  it('D10 keeps 24 hours exact across a daylight-saving change', () => {
    const now = Date.UTC(2027, 2, 13, 12, 0); // Mar 13, 2027, 7:00 a.m. EST in New York
    expect(optInDeadlineAfter(24, 'America/New_York', now)).toBe('2027-03-14T08:00');
  });
  it('uses whole-person counts with at least one adult', () => {
    expect(stepErrors('who', { ...base, adults: 0 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, adults: 1.5 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, children: -1 })).toHaveLength(1);
    expect(stepErrors('who', { ...base, children: null })).toEqual([]);
  });
});
