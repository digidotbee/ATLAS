import { describe, expect, it } from 'vitest';
import { createTrip, defaultProfile, type NewTripInput } from './factory';
import { SCHEMA_VERSION } from './types';
import { parseAtlasData } from './validate';
import {
  deviceTimeZone,
  gmtOffsetLabel,
  instantOf,
  isValidTimeZone,
  plannerZoneSuffix,
  timeZoneChoices,
  timeZoneOptionLabel,
  ventureTimeZone,
  wallTimeAt,
  zoneAbbreviation,
} from './timeZone';

describe('D10 Venture time zone', () => {
  it('D10 defaults to a valid device zone', () => {
    expect(isValidTimeZone(deviceTimeZone())).toBe(true);
  });

  it('D10 accepts IANA names and rejects anything else', () => {
    expect(isValidTimeZone('America/Los_Angeles')).toBe(true);
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('D10 reads Ventures saved before D10 in the device zone', () => {
    expect(ventureTimeZone({})).toBe(deviceTimeZone());
    expect(ventureTimeZone({ timeZone: 'Not/AZone' })).toBe(deviceTimeZone());
    expect(ventureTimeZone({ timeZone: 'Asia/Tokyo' })).toBe('Asia/Tokyo');
  });

  it('D10 lists every zone once, sorted, including the current and device zones', () => {
    const zones = timeZoneChoices('Asia/Tokyo');
    expect(zones).toContain('Asia/Tokyo');
    expect(zones).toContain(deviceTimeZone());
    expect(new Set(zones).size).toBe(zones.length);
    expect([...zones].sort((a, b) => a.localeCompare(b))).toEqual(zones);
  });

  it('D10 converts between an instant and clock time in the Venture zone', () => {
    const instant = Date.UTC(2026, 6, 2, 1, 0); // 2026-07-02 01:00 UTC
    expect(wallTimeAt(instant, 'America/Los_Angeles')).toBe('2026-07-01T18:00');
    expect(wallTimeAt(instant, 'Asia/Tokyo')).toBe('2026-07-02T10:00');
    expect(wallTimeAt(instant, 'Asia/Kolkata')).toBe('2026-07-02T06:30');
    expect(instantOf('2026-07-01T18:00', 'America/Los_Angeles')).toBe(instant);
    expect(instantOf('2026-07-02T10:00', 'Asia/Tokyo')).toBe(instant);
    expect(instantOf('2026-07-01', 'Asia/Tokyo')).toBeNull();
  });

  it('D10 resolves daylight-saving edges', () => {
    // New York falls back at 2:00 a.m. on Nov 7, 2027: 1:30 a.m. happens twice; take the first (EDT).
    expect(instantOf('2027-11-07T01:30', 'America/New_York')).toBe(Date.UTC(2027, 10, 7, 5, 30));
    // It springs forward on Mar 14, 2027: 2:30 a.m. never happens; land within an hour of it.
    const skipped = instantOf('2027-03-14T02:30', 'America/New_York')!;
    expect(Math.abs(skipped - Date.UTC(2027, 2, 14, 7, 0))).toBeLessThanOrEqual(30 * 60_000);
    expect(wallTimeAt(Date.UTC(2027, 2, 13, 12, 0) + 24 * 3_600_000, 'America/New_York')).toBe('2027-03-14T08:00');
  });

  it('D10 names the zone at the given clock time', () => {
    expect(zoneAbbreviation('America/Los_Angeles', '2026-07-01T18:00', 'en-US')).toBe('PDT');
    expect(zoneAbbreviation('America/Los_Angeles', '2026-01-15T18:00', 'en-US')).toBe('PST');
    expect(zoneAbbreviation('Asia/Tokyo', '2026-07-01T18:00', 'en-US')).toBe('GMT+9');
  });

  it('D10 labels picker options with the current offset', () => {
    const january = Date.UTC(2026, 0, 15, 12);
    expect(timeZoneOptionLabel('America/Los_Angeles', january)).toBe('America/Los Angeles (GMT-8)');
    expect(timeZoneOptionLabel('Asia/Kolkata', january)).toBe('Asia/Kolkata (GMT+5:30)');
    expect(gmtOffsetLabel(0)).toBe('GMT');
    expect(gmtOffsetLabel(-210)).toBe('GMT-3:30');
  });

  it('D10 names the zone on Planner screens only when it differs from the device', () => {
    expect(plannerZoneSuffix(deviceTimeZone(), '2026-07-01T18:00')).toBe('');
    const other = deviceTimeZone() === 'Asia/Tokyo' ? 'America/Los_Angeles' : 'Asia/Tokyo';
    expect(plannerZoneSuffix(other, '2026-07-01T18:00')).not.toBe('');
  });
});

describe('D10 Venture time zone storage', () => {
  const input = (timeZone?: string): NewTripInput => ({
    name: '',
    destination: 'Tokyo',
    region: '',
    ...(timeZone ? { timeZone } : {}),
    currency: 'USD',
    budgetTotal: null,
    adults: 2,
    children: 0,
    flexibility: '',
    dateOptions: [],
  });

  it('D10 saves the chosen zone on a new Venture and defaults to the device zone', () => {
    expect(createTrip(input('Asia/Tokyo')).timeZone).toBe('Asia/Tokyo');
    expect(createTrip(input()).timeZone).toBe(deviceTimeZone());
  });

  it('D10 loads Ventures saved before D10 unchanged and rejects a zone that is not text', () => {
    const { timeZone: _dropped, ...legacy } = createTrip(input('Asia/Tokyo'));
    const data = { schemaVersion: SCHEMA_VERSION, updatedAt: '2026-11-01T10:00:00.000Z', profile: defaultProfile(), trips: [legacy] };
    const loaded = parseAtlasData(data, 'test').trips[0];
    expect(loaded.timeZone).toBeUndefined();
    expect(ventureTimeZone(loaded)).toBe(deviceTimeZone());
    expect(() => parseAtlasData({ ...data, trips: [{ ...legacy, timeZone: 9 }] }, 'test')).toThrow(/time zone/);
  });
});
