import { describe, expect, it } from 'vitest';
import { addDays, affordableNights, candidateCost, nightsBetween, summarize, tripShape } from './budget';
import { moveKey } from './moves';
import { blankCandidate, createTrip } from './factory';
import { matchedInterests } from './research';
import type { Candidate, Trip } from './types';

function trip(overrides: Partial<Trip> = {}): Trip {
  const t = createTrip({
    name: 'Costa Rica',
    destination: 'Guanacaste, Costa Rica',
    region: 'Central America',
    currency: 'USD',
    budgetTotal: 9000,
    adults: 2,
    children: 2,
    childAges: '',
    flexibility: '',
    dateOptions: [
      {
        label: 'Spring break',
        start: '2027-03-13',
        end: '2027-03-21',
        flightPerPerson: 500,
        flightStatus: 'estimated',
        notes: '',
      },
    ],
  });
  return { ...t, ...overrides };
}

function cand(p: Partial<Candidate>): Candidate {
  return { ...blankCandidate(p.category ?? 'other'), ...p };
}

describe('dates', () => {
  it('counts nights', () => {
    expect(nightsBetween('2027-03-13', '2027-03-21')).toBe(8);
    expect(nightsBetween('2027-03-21', '2027-03-13')).toBeNull();
    expect(nightsBetween('', '2027-03-13')).toBeNull();
  });
  it('adds days across months', () => {
    expect(addDays('2027-02-27', 3)).toBe('2027-03-02');
  });
});

describe('budget', () => {
  it('matches the Costa Rica example: $9,000 less $2,000 airfare', () => {
    const t = trip({ contingencyPct: 0 });
    const s = summarize(t);
    expect(s.shape).toEqual({ people: 4, nights: 8, days: 9 });
    expect(s.byCategory.flights).toBe(2000);
    expect(s.remaining).toBe(7000);
    expect(s.estimated).toBe(2000);
  });

  it('scales by basis and honours unit overrides', () => {
    const shape = tripShape(trip());
    expect(candidateCost(cand({ price: 200, basis: 'perNight' }), shape)).toBe(1600);
    expect(candidateCost(cand({ price: 200, basis: 'perNight', units: 3 }), shape)).toBe(600);
    expect(candidateCost(cand({ price: 15, basis: 'perPersonPerDay' }), shape)).toBe(540);
    expect(candidateCost(cand({ price: 15, basis: 'perPersonPerDay', units: 2 }), shape)).toBe(120);
    expect(candidateCost(cand({ price: 80, basis: 'perPerson' }), shape)).toBe(320);
    expect(candidateCost(cand({ price: 700, basis: 'total' }), shape)).toBe(700);
  });

  it('only counts selected items, separates estimated vs verified, holds contingency', () => {
    const t = trip({
      contingencyPct: 10,
      candidates: [
        cand({ category: 'lodging', price: 250, basis: 'perNight', status: 'selected', priceStatus: 'verified' }),
        cand({ category: 'activities', price: 60, basis: 'perPerson', status: 'considering' }),
        cand({ category: 'activities', price: 999, basis: 'total', status: 'rejected' }),
      ],
    });
    const s = summarize(t);
    expect(s.verified).toBe(2000);
    expect(s.estimated).toBe(2000); // date-option airfare
    expect(s.committed).toBe(4000);
    expect(s.contingency).toBe(900);
    expect(s.remaining).toBe(4100);
    expect(s.consideringTotal).toBe(240);
  });

  it('a selected flight candidate replaces the date-option airfare estimate', () => {
    const t = trip({
      candidates: [cand({ category: 'flights', price: 560, basis: 'perPerson', status: 'selected', priceStatus: 'verified' })],
    });
    const s = summarize(t);
    expect(s.byCategory.flights).toBe(2240);
    expect(s.lines.filter((l) => l.category === 'flights')).toHaveLength(1);
  });

  it('warns when choices exist but no transport is chosen', () => {
    const t = trip({ candidates: [cand({ category: 'activities', price: 100, basis: 'perPerson', status: 'selected' })] });
    expect(summarize(t).warnings.some((w) => /No transport chosen/.test(w))).toBe(true);
    const withStay = trip({ candidates: [cand({ category: 'lodging', price: 100, basis: 'perNight', status: 'selected' })] });
    expect(summarize(withStay).warnings.some((w) => /Travel-day costs not entered/.test(w))).toBe(true);
    const t2 = trip({ candidates: [...t.candidates, cand({ category: 'transport', price: 50, status: 'selected' })] });
    expect(summarize(t2).warnings.some((w) => /No transport chosen/.test(w))).toBe(false);
  });

  it('warns when no dates are chosen', () => {
    const t = trip({ chosenDateId: null });
    const s = summarize(t);
    expect(s.shape.nights).toBe(0);
    expect(s.warnings[0]).toMatch(/Choose travel dates/);
  });

  it('tracks spend without treating a missing target as a zero-dollar cap', () => {
    const s = summarize(trip({ budgetTotal: null }));
    expect(s.budget).toBeNull();
    expect(s.remaining).toBeNull();
    expect(s.contingency).toBe(0);
  });
});

describe('interest matching', () => {
  it('matches tags and names, not loose words in notes', () => {
    const c = cand({ name: 'Groceries + sodas', notes: 'Eat at local sodas', tags: ['Authentic food'] });
    expect(matchedInterests(c, ['Authentic food', 'Quiet / local life', 'Local markets'])).toEqual(['Authentic food']);
    expect(matchedInterests(cand({ name: 'Surf school', tags: ['Surfing'] }), ['Surfing', 'Beaches'])).toEqual(['Surfing']);
  });
});

describe('travel legs in the budget', () => {
  it('adds arrival, move and departure costs and warns about unpriced legs', () => {
    const t = trip({
      contingencyPct: 0,
      candidates: [
        cand({ category: 'lodging', name: 'A', base: 'Kanazawa', price: 100, basis: 'perNight', status: 'selected', day: 0, units: 4 }),
        cand({ category: 'lodging', name: 'B', base: 'Kamakura', price: 100, basis: 'perNight', status: 'selected', day: 4, units: 4 }),
      ],
      moves: { [moveKey('Kanazawa', 'Kamakura')]: { mode: 'Shinkansen', ridePerPerson: 95, localPerPerson: 5, mealPerPerson: 10, hours: 4.5, checkout: '10:00', checkin: '15:00', priceStatus: 'estimated', notes: '' } },
    });
    const s = summarize(t);
    expect(s.lines.find((l) => l.label === 'Move: Kanazawa → Kamakura')?.amount).toBe(440);
    expect(s.warnings.join(' ')).toMatch(/Arrive: airport → Kanazawa; Leave: Kamakura → airport/);
  });
});

describe('affordable nights', () => {
  it('uses the daily estimate before lodging is chosen', () => {
    // 9000 - 10% = 8100; airfare 4 x 900 = 3600; 4500 / 400 = 11 nights
    const a = affordableNights(trip({ dailyEstimate: 400 }), 900)!;
    expect(a).toMatchObject({ nights: 11, source: 'estimate' });
  });
  it('uses chosen lodging and daily items once chosen', () => {
    const t = trip({
      candidates: [
        cand({ category: 'lodging', price: 160, basis: 'perNight', status: 'selected' }),
        cand({ category: 'food', price: 30, basis: 'perPersonPerDay', status: 'selected' }),
        cand({ category: 'activities', price: 50, basis: 'perPerson', status: 'selected' }),
      ],
    });
    // per night 160 + 120 = 280; fixed 3600 + 200 + 120 (+ unpriced legs 0) = 3920; (8100-3920)/280 = 14.9
    const a = affordableNights(t, 900)!;
    expect(a).toMatchObject({ nights: 14, perNight: 280, source: 'choices' });
  });
  it('returns null with nothing to go on', () => {
    expect(affordableNights(trip(), 900)).toBeNull();
  });
});
