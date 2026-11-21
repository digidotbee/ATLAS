import { describe, expect, it } from 'vitest';
import { nightsBetween, summarize } from './budget';
import { createTrip } from './factory';
import { buildItinerary } from './itinerary';
import { migrateTrip } from './migrate';
import { parseAtlasData } from './validate';
import type { PlanningAssumptions, Trip } from './types';
import { applyFareOverride, evaluateWindow, generateWindows, lockWindow, nearlyIdentical, setWindowStatus } from './windows';

// Mock pricing fixtures — development only, not real research.
const FIXTURE: PlanningAssumptions = {
  airfarePerPersonByMonth: { '2027-05': 900, '2027-06': 1000, '2027-07': 1250 },
  baggageIncluded: true,
  arrivalOffsetDays: 1, // overnight flight lands the next day
  returnOffsetDays: 0,
  lodgingPerNight: 160,
  foodPerPersonPerDay: 30,
  transportPerDay: 40,
  activitiesPerPersonPerDay: 10,
  feesPct: 10,
  climateByMonth: {
    '05': { score: 4.5, summary: 'May: mild, mostly dry' },
    '06': { score: 2.5, summary: 'June: rainy season' },
    '07': { score: 2, summary: 'July: hot and humid' },
  },
  sources: [{ url: 'https://example.com/fixture', note: 'test fixture', checkedAt: '2026-11-14' }],
  researchedAt: '2026-11-14',
  origin: 'assistant',
};

function plannedTrip(overrides: Partial<Trip> = {}): Trip {
  const t = createTrip({
    name: 'Fixture trip',
    destination: 'Testland',
    region: '',
    currency: 'USD',
    budgetTotal: 9000,
    adults: 2,
    children: 2,
    childAges: '',
    flexibility: '',
    dateOptions: [],
  });
  return {
    ...t,
    availability: { earliestDeparture: '2027-05-21', latestReturn: '2027-07-30', preferredRanges: [], excludedRanges: [] },
    constraints: { departureAirport: 'LAS', minNights: null, preferredNights: null, maxNights: null },
    assumptions: FIXTURE,
    ...overrides,
  };
}

describe('flexible-date planning engine', () => {
  it('1. a 70-night availability window does not create a 70-night trip', () => {
    const t = plannedTrip();
    expect(nightsBetween('2027-05-21', '2027-07-30')).toBe(70);
    const r = generateWindows(t);
    expect(r.windows.length).toBeGreaterThan(0);
    for (const w of r.windows) expect(w.destinationNights).toBeLessThan(70);
    // No trip dates exist until a window is locked, so nothing is projected over the range.
    expect(t.chosenDateId).toBeNull();
    expect(summarize(t).shape.nights).toBe(0);
  });

  it('2. generates 3–5 distinct shorter windows', () => {
    const r = generateWindows(plannedTrip());
    expect(r.windows.length).toBeGreaterThanOrEqual(3);
    expect(r.windows.length).toBeLessThanOrEqual(5);
    for (let i = 0; i < r.windows.length; i++)
      for (let j = i + 1; j < r.windows.length; j++) expect(nearlyIdentical(r.windows[i], r.windows[j])).toBe(false);
    expect(r.windows.flatMap((w) => w.labels)).toEqual(expect.arrayContaining(['Best Overall Fit', 'Best Value', 'Longest Affordable Venture', 'Best Weather Balance']));
  });

  it('3. every window satisfies availability and exclusions', () => {
    const t = plannedTrip({
      availability: {
        earliestDeparture: '2027-05-21',
        latestReturn: '2027-07-30',
        preferredRanges: [],
        excludedRanges: [{ start: '2027-06-10', end: '2027-06-20' }],
      },
    });
    for (const w of generateWindows(t).windows) {
      expect(w.departureDate >= '2027-05-21').toBe(true);
      expect(w.returnDate <= '2027-07-30').toBe(true);
      expect(w.returnDate < '2027-06-10' || w.departureDate > '2027-06-20').toBe(true);
    }
  });

  it('4. handles overnight flights: arrival is the next day and nights count from arrival', () => {
    const e = evaluateWindow(plannedTrip(), '2027-05-21', 10)!;
    expect(e.arrivalDate).toBe('2027-05-22');
    expect(e.destinationDepartureDate).toBe('2027-06-01');
    expect(e.returnDate).toBe('2027-06-01');
    // A window that would get home after the latest return is rejected.
    expect(evaluateWindow(plannedTrip(), '2027-07-20', 10)).toBeNull();
  });

  it('5 & 6. costs change with duration; lodging and daily costs use trip nights only', () => {
    const t = plannedTrip();
    const ten = evaluateWindow(t, '2027-05-21', 10)!;
    const fourteen = evaluateWindow(t, '2027-05-21', 14)!;
    expect(ten.lodgingTotal).toBe(1600); // 10 nights × 160, not 70
    expect(ten.foodTotal).toBe(30 * 4 * 11); // 11 days at the destination
    expect(ten.groundTransportTotal).toBe(40 * 11);
    expect(ten.feesTotal).toBe(160);
    expect(fourteen.projectedTotal).toBeGreaterThan(ten.projectedTotal);
    expect(fourteen.lodgingTotal - ten.lodgingTotal).toBe(4 * 160);
  });

  it('7. airfare is multiplied by the number of travelers', () => {
    const e = evaluateWindow(plannedTrip(), '2027-05-21', 10)!;
    expect(e.airfareTotal).toBe(900 * 4);
    const three = plannedTrip({ travelers: { adults: 2, children: 1, childAges: '' } });
    expect(evaluateWindow(three, '2027-05-21', 10)!.airfareTotal).toBe(2700);
  });

  it('8. respects the budget, and explains a shortfall without changing settings', () => {
    for (const w of generateWindows(plannedTrip()).windows) {
      expect(w.projectedTotal).toBeLessThanOrEqual(9000);
      expect(w.remainingBudget).toBeGreaterThanOrEqual(0);
    }
    const tight = plannedTrip({ budgetTotal: 3000, constraints: { departureAirport: 'LAS', minNights: 7, preferredNights: null, maxNights: null } });
    const r = generateWindows(tight);
    expect(r.windows).toEqual([]);
    expect(r.shortfall!.amount).toBeGreaterThan(0);
    expect(tight.budgetTotal).toBe(3000);
    expect(tight.constraints!.minNights).toBe(7);
  });

  it('generates windows without applying a budget cap when no target is set', () => {
    const t = plannedTrip({ budgetTotal: null });
    const result = generateWindows(t);
    expect(result.windows.length).toBeGreaterThan(0);
    expect(result.shortfall).toBeNull();
    expect(result.windows.every((window) => window.remainingBudget === null)).toBe(true);
    expect(evaluateWindow(t, '2027-05-21', 10)?.parts.cost).toBeNull();
  });

  it('9. rejected windows stay rejected and are not re-proposed', () => {
    const t = plannedTrip();
    const first = generateWindows(t);
    const target = first.windows[0];
    const afterReject = setWindowStatus({ ...t, windows: first.windows }, target.id, 'rejected', 'too hot');
    const again = generateWindows(afterReject);
    const kept = again.windows.find((w) => w.id === target.id)!;
    expect(kept.status).toBe('rejected');
    expect(kept.feedback).toBe('too hot');
    const proposed = again.windows.filter((w) => w.status === 'proposed');
    for (const w of proposed) expect(nearlyIdentical(w, target)).toBe(false);
  });

  it('10. estimated prices are never labeled verified', () => {
    const t = plannedTrip();
    for (const w of generateWindows(t).windows) expect(w.priceStatus).toBe('estimated');
    // Even a user-checked fare leaves the window estimated (lodging/food are still estimates)…
    const e = evaluateWindow(t, '2027-05-21', 10, { fareOverridePerPerson: 850, fareOverrideVerified: true, fareOverrideSource: 'airline site' })!;
    expect(e.priceStatus).toBe('estimated');
    // …and the locked trip's airfare is verified only because the family checked it themselves.
    const unverified = generateWindows(t).windows[0];
    const locked = lockWindow({ ...t, windows: [unverified] }, unverified.id);
    expect(locked.dateOptions.find((d) => d.id === locked.chosenDateId)!.flightStatus).toBe('estimated');
  });

  it('11. previously saved trips stay accessible and a 70-night range becomes availability', () => {
    const old = createTrip({
      name: 'Costa Rica',
      destination: 'Costa Rica',
      region: '',
      currency: 'USD',
      budgetTotal: 9000,
      adults: 2,
      children: 2,
      childAges: '',
      flexibility: '',
      dateOptions: [{ label: 'Summer', start: '2027-05-21', end: '2027-07-30', flightPerPerson: 500, flightStatus: 'estimated', notes: '' }],
    });
    expect(old.chosenDateId).not.toBeNull(); // the old bug: the range was auto-chosen
    const data = parseAtlasData(
      { schemaVersion: 1, updatedAt: 'x', profile: { interests: [] }, trips: [old] },
      'test',
    );
    const t = data.trips[0];
    expect(t.availability).toMatchObject({ earliestDeparture: '2027-05-21', latestReturn: '2027-07-30' });
    expect(t.chosenDateId).toBeNull();
    expect(t.dateOptions).toHaveLength(1); // original data kept…
    expect(t.dateOptions[0].legacyAvailability).toBe(true); // …but marked, not used for costs
    expect(t.budgetTotal).toBe(9000);
    expect(summarize(t).shape.nights).toBe(0);
    expect(migrateTrip(t)).toBe(t); // idempotent
    // A normal short trip is left alone.
    const short = { ...old, dateOptions: [{ ...old.dateOptions[0], end: '2027-05-31' }] };
    expect(migrateTrip(short)).toBe(short);
  });

  it('12. a locked window flows into the itinerary', () => {
    const t = plannedTrip();
    const r = generateWindows(t);
    const w = r.windows[0];
    const locked = lockWindow({ ...t, windows: r.windows }, w.id);
    const chosen = locked.dateOptions.find((d) => d.id === locked.chosenDateId)!;
    expect(chosen.start).toBe(w.arrivalDate);
    expect(chosen.end).toBe(w.destinationDepartureDate);
    expect(chosen.flightPerPerson).toBe(w.airfareTotal / 4);
    const it = buildItinerary(locked)!;
    expect(it.days).toHaveLength(w.destinationNights + 1);
    expect(summarize(locked).byCategory.flights).toBe(w.airfareTotal);
    // Unlocking removes those trip dates again.
    const unlocked = setWindowStatus(locked, w.id, 'kept');
    expect(unlocked.chosenDateId).toBeNull();
  });

  it('13. an exact-date fare re-costs the window without corrupting its reasons', () => {
    const t = plannedTrip();
    const w = { ...generateWindows(t).windows[0], status: 'kept' as const, feedback: 'nice', labels: ['Best Value'] };
    const before = { ...t, windows: [w] };
    const after = applyFareOverride(before, w.id, { fareOverridePerPerson: 700, fareOverrideVerified: true, fareOverrideSource: 'airline site' });
    const n = after.windows![0];
    expect(n.id).toBe(w.id);
    expect(n.status).toBe('kept');
    expect(n.feedback).toBe('nice');
    expect(n.labels).toEqual(['Best Value']);
    expect(n.airfareTotal).toBe(2800);
    expect(n.fareOverridePerPerson).toBe(700);
    expect(n.fareOverrideVerified).toBe(true);
    expect(n.remainingBudget).toBe(9000 - n.projectedTotal);
    expect(n.remainingBudget).toBeGreaterThan(w.remainingBudget!);
    // Exactly one airfare line, and the budget line is still there with the new amount.
    expect(n.reasons.filter((r) => r.startsWith('Airfare'))).toEqual(['Airfare 700/person for these exact dates (you checked it)']);
    expect(n.reasons).toContain(`Fits the budget with ${Math.round(n.remainingBudget!)} to spare`);
    expect(n.score).toBeGreaterThan(0);
  });

  it('14. an exact-date fare on the locked window updates the trip dates in use', () => {
    const t = plannedTrip();
    const r = generateWindows(t);
    const w = r.windows[0];
    const locked = lockWindow({ ...t, windows: r.windows }, w.id);
    const chosenId = locked.chosenDateId;
    const after = applyFareOverride(locked, w.id, { fareOverridePerPerson: 650, fareOverrideVerified: true, fareOverrideSource: '' });
    expect(after.chosenDateId).toBe(chosenId);
    const chosen = after.dateOptions.find((d) => d.id === after.chosenDateId)!;
    expect(chosen.flightPerPerson).toBe(650);
    expect(chosen.flightStatus).toBe('verified');
    expect(after.windows!.find((x) => x.id === w.id)!.status).toBe('locked');
    expect(summarize(after).byCategory.flights).toBe(2600);
  });

  it('15. an exact-date fare is refused for missing or rejected windows', () => {
    const t = plannedTrip();
    const w = generateWindows(t).windows[0];
    const o = { fareOverridePerPerson: 700, fareOverrideVerified: false, fareOverrideSource: '' };
    expect(() => applyFareOverride({ ...t, windows: [w] }, 'nope', o)).toThrow('That window no longer exists.');
    expect(() => applyFareOverride(setWindowStatus({ ...t, windows: [w] }, w.id, 'rejected'), w.id, o)).toThrow('Restore this window');
  });
});
