import { describe, expect, it } from 'vitest';
import { createTrip, defaultProfile } from './factory';
import { migrateData } from './migrate';
import { parseAtlasData } from './validate';

// A Venture saved before children's ages and the kids question were removed.
function storedData() {
  const t = createTrip({
    name: 'Cabin weekend',
    destination: 'Big Bear, California',
    region: '',
    currency: 'USD',
    budgetTotal: null,
    adults: 2,
    children: 2,
    flexibility: '',
    dateOptions: [{ label: 'Weekend', start: '2027-01-15', end: '2027-01-17', flightPerPerson: null, flightStatus: 'estimated', notes: '' }],
  });
  const old = {
    ...t,
    updatedAt: '2026-11-01T10:00:00.000Z',
    travelers: { ...t.travelers, childAges: '7, 10' },
    answers: { purpose: 'A slow snowy weekend', kids: 'Maya is 7 and cannot swim yet' },
  };
  return { schemaVersion: 1, updatedAt: '2026-11-01T10:00:00.000Z', profile: defaultProfile(), trips: [old] };
}

describe('Loading a Venture saved with children’s details', () => {
  it('drops the children’s ages and the old kids answer and keeps everything else', () => {
    const t = parseAtlasData(storedData(), 'test').trips[0];
    expect(t.travelers).toEqual({ adults: 2, children: 2 });
    expect(t.answers).toEqual({ purpose: 'A slow snowy weekend' });
    expect(JSON.stringify(t)).not.toContain('7, 10');
    expect(JSON.stringify(t)).not.toContain('Maya');
  });

  it('is idempotent and leaves updatedAt alone, so it never causes a sync conflict', () => {
    const once = parseAtlasData(storedData(), 'test');
    expect(once.trips[0].updatedAt).toBe('2026-11-01T10:00:00.000Z');
    expect(migrateData(once)).toEqual(once);
  });
});
