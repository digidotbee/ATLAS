import { describe, expect, it } from 'vitest';
import { blankCandidate, createTrip } from './factory';
import { buildItinerary } from './itinerary';
import type { Candidate } from './types';

const base = createTrip({
  name: 'T',
  destination: 'D',
  region: '',
  currency: 'USD',
  budgetTotal: 5000,
  adults: 2,
  children: 2,
  childAges: '',
  flexibility: '',
  dateOptions: [{ label: 'A', start: '2027-03-13', end: '2027-03-17', flightPerPerson: null, flightStatus: 'estimated', notes: '' }],
});
const c = (p: Partial<Candidate>): Candidate => ({ ...blankCandidate(p.category ?? 'activities'), status: 'selected', ...p });

describe('itinerary', () => {
  it('lays out days, a single lodging covers every night, departure day has none', () => {
    const it = buildItinerary({ ...base, candidates: [c({ category: 'lodging', name: 'Lodge' }), c({ name: 'Surf', day: 1 }), c({ name: 'Market' })] })!;
    expect(it.days.map((d) => d.date)).toEqual(['2027-03-13', '2027-03-14', '2027-03-15', '2027-03-16', '2027-03-17']);
    expect(it.days.slice(0, 4).every((d) => d.lodging?.name === 'Lodge')).toBe(true);
    expect(it.days[4].lodging).toBeNull();
    expect(it.days[1].items.map((x) => x.name)).toEqual(['Surf']);
    expect(it.unscheduled.map((x) => x.name)).toEqual(['Market']);
    expect(it.nightsWithoutLodging).toEqual([]);
  });

  it('flags gaps and overlaps across two bases', () => {
    const it = buildItinerary({
      ...base,
      candidates: [c({ category: 'lodging', name: 'City', day: 0, units: 2 }), c({ category: 'lodging', name: 'Beach', day: 1, units: 2 })],
    })!;
    expect(it.doubleBooked).toEqual([1]);
    expect(it.nightsWithoutLodging).toEqual([3]);
  });

  it('returns null without chosen dates', () => {
    expect(buildItinerary({ ...base, chosenDateId: null })).toBeNull();
  });
});

describe('bases', () => {
  it('flags a day trip planned from a different base than where you sleep', () => {
    const it = buildItinerary({
      ...base,
      candidates: [
        c({ category: 'lodging', name: 'Kanazawa machiya', base: 'Kanazawa', day: 0, units: 2 }),
        c({ category: 'lodging', name: 'Kamakura house', base: 'Kamakura', day: 2, units: 2 }),
        c({ name: 'Nara day trip', base: 'Kyoto', day: 1 }),
        c({ name: 'Surf lesson', base: 'kamakura', day: 3 }),
        c({ name: 'Old item with no base', day: 0 }),
      ],
    })!;
    expect(it.baseMismatches.map((m) => [m.day, m.item.name, m.stayBase])).toEqual([[1, 'Nara day trip', 'Kanazawa']]);
  });
});
