// Stage A: discover vacation dates and length inside the availability window.
// Deterministic and offline: every number comes from the trip's planning assumptions.
import { addDays, nightsBetween, round2, travelerCount } from './budget';
import { newId } from './factory';
import type {
  CandidateTravelWindow,
  DateOption,
  DateRange,
  PlanningAssumptions,
  ScoringWeights,
  Trip,
} from './types';

export const DEFAULT_WEIGHTS: ScoringWeights = { cost: 25, value: 20, duration: 20, weather: 25, preferences: 10 };

/** Without a preferred length, the duration score rises until this many nights, then levels off. */
export const FULL_VACATION_NIGHTS = 14;
/** Fallback trip lengths to try when the family hasn't given a range. */
export const DEFAULT_DURATIONS = [5, 7, 10, 12, 14, 18, 21, 28];
/** Coarse departure sampling (days) before refining around promising windows. */
const COARSE_STEP = 7;
const MAX_RESULTS = 5;

export function blankAssumptions(): PlanningAssumptions {
  return {
    airfarePerPersonByMonth: {},
    baggageIncluded: true,
    arrivalOffsetDays: 0,
    returnOffsetDays: 0,
    lodgingPerNight: null,
    foodPerPersonPerDay: null,
    transportPerDay: null,
    activitiesPerPersonPerDay: null,
    feesPct: 0,
    climateByMonth: {},
    sources: [],
    researchedAt: null,
    origin: 'manual',
  };
}

/** Months ("YYYY-MM") a departure could fall in. */
export function departureMonths(earliest: string, latest: string): string[] {
  const out: string[] = [];
  if (nightsBetween(earliest, latest) === null) return out;
  let y = Number(earliest.slice(0, 4));
  let m = Number(earliest.slice(5, 7));
  const endKey = latest.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push(key);
    if (key >= endKey || out.length > 36) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** What is still needed before windows can be generated. Empty list = ready. */
export function missingInputs(trip: Trip): string[] {
  const miss: string[] = [];
  const av = trip.availability;
  if (!av || nightsBetween(av.earliestDeparture, av.latestReturn) === null) {
    miss.push('Earliest departure and latest return (latest return must be after earliest departure)');
    return miss;
  }
  const a = trip.assumptions;
  if (!a) return ['Planning assumptions (airfare, lodging, food, transport, activities)'];
  if (a.lodgingPerNight === null) miss.push('Lodging per night');
  if (a.foodPerPersonPerDay === null) miss.push('Food per person per day');
  if (a.transportPerDay === null) miss.push('Getting around per day');
  if (a.activitiesPerPersonPerDay === null) miss.push('Activities per person per day');
  const months = departureMonths(av.earliestDeparture, av.latestReturn);
  const noFare = months.filter((mo) => !(a.airfarePerPersonByMonth[mo] > 0));
  if (noFare.length === months.length) miss.push(`Airfare per person for at least one month (${months.join(', ')})`);
  if (travelerCount(trip) === 0) miss.push('Travelers');
  return miss;
}

function overlaps(a: DateRange, b: DateRange): boolean {
  return a.start <= b.end && b.start <= a.end;
}

function overlapDays(a: DateRange, b: DateRange): number {
  const s = a.start > b.start ? a.start : b.start;
  const e = a.end < b.end ? a.end : b.end;
  const n = nightsBetween(s, e);
  return n === null ? 0 : n + 1;
}

export function windowKey(departureDate: string, nights: number): string {
  return `${departureDate}|${nights}`;
}

/** Two windows are "nearly identical" when they start within 10 days and differ by under 3 nights. */
export function nearlyIdentical(a: { departureDate: string; destinationNights: number }, b: { departureDate: string; destinationNights: number }): boolean {
  const gap = Math.abs(nightsBetween(a.departureDate, b.departureDate) ?? nightsBetween(b.departureDate, a.departureDate) ?? 0);
  return gap < 10 && Math.abs(a.destinationNights - b.destinationNights) < 3;
}

interface Evaluated extends Omit<CandidateTravelWindow, 'id' | 'status' | 'feedback' | 'labels' | 'score'> {
  parts: { cost: number | null; value: number; duration: number; weather: number | null; preferences: number | null };
  fareMonth: string;
  farePerPerson: number;
}

/**
 * Cost of one specific window. Returns null when it falls outside availability, hits an excluded
 * range, or there is no airfare estimate for its departure month.
 */
export function evaluateWindow(
  trip: Trip,
  departureDate: string,
  nights: number,
  override?: Pick<CandidateTravelWindow, 'fareOverridePerPerson' | 'fareOverrideVerified' | 'fareOverrideSource'>,
): Evaluated | null {
  const av = trip.availability;
  const a = trip.assumptions;
  if (!av || !a || nights < 1) return null;
  const arrivalDate = addDays(departureDate, a.arrivalOffsetDays);
  const destinationDepartureDate = addDays(arrivalDate, nights);
  const returnDate = addDays(destinationDepartureDate, a.returnOffsetDays);
  if (departureDate < av.earliestDeparture || returnDate > av.latestReturn) return null;
  const whole = { start: departureDate, end: returnDate };
  if (av.excludedRanges.some((r) => overlaps(whole, r))) return null;

  const fareMonth = departureDate.slice(0, 7);
  const monthFare = a.airfarePerPersonByMonth[fareMonth];
  const farePerPerson = override?.fareOverridePerPerson ?? monthFare;
  if (!(farePerPerson > 0)) return null;

  const people = travelerCount(trip);
  const days = nights + 1; // arrival day through departure day
  const airfareTotal = round2(farePerPerson * people);
  const lodgingTotal = round2((a.lodgingPerNight ?? 0) * nights);
  const groundTransportTotal = round2((a.transportPerDay ?? 0) * days);
  const foodTotal = round2((a.foodPerPersonPerDay ?? 0) * people * days);
  const activitiesTotal = round2((a.activitiesPerPersonPerDay ?? 0) * people * days);
  const feesTotal = round2((lodgingTotal * a.feesPct) / 100);
  const contingency = trip.budgetTotal === null ? 0 : round2((trip.budgetTotal * trip.contingencyPct) / 100);
  const projectedTotal = round2(airfareTotal + lodgingTotal + groundTransportTotal + foodTotal + activitiesTotal + feesTotal + contingency);
  const remainingBudget = trip.budgetTotal === null ? null : round2(trip.budgetTotal - projectedTotal);

  // Weather: day-weighted average of monthly climate scores across the stay.
  let wSum = 0;
  let wDays = 0;
  for (let i = 0; i < days; i++) {
    const mm = addDays(arrivalDate, i).slice(5, 7);
    const c = a.climateByMonth[mm];
    if (c) {
      wSum += c.score;
      wDays += 1;
    }
  }
  const weatherScore = wDays > 0 ? round2(wSum / wDays) : null;
  const months = [...new Set([arrivalDate.slice(5, 7), destinationDepartureDate.slice(5, 7)])];
  const weatherAssessment =
    weatherScore === null
      ? 'No climate data yet for these months.'
      : `Seasonal average (not a forecast): ${months
          .map((mm) => a.climateByMonth[mm]?.summary)
          .filter(Boolean)
          .join(' / ')}`;

  const c = trip.constraints;
  const duration = c?.preferredNights
    ? Math.max(0, 1 - Math.abs(nights - c.preferredNights) / c.preferredNights)
    : Math.min(1, nights / FULL_VACATION_NIGHTS);
  const stay = { start: arrivalDate, end: destinationDepartureDate };
  const preferences = av.preferredRanges.length
    ? Math.min(1, av.preferredRanges.reduce((s, r) => s + overlapDays(stay, r), 0) / days)
    : null;

  const fareVerified = !!(override?.fareOverridePerPerson && override.fareOverrideVerified);
  const sourced = a.origin === 'assistant' && a.sources.length > 0;
  const confidence: CandidateTravelWindow['confidence'] = fareVerified && sourced ? 'high' : sourced || fareVerified ? 'medium' : 'low';

  return {
    departureDate,
    arrivalDate,
    destinationDepartureDate,
    returnDate,
    destinationNights: nights,
    airfareTotal,
    lodgingTotal,
    groundTransportTotal,
    foodTotal,
    activitiesTotal,
    feesTotal,
    contingency,
    projectedTotal,
    remainingBudget,
    weatherScore,
    weatherAssessment,
    confidence,
    reasons: [],
    priceSources: a.sources,
    // Lodging, food and daily costs are always planning estimates, so the window as a whole is too.
    priceStatus: 'estimated',
    fareOverridePerPerson: override?.fareOverridePerPerson ?? null,
    fareOverrideVerified: override?.fareOverrideVerified ?? false,
    fareOverrideSource: override?.fareOverrideSource ?? '',
    parts: {
      cost: trip.budgetTotal === null ? null : Math.max(0, remainingBudget ?? 0) / trip.budgetTotal,
      value: 0,
      duration,
      weather: weatherScore === null ? null : weatherScore / 5,
      preferences,
    },
    fareMonth,
    farePerPerson,
  };
}

function scoreAll(list: Evaluated[], w: ScoringWeights): (Evaluated & { score: number })[] {
  const perNight = list.map((e) => e.projectedTotal / e.destinationNights);
  const lo = Math.min(...perNight);
  const hi = Math.max(...perNight);
  return list.map((e, i) => {
    const value = hi === lo ? 1 : (hi - perNight[i]) / (hi - lo);
    const parts = { ...e.parts, value };
    let num = 0;
    let den = 0;
    for (const k of Object.keys(w) as (keyof ScoringWeights)[]) {
      const v = parts[k];
      if (v === null || w[k] <= 0) continue;
      num += w[k] * v;
      den += w[k];
    }
    return { ...e, parts, score: den ? round2((num / den) * 100) : 0 };
  });
}

export function durationsToTry(trip: Trip): number[] {
  const av = trip.availability!;
  const a = trip.assumptions!;
  const span = (nightsBetween(av.earliestDeparture, av.latestReturn) ?? 0) - a.arrivalOffsetDays - a.returnOffsetDays;
  const c = trip.constraints;
  const min = Math.max(1, c?.minNights ?? 1);
  const max = Math.min(span, c?.maxNights ?? span);
  if (max < min) return [];
  let set: number[];
  if (c?.minNights || c?.maxNights) {
    const step = Math.max(1, Math.round((max - min) / 6));
    set = [];
    for (let n = min; n <= max; n += step) set.push(n);
    set.push(max);
  } else {
    set = DEFAULT_DURATIONS.filter((n) => n >= min && n <= max);
  }
  if (c?.preferredNights && c.preferredNights >= min && c.preferredNights <= max) set.push(c.preferredNights);
  return [...new Set(set)].sort((x, y) => x - y);
}

export interface GenerateResult {
  windows: CandidateTravelWindow[];
  /** Set when nothing fits: the shortfall and suggested adjustments (constraints are never changed). */
  shortfall: { amount: number; cheapest: CandidateTravelWindow; suggestions: string[] } | null;
  evaluatedCount: number;
  missing: string[];
}

/**
 * Generates 3–5 distinct, affordable windows. Coarse weekly sampling of departures across every
 * candidate length, then refinement (±3 days, ±2 nights) around the most promising ones.
 * Kept, locked and rejected windows are preserved; rejected ones (and near-copies) are never re-proposed.
 */
export function generateWindows(trip: Trip): GenerateResult {
  const missing = missingInputs(trip);
  const previous = trip.windows ?? [];
  if (missing.length) return { windows: previous, shortfall: null, evaluatedCount: 0, missing };
  const av = trip.availability!;
  const weights = trip.weights ?? DEFAULT_WEIGHTS;
  const rejected = previous.filter((w) => w.status === 'rejected');
  const pinned = previous.filter((w) => w.status === 'kept' || w.status === 'locked');

  const seen = new Map<string, Evaluated>();
  const tryOne = (dep: string, n: number) => {
    const key = windowKey(dep, n);
    if (seen.has(key)) return;
    const e = evaluateWindow(trip, dep, n);
    if (e) seen.set(key, e);
  };
  const durations = durationsToTry(trip);
  const span = nightsBetween(av.earliestDeparture, av.latestReturn) ?? 0;
  for (const n of durations) {
    for (let d = 0; d <= span; d += COARSE_STEP) tryOne(addDays(av.earliestDeparture, d), n);
    // Always include the latest possible departure for this length.
    const a = trip.assumptions!;
    const lastDep = addDays(av.latestReturn, -(n + a.arrivalOffsetDays + a.returnOffsetDays));
    if (lastDep >= av.earliestDeparture) tryOne(lastDep, n);
  }
  const notRejected = (e: { departureDate: string; destinationNights: number }) => !rejected.some((r) => nearlyIdentical(r, e));

  let affordable = [...seen.values()].filter((e) => (e.remainingBudget === null || e.remainingBudget >= 0) && notRejected(e));
  // Refine around the best few coarse results.
  const coarseTop = scoreAll(affordable, weights)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
  const c = trip.constraints;
  for (const t of coarseTop) {
    for (let dd = -3; dd <= 3; dd++) {
      for (let dn = -2; dn <= 2; dn++) {
        const n = t.destinationNights + dn;
        if (n < Math.max(1, c?.minNights ?? 1) || (c?.maxNights && n > c.maxNights)) continue;
        tryOne(addDays(t.departureDate, dd), n);
      }
    }
  }
  const evaluatedCount = seen.size;
  affordable = [...seen.values()].filter((e) => (e.remainingBudget === null || e.remainingBudget >= 0) && notRejected(e));

  if (affordable.length === 0) {
    const all = [...seen.values()].filter(notRejected);
    if (all.length === 0) {
      return {
        windows: previous,
        shortfall: null,
        evaluatedCount,
        missing: ['No window fits inside the availability range with the current length limits and airfare months.'],
      };
    }
    const cheapest = all.reduce((x, y) => (y.projectedTotal < x.projectedTotal ? y : x));
    const amount = trip.budgetTotal === null ? 0 : round2(cheapest.projectedTotal - trip.budgetTotal);
    const cw = toWindow(cheapest, 0, [], 'proposed', '');
    return {
      windows: previous,
      evaluatedCount,
      missing: [],
      shortfall: {
        amount,
        cheapest: cw,
        suggestions: [
          `The cheapest option found (${cheapest.destinationNights} nights from ${cheapest.departureDate}) is over budget by ${Math.ceil(amount)}.`,
          'Consider a shorter minimum length, a lower lodging estimate, a smaller cushion, or a larger budget.',
          'ATLAS has not changed any of your settings.',
        ],
      },
    };
  }

  const scored = scoreAll(affordable, weights).sort((x, y) => y.score - x.score);
  const label = new Map<string, string[]>();
  const tag = (e: Evaluated, l: string) => {
    const k = windowKey(e.departureDate, e.destinationNights);
    label.set(k, [...(label.get(k) ?? []), l]);
  };
  const byPerNight = [...scored].sort((x, y) => x.projectedTotal / x.destinationNights - y.projectedTotal / y.destinationNights)[0];
  const withWeather = scored.filter((e) => e.parts.weather !== null);
  const bestWeather = withWeather.length
    ? [...withWeather].sort((x, y) => 0.6 * y.parts.weather! + 0.4 * y.parts.value - (0.6 * x.parts.weather! + 0.4 * x.parts.value))[0]
    : null;
  const longest = [...scored].sort((x, y) => y.destinationNights - x.destinationNights || y.score - x.score)[0];
  tag(scored[0], 'Best Overall Fit');
  tag(byPerNight, 'Best Value');
  if (bestWeather) tag(bestWeather, 'Best Weather Balance');
  tag(longest, 'Longest Affordable Venture');

  // Labelled winners first, then the highest scores, skipping near-duplicates and pinned windows.
  const picked: (Evaluated & { score: number })[] = [];
  const add = (e: Evaluated & { score: number }) => {
    if (picked.length >= MAX_RESULTS) return;
    if (picked.some((p) => nearlyIdentical(p, e)) || pinned.some((p) => nearlyIdentical(p, e))) return;
    picked.push(e);
  };
  for (const e of scored) if (label.has(windowKey(e.departureDate, e.destinationNights))) add(e);
  for (const e of scored) add(e);

  const proposed = picked.map((e) => toWindow(e, e.score, label.get(windowKey(e.departureDate, e.destinationNights)) ?? [], 'proposed', ''));
  // Re-cost pinned windows with current assumptions, keeping their status and feedback.
  const refreshed = pinned.map((p) => {
    const e = evaluateWindow(trip, p.departureDate, p.destinationNights, p);
    return e ? { ...toWindow(e, scoreAll([e], weights)[0].score, p.labels, p.status, p.feedback), id: p.id } : p;
  });
  return { windows: [...refreshed, ...proposed, ...rejected], shortfall: null, evaluatedCount, missing: [] };
}

function toWindow(e: Evaluated, score: number, labels: string[], status: CandidateTravelWindow['status'], feedback: string): CandidateTravelWindow {
  const { parts, fareMonth, farePerPerson, ...rest } = e;
  const reasons = [
    rest.remainingBudget === null
      ? 'No budget target set'
      : rest.remainingBudget >= 0
        ? `Fits the budget with ${Math.round(rest.remainingBudget)} to spare`
        : `Over budget by ${Math.round(-rest.remainingBudget)}`,
    `${rest.destinationNights} nights at the destination`,
    rest.fareOverridePerPerson
      ? `Airfare ${farePerPerson}/person for these exact dates${rest.fareOverrideVerified ? ' (you checked it)' : ' (estimate)'}`
      : `Airfare ${farePerPerson}/person — ESTIMATED average for ${fareMonth} departures, not a fare for this date`,
  ];
  if (parts.weather !== null) reasons.push(`Seasonal weather score ${Math.round(parts.weather * 5 * 10) / 10}/5`);
  if (parts.preferences !== null && parts.preferences > 0) reasons.push(`${Math.round(parts.preferences * 100)}% inside your preferred dates`);
  return { ...rest, id: newId(), score, labels, reasons, status, feedback };
}

/** Finds a window that can be acted on; rejected windows must be restored first. */
function usableWindow(trip: Trip, windowId: string, action: string): CandidateTravelWindow {
  const w = (trip.windows ?? []).find((x) => x.id === windowId);
  if (!w) throw new Error('That window no longer exists.');
  if (w.status === 'rejected') throw new Error(`Restore this window before ${action} it.`);
  return w;
}

/** The trip-date option a window becomes once locked. */
function dateOptionFromWindow(trip: Trip, w: CandidateTravelWindow, id: string): DateOption {
  return {
    id,
    label: `${w.destinationNights} nights · locked window`,
    start: w.arrivalDate,
    end: w.destinationDepartureDate,
    flightPerPerson: w.fareOverridePerPerson ?? round2(w.airfareTotal / Math.max(1, travelerCount(trip))),
    flightStatus: w.fareOverridePerPerson && w.fareOverrideVerified ? 'verified' : 'estimated',
    notes: `Leave home ${w.departureDate}, back home ${w.returnDate}. ${w.weatherAssessment}`,
    fromWindowId: w.id,
  };
}

export type FareOverride = Pick<CandidateTravelWindow, 'fareOverridePerPerson' | 'fareOverrideVerified' | 'fareOverrideSource'>;

/**
 * Re-costs one window with a fare looked up for its exact dates. Keeps the window's id, status,
 * labels and feedback; rebuilds totals, reasons and score. A locked window's trip dates follow.
 */
export function applyFareOverride(trip: Trip, windowId: string, override: FareOverride): Trip {
  const w = usableWindow(trip, windowId, 'pricing');
  const e = evaluateWindow(trip, w.departureDate, w.destinationNights, override);
  if (!e) throw new Error('Could not re-cost this window: it no longer fits your availability or airfare months.');
  const next: CandidateTravelWindow = {
    ...toWindow(e, scoreAll([e], trip.weights ?? DEFAULT_WEIGHTS)[0].score, w.labels, w.status, w.feedback),
    id: w.id,
  };
  return {
    ...trip,
    windows: (trip.windows ?? []).map((x) => (x.id === w.id ? next : x)),
    dateOptions:
      w.status === 'locked'
        ? trip.dateOptions.map((d) => (d.fromWindowId === w.id ? dateOptionFromWindow(trip, next, d.id) : d))
        : trip.dateOptions,
  };
}

/** Lock a window for Stage B: it becomes the trip's chosen dates (arrival → leaving the destination). */
export function lockWindow(trip: Trip, windowId: string): Trip {
  const w = usableWindow(trip, windowId, 'locking');
  const option = dateOptionFromWindow(trip, w, newId());
  return {
    ...trip,
    windows: (trip.windows ?? []).map((x) =>
      x.id === windowId ? { ...x, status: 'locked' } : x.status === 'locked' ? { ...x, status: 'kept' } : x,
    ),
    dateOptions: [...trip.dateOptions.filter((d) => !d.fromWindowId), option],
    chosenDateId: option.id,
  };
}

export function setWindowStatus(trip: Trip, windowId: string, status: CandidateTravelWindow['status'], feedback?: string): Trip {
  const w = (trip.windows ?? []).find((x) => x.id === windowId);
  const unlocking = w?.status === 'locked' && status !== 'locked';
  return {
    ...trip,
    windows: (trip.windows ?? []).map((x) => (x.id === windowId ? { ...x, status, feedback: feedback ?? x.feedback } : x)),
    // Unlocking removes the trip dates that came from this window.
    ...(unlocking
      ? {
          dateOptions: trip.dateOptions.filter((d) => d.fromWindowId !== windowId),
          chosenDateId: trip.dateOptions.find((d) => d.id === trip.chosenDateId)?.fromWindowId === windowId ? null : trip.chosenDateId,
        }
      : {}),
  };
}
