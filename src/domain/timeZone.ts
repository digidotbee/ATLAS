/**
 * Venture time zone (implementation plan D10).
 *
 * A Venture stores an IANA name such as "America/Los_Angeles". Dates, times and the
 * Opt in by deadline are saved as clock times (YYYY-MM-DD, HH:mm, YYYY-MM-DDTHH:mm) and
 * read in that zone. Ventures saved before D10 have no zone and use the device's.
 */

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isValidTimeZone(zone: string): boolean {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The device's IANA time zone, or UTC when the browser can't say. */
export function deviceTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

/** The zone a Venture's clock times are read in. */
export function ventureTimeZone(venture: { timeZone?: string }): string {
  return venture.timeZone && isValidTimeZone(venture.timeZone) ? venture.timeZone : deviceTimeZone();
}

/** Every zone the browser knows, sorted, always including `current`. */
export function timeZoneChoices(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  } catch {
    zones = [];
  }
  const all = new Set(zones);
  if (current) all.add(current);
  all.add(deviceTimeZone());
  return [...all].sort((a, b) => a.localeCompare(b));
}

function clockParts(instant: number, zone: string): Record<string, string> {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return Object.fromEntries(format.formatToParts(instant).map((p) => [p.type, p.value]));
}

/** Minutes the zone is ahead of UTC at an instant (negative west of Greenwich). */
export function offsetMinutes(instant: number, zone: string): number {
  const p = clockParts(instant, zone);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  return Math.round((asUtc - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

/** The clock time in `zone` at an instant, as a datetime-local value (YYYY-MM-DDTHH:mm). */
export function wallTimeAt(instant: number, zone: string): string {
  const p = clockParts(instant, zone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/**
 * The instant a clock time names in `zone`, or null for a malformed value.
 * A repeated time (clocks going back) resolves to its first occurrence; a time skipped
 * when clocks go forward resolves to a real instant within an hour of it.
 */
export function instantOf(wallTime: string, zone: string): number | null {
  const m = WALL_TIME.exec(wallTime);
  if (!m) return null;
  const asUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const first = asUtc - offsetMinutes(asUtc, zone) * 60_000;
  return asUtc - offsetMinutes(first, zone) * 60_000;
}

/** "GMT", "GMT+9", "GMT-3:30". */
export function gmtOffsetLabel(minutes: number): string {
  if (minutes === 0) return 'GMT';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `GMT${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

/**
 * The zone's short name at a clock time, such as "PDT" or "GMT+9", in the reader's locale.
 * Without a clock time it uses the current moment.
 */
export function zoneAbbreviation(zone: string, wallTime?: string, locale?: string, now = Date.now()): string {
  const instant = (wallTime ? instantOf(wallTime, zone) : null) ?? now;
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'short' })
      .formatToParts(instant)
      .find((p) => p.type === 'timeZoneName');
    if (part?.value) return part.value;
  } catch {
    // Fall through to the numeric offset.
  }
  return gmtOffsetLabel(offsetMinutes(instant, zone));
}

/** Option text for the time zone picker: "America/Los Angeles (GMT-8)". */
export function timeZoneOptionLabel(zone: string, now = Date.now()): string {
  return `${zone.replace(/_/g, ' ')} (${gmtOffsetLabel(offsetMinutes(now, zone))})`;
}

/**
 * " PDT" when a Planner-facing screen should name the zone because it differs from the
 * device's, otherwise "". Invite cards always name the zone; see zoneAbbreviation.
 */
export function plannerZoneSuffix(zone: string, wallTime?: string): string {
  return zone === deviceTimeZone() ? '' : ` ${zoneAbbreviation(zone, wallTime)}`;
}
