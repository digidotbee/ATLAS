import { affordableNights, chosenDate, formatMoney, nightsBetween, travelerCount } from './budget';
import { AIRPORT, blankMove, moveKey } from './moves';
import { blankCandidate } from './factory';
import { FOLLOW_UP_QUESTIONS } from './questions';
import {
  CATEGORIES,
  PRICE_BASES,
  type Candidate,
  type Category,
  type DateOption,
  type Move,
  type FamilyProfile,
  type PriceBasis,
  type PriceStatus,
  type Trip,
} from './types';

/**
 * Builds a research prompt you can paste into any AI assistant (or use as a checklist).
 * The assistant is asked to reply with JSON that ATLAS imports directly — no paid API needed.
 */
export function buildResearchPrompt(trip: Trip, profile: FamilyProfile, focus: Category | 'all'): string {
  const date = chosenDate(trip);
  const datesText = trip.dateOptions.length
    ? trip.dateOptions
        .map((d) => {
          const n = nightsBetween(d.start, d.end);
          return `- ${d.label || 'Option'}: ${d.start || '?'} to ${d.end || '?'}${n !== null ? ` (${n} nights)` : ''}${d.id === date?.id ? ' ← preferred' : ''}`;
        })
        .join('\n')
    : '- Flexible, not yet set';

  const answers = FOLLOW_UP_QUESTIONS.filter((q) => trip.answers[q.id]?.trim())
    .map((q) => `- ${q.question} ${trip.answers[q.id].trim()}`)
    .join('\n');

  const focusText =
    focus === 'all'
      ? 'lodging, getting around, experiences, and food'
      : CATEGORIES.find((c) => c.id === focus)!.label.toLowerCase();

  const existing = trip.candidates
    .filter((c) => c.status !== 'rejected')
    .map((c) => `- [${c.category}] ${c.name}${c.base ? ` (base: ${c.base})` : ''}`)
    .join('\n');
  const rejected = trip.candidates
    .filter((c) => c.status === 'rejected')
    .map((c) => `- ${c.name}`)
    .join('\n');

  return `I'm planning a family trip and want well-researched, realistic options.

TRIP
- Destination: ${trip.destination}${trip.region ? ` (${trip.region})` : ''}
- Travelers: ${trip.travelers.adults} adults, ${trip.travelers.children} children${trip.travelers.childAges ? ` (ages ${trip.travelers.childAges})` : ''} — ${travelerCount(trip)} people
- Total budget: ${trip.budgetTotal} ${trip.currency}, everything included
- Date options:
${datesText}
${trip.flexibility ? `- Flexibility: ${trip.flexibility}\n` : ''}${profile.homeAirport ? `- Flying from: ${profile.homeAirport}\n` : ''}
WHAT OUR FAMILY LOVES
${profile.interests.map((i) => `- ${i}`).join('\n')}
${profile.notes ? `\n${profile.notes}\n` : ''}${answers ? `\nTHIS TRIP\n${answers}\n` : ''}${existing ? `\nALREADY ON OUR LIST (don't repeat)\n${existing}\n` : ''}${rejected ? `\nALREADY REJECTED\n${rejected}\n` : ''}
TASK
Suggest 6–12 options for ${focusText}. Prefer places with genuine local life over commercialized tourist districts, and independent places with character. Be honest about prices: only mark a price "verified" if you are quoting a current published rate; otherwise "estimated".

RULES
- Organize the plan around bases (the towns/areas where we sleep). Set "base" on every option to the base it is done from, using the same base names throughout. Day trips belong to the base you would travel from.
- Give each lodging option "units" = the number of nights you suggest staying there, so the nights add up to the trip length.
- Put travel between bases, and to/from the airport, in "moves" (not in "candidates"). Use the same base names and "${AIRPORT}" for the airport. Count the whole travel day: packing and check-out, getting to the station, the ride, food on the way, and getting to the new place. Prices are per person.
- Use plain names only (no "alternative to…" in the name) — put comparisons and caveats in "notes".

Reply with ONLY this JSON (no commentary), in ${trip.currency}:
{
  "candidates": [
    {
      "category": "lodging | transport | food | activities | flights | other",
      "name": "string",
      "location": "neighborhood / town",
      "url": "official website if known, else empty string",
      "price": 0,
      "basis": "total | perPerson | perNight | perDay | perPersonPerDay",
      "priceStatus": "estimated | verified",
      "base": "town/area this belongs to",
      "units": null,
      "tags": ["e.g. UNESCO", "Surfing", "Walkable"],
      "notes": "why it fits our family, best time, booking tips, caveats"
    }
  ],
  "moves": [
    {
      "from": "${AIRPORT} or base name",
      "to": "base name or ${AIRPORT}",
      "mode": "e.g. Hokuriku Shinkansen",
      "ridePerPerson": 0,
      "localPerPerson": 0,
      "mealPerPerson": 0,
      "hours": 0,
      "priceStatus": "estimated | verified",
      "notes": "door-to-door time, luggage tips, seat reservations"
    }
  ]
}
("units": nights for lodging; otherwise null, or a count that overrides the automatic one, e.g. 2 people for a lesson only the kids take.)`;
}

export interface ImportResult {
  candidates: Candidate[];
  /** Travel legs keyed by route (see moves.ts). */
  moves: Record<string, Move>;
  errors: string[];
}

const num = (v: unknown): number | null =>
  v === undefined || v === null || v === '' ? null : typeof v === 'number' || typeof v === 'string' ? Number(v) : NaN;

function parseMoves(list: unknown, errors: string[]): Record<string, Move> {
  const out: Record<string, Move> = {};
  if (list === undefined) return out;
  if (!Array.isArray(list)) {
    errors.push('"moves" must be a list.');
    return out;
  }
  list.forEach((item, i) => {
    const o = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
    const where = `Move ${i + 1}`;
    const from = typeof o.from === 'string' ? o.from.trim() : '';
    const to = typeof o.to === 'string' ? o.to.trim() : '';
    if (!from || !to) {
      errors.push(`${where}: needs "from" and "to".`);
      return;
    }
    const fields = { ridePerPerson: num(o.ridePerPerson), localPerPerson: num(o.localPerPerson), mealPerPerson: num(o.mealPerPerson), hours: num(o.hours) };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== null && (!Number.isFinite(v) || v < 0)) errors.push(`${where} (${from} → ${to}): "${k}" must be a non-negative number.`);
    }
    if (o.priceStatus !== undefined && o.priceStatus !== 'estimated' && o.priceStatus !== 'verified') {
      errors.push(`${where} (${from} → ${to}): "priceStatus" must be "estimated" or "verified".`);
    }
    out[moveKey(from, to)] = {
      ...blankMove(),
      ...fields,
      mode: typeof o.mode === 'string' ? o.mode : '',
      notes: typeof o.notes === 'string' ? o.notes : '',
      priceStatus: o.priceStatus === 'verified' ? 'verified' : 'estimated',
    };
  });
  return out;
}

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const BASIS_IDS = new Set<string>(PRICE_BASES.map((b) => b.id));

/** Extracts the first JSON object/array from pasted text (AI replies often wrap JSON in ``` fences). */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found. Paste the reply that contains { "candidates": [...] }.');
  try {
    return JSON.parse(body.slice(start));
  } catch (e) {
    throw new Error(`The pasted text is not valid JSON: ${(e as Error).message}`);
  }
}

/**
 * Validates pasted research. All-or-nothing: if any item is invalid, nothing is imported
 * and every problem is listed so it can be fixed.
 */
export function parseImportedCandidates(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (e) {
    return { candidates: [], moves: {}, errors: [(e as Error).message] };
  }
  const list = Array.isArray(raw) ? raw : (raw as { candidates?: unknown })?.candidates;
  if (!Array.isArray(list)) {
    return { candidates: [], moves: {}, errors: ['Expected an object with a "candidates" array.'] };
  }
  const errors: string[] = [];
  const moves = Array.isArray(raw) ? {} : parseMoves((raw as { moves?: unknown }).moves, errors);
  if (list.length === 0 && Object.keys(moves).length === 0 && errors.length === 0) {
    return { candidates: [], moves: {}, errors: ['The reply has no candidates or moves.'] };
  }

  const out: Candidate[] = [];
  list.forEach((item, i) => {
    const where = `Item ${i + 1}`;
    const before = errors.length;
    if (typeof item !== 'object' || item === null) {
      errors.push(`${where}: not an object.`);
      return;
    }
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const label = name ? `${where} ("${name}")` : where;
    if (!name) errors.push(`${where}: missing "name".`);
    if (typeof o.category !== 'string' || !CATEGORY_IDS.has(o.category)) {
      errors.push(`${label}: "category" must be one of ${[...CATEGORY_IDS].join(', ')}.`);
    }
    const price = typeof o.price === 'number' ? o.price : typeof o.price === 'string' ? Number(o.price) : NaN;
    if (!Number.isFinite(price) || price < 0) errors.push(`${label}: "price" must be a non-negative number.`);
    if (typeof o.basis !== 'string' || !BASIS_IDS.has(o.basis)) {
      errors.push(`${label}: "basis" must be one of ${[...BASIS_IDS].join(', ')}.`);
    }
    const units = o.units === undefined || o.units === null || o.units === '' ? null : Number(o.units);
    if (units !== null && (!Number.isFinite(units) || units < 0)) {
      errors.push(`${label}: "units" must be a non-negative number or null.`);
    }
    if (o.base !== undefined && typeof o.base !== 'string') errors.push(`${label}: "base" must be text.`);
    if (o.priceStatus !== 'estimated' && o.priceStatus !== 'verified') {
      errors.push(`${label}: "priceStatus" must be "estimated" or "verified".`);
    }
    if (errors.length > before) return;
    const c = blankCandidate(o.category as Category);
    out.push({
      ...c,
      name,
      location: typeof o.location === 'string' ? o.location : '',
      url: typeof o.url === 'string' ? o.url : '',
      notes: typeof o.notes === 'string' ? o.notes : '',
      price,
      basis: o.basis as PriceBasis,
      priceStatus: o.priceStatus as PriceStatus,
      units,
      base: typeof o.base === 'string' ? o.base.trim() : '',
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string') : [],
    });
  });
  return errors.length ? { candidates: [], moves: {}, errors } : { candidates: out, moves, errors: [] };
}

/** Which of the family's interests a candidate matches — by its tags and name only, to keep matches meaningful. */
export function matchedInterests(c: Candidate, interests: string[]): string[] {
  const tags = c.tags.map((t) => t.toLowerCase());
  const hay = `${c.name} ${tags.join(' ')}`.toLowerCase();
  return interests.filter((i) => {
    const key = i.toLowerCase();
    if (tags.includes(key)) return true;
    const words = key.split(/[^a-z]+/).filter((w) => w.length > 4 && !['local', 'quiet', 'value', 'friendly'].includes(w));
    return words.some((w) => hay.includes(w));
  });
}

/**
 * Brief asking an assistant to scan the open travel window for the best visit dates,
 * limited to the trip length the budget allows, with an airfare estimate for each window.
 */
export function buildDatesPrompt(trip: Trip, profile: FamilyProfile, windowStart: string, windowEnd: string): string {
  const people = travelerCount(trip);
  const answers = FOLLOW_UP_QUESTIONS.filter((q) => trip.answers[q.id]?.trim())
    .map((q) => `- ${q.question} ${trip.answers[q.id].trim()}`)
    .join('\n');
  const afford = affordableNights(trip, null);
  const lengthRule = afford
    ? `Based on what we've chosen so far, each night costs our whole group about ${formatMoney(afford.perNight, trip.currency)} (excluding flights). Pick a trip length the total budget can cover once airfare is included: nights × ${afford.perNight} + airfare for ${people} + ${trip.contingencyPct}% cushion ≤ ${trip.budgetTotal}.`
    : `Estimate a realistic whole-group daily cost (lodging, food, local transport, activities) for this family's style, and pick the longest trip the budget covers once airfare for ${people} and a ${trip.contingencyPct}% cushion are included.`;
  return `I'm planning a family trip and need the best travel dates.

TRIP
- Destination: ${trip.destination}${trip.region ? ` (${trip.region})` : ''}
- Travelers: ${trip.travelers.adults} adults, ${trip.travelers.children} children${trip.travelers.childAges ? ` (ages ${trip.travelers.childAges})` : ''}
- Total budget: ${trip.budgetTotal} ${trip.currency}, everything included
- Open window: we can arrive any time from ${windowStart || '?'} and must leave by ${windowEnd || '?'}
${trip.flexibility ? `- Flexibility: ${trip.flexibility}\n` : ''}${profile.homeAirport ? `- Flying from: ${profile.homeAirport}\n` : ''}${answers ? `\nWHAT WE WANT\n${answers}\n` : ''}
TASK
1. Check the whole open window for the best time to visit: weather and rainy seasons, heat, typhoons, crowds and school holidays, festivals, and typical airfare levels.
2. ${lengthRule}
3. Suggest 3–5 date windows inside the open window, best first. "start" is the day we ARRIVE at the destination (overnight flights often land the next day) and "end" is the day we LEAVE.
4. Give a round-trip economy airfare estimate per person for each window from our home airport, including a checked bag. Mark it "verified" only if you are quoting a current published fare.

Reply with ONLY this JSON (no commentary), in ${trip.currency}:
{
  "dailyCostEstimate": 0,
  "dateOptions": [
    {
      "label": "short name, e.g. Late May before the rains",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "flightPerPerson": 0,
      "flightStatus": "estimated | verified",
      "notes": "why this window: weather, crowds, events, airfare, how many nights the budget allows"
    }
  ]
}
("dailyCostEstimate" = whole group per day, excluding flights.)`;
}

export interface DatesImport {
  dateOptions: Omit<DateOption, 'id'>[];
  dailyEstimate: number | null;
  errors: string[];
}

export function parseImportedDates(text: string): DatesImport {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (e) {
    return { dateOptions: [], dailyEstimate: null, errors: [(e as Error).message] };
  }
  const o = (raw ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  if (!Array.isArray(o.dateOptions) || o.dateOptions.length === 0) {
    return { dateOptions: [], dailyEstimate: null, errors: ['Expected a "dateOptions" list with at least one window.'] };
  }
  const daily = num(o.dailyCostEstimate);
  if (daily !== null && (!Number.isFinite(daily) || daily < 0)) errors.push('"dailyCostEstimate" must be a non-negative number.');
  const out: Omit<DateOption, 'id'>[] = [];
  o.dateOptions.forEach((item, i) => {
    const d = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
    const where = `Window ${i + 1}`;
    const start = typeof d.start === 'string' ? d.start : '';
    const end = typeof d.end === 'string' ? d.end : '';
    if (nightsBetween(start, end) === null) errors.push(`${where}: "start" and "end" must be YYYY-MM-DD dates with end on or after start.`);
    const fare = num(d.flightPerPerson);
    if (fare !== null && (!Number.isFinite(fare) || fare < 0)) errors.push(`${where}: "flightPerPerson" must be a non-negative number.`);
    if (d.flightStatus !== undefined && d.flightStatus !== 'estimated' && d.flightStatus !== 'verified') {
      errors.push(`${where}: "flightStatus" must be "estimated" or "verified".`);
    }
    out.push({
      label: typeof d.label === 'string' && d.label.trim() ? d.label.trim() : `Window ${i + 1}`,
      start,
      end,
      flightPerPerson: fare,
      flightStatus: d.flightStatus === 'verified' ? 'verified' : 'estimated',
      notes: typeof d.notes === 'string' ? d.notes : '',
    });
  });
  return errors.length ? { dateOptions: [], dailyEstimate: null, errors } : { dateOptions: out, dailyEstimate: daily, errors: [] };
}
