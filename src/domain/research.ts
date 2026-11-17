import { chosenDate, nightsBetween, travelerCount } from './budget';
import { departureMonths } from './windows';
import { AIRPORT, blankMove, moveKey } from './moves';
import { blankCandidate } from './factory';
import { FOLLOW_UP_QUESTIONS } from './questions';
import {
  CATEGORIES,
  PRICE_BASES,
  type Candidate,
  type Category,
  type Move,
  type FamilyProfile,
  type PriceBasis,
  type PriceStatus,
  type ClimateMonth,
  type PlanningAssumptions,
  type PriceSource,
  type Trip,
} from './types';

/**
 * Builds a research prompt you can paste into any AI assistant (or use as a checklist).
 * The assistant is asked to reply with JSON that ATLAS imports directly — no paid API needed.
 */
export function buildResearchPrompt(trip: Trip, profile: FamilyProfile, focus: Category | 'all'): string {
  const date = chosenDate(trip);
  const tripDates = trip.dateOptions.filter((d) => !d.legacyAvailability);
  const av = trip.availability;
  const datesText = tripDates.length
    ? tripDates
        .map((d) => {
          const n = nightsBetween(d.start, d.end);
          const time = d.startTime || d.endTime ? ` (${d.startTime || 'unspecified'}${d.endTime ? `–${d.endTime}` : ''})` : '';
          return `- ${d.label || 'Option'}: ${d.start || '?'} to ${d.end || '?'}${n !== null ? ` (${n} nights)` : ''}${time}${d.id === date?.id ? ' ← preferred' : ''}`;
        })
        .join('\n')
    : av
      ? `- Not fixed yet: available to leave from ${av.earliestDeparture} and back by ${av.latestReturn} (this is availability, not the trip length)`
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
- ${trip.budgetTotal === null ? 'No budget target set; find good options without a spending cap.' : `Total budget: ${trip.budgetTotal} ${trip.currency}, everything included`}
- Date options:
${datesText}
${av?.idealDuration ? `- Ideal length: ${av.idealDuration}\n` : ''}${av?.optInBy ? `- Collaborator opt-in deadline: ${av.optInBy}\n` : ''}${trip.flexibility ? `- Flexibility: ${trip.flexibility}\n` : ''}${profile.homeAirport ? `- Flying from: ${profile.homeAirport}\n` : ''}
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
  if (!Array.isArray(raw) && raw && typeof raw === 'object' && ('dateOptions' in raw || 'airfarePerPersonByMonth' in raw)) {
    return {
      candidates: [],
      moves: {},
      errors: ['This looks like a dates / planning-assumptions reply. Paste it in step 2 (When & how long) → Planning assumptions instead.'],
    };
  }
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
 * Stage A research brief — ONE assistant request per optimization pass.
 * Asks only for the estimates the deterministic engine needs; ATLAS does the date search itself.
 */
export function buildAssumptionsPrompt(trip: Trip, profile: FamilyProfile): string {
  const av = trip.availability;
  const months = av ? departureMonths(av.earliestDeparture, av.latestReturn) : [];
  const mm = [...new Set(months.map((m) => m.slice(5, 7)))];
  const answers = FOLLOW_UP_QUESTIONS.filter((q) => trip.answers[q.id]?.trim())
    .map((q) => `- ${q.question} ${trip.answers[q.id].trim()}`)
    .join('\n');
  const airport = trip.constraints?.departureAirport || profile.homeAirport || '(home airport)';
  return `I'm planning a family trip and need PLANNING ESTIMATES (not bookings) so I can work out the best dates and trip length myself.

TRIP
- Destination: ${trip.destination}${trip.region ? ` (${trip.region})` : ''}
- Flying from: ${airport}
- Travelers: ${trip.travelers.adults} adults, ${trip.travelers.children} children${trip.travelers.childAges ? ` (ages ${trip.travelers.childAges})` : ''}
- ${trip.budgetTotal === null ? 'No budget target set; do not treat the trip as having a zero-dollar cap.' : `Total budget: ${trip.budgetTotal} ${trip.currency}, everything included`}
- Available to travel: leave home on or after ${av?.earliestDeparture ?? '?'}, back home by ${av?.latestReturn ?? '?'}. This is our availability, NOT the trip length.
${answers ? `\nWHAT WE WANT\n${answers}\n` : ''}
WHAT WE LIKE
${profile.interests.map((i) => `- ${i}`).join('\n')}

PLEASE ESTIMATE (in ${trip.currency})
1. Typical round-trip economy airfare per person from ${airport}, with one checked bag, for departures in each month: ${months.join(', ')}. These are route-level averages for planning, not fares for specific dates.
2. How many days after leaving home we arrive (1 if the flight lands the next calendar day), and how many days after leaving the destination we get home.
3. Typical whole-trip costs for our style: lodging per night for the whole family (independent places with character, good value), food per person per day (mostly local and casual), local transport per day for the whole group, and activities per person per day.
4. Taxes and fees on lodging as a percent.
5. Historical climate for months ${mm.join(', ')}: a 0–5 suitability score for our interests and a one-line summary. These are seasonal averages, not forecasts.

RULES
- Do not invent live prices. Everything here is an estimate; do not call anything verified.
- List the sources you relied on (URL, what it showed, date checked) so I can review them.

Reply with ONLY this JSON (no commentary):
{
  "currency": "${trip.currency}",
  "arrivalOffsetDays": 0,
  "returnOffsetDays": 0,
  "airfarePerPersonByMonth": { ${months.map((m) => `"${m}": 0`).join(', ')} },
  "baggageIncluded": true,
  "lodgingPerNight": 0,
  "foodPerPersonPerDay": 0,
  "transportPerDay": 0,
  "activitiesPerPersonPerDay": 0,
  "feesPct": 0,
  "climateByMonth": { ${mm.map((m) => `"${m}": { "score": 0, "summary": "" }`).join(', ')} },
  "sources": [ { "url": "", "note": "", "checkedAt": "YYYY-MM-DD" } ]
}`;
}

export interface AssumptionsImport {
  assumptions: Partial<PlanningAssumptions> | null;
  errors: string[];
}

/**
 * Validates a Stage A reply. Everything imported is stored as an ESTIMATE regardless of what the
 * reply claims: assistant figures are never verified prices.
 */
export function parseImportedAssumptions(text: string, currency: string): AssumptionsImport {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (e) {
    return { assumptions: null, errors: [(e as Error).message] };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { assumptions: null, errors: ['Expected a JSON object.'] };
  const o = raw as Record<string, unknown>;
  if ('candidates' in o) {
    return { assumptions: null, errors: ['This looks like an options reply. Paste it in step 3 (Explore) → Research helper instead.'] };
  }
  const errors: string[] = [];
  if (o.currency !== undefined && o.currency !== currency) {
    errors.push(`The reply is in ${String(o.currency)} but this trip uses ${currency}. Ask for ${currency} figures.`);
  }
  const out: Partial<PlanningAssumptions> = {};
  const nonNeg = (k: keyof PlanningAssumptions, label: string, int = false) => {
    if (o[k] === undefined || o[k] === null) return;
    const v = num(o[k]);
    if (v === null || !Number.isFinite(v) || v < 0 || (int && !Number.isInteger(v))) errors.push(`"${label}" must be a non-negative ${int ? 'whole ' : ''}number.`);
    else (out as Record<string, unknown>)[k] = v;
  };
  nonNeg('arrivalOffsetDays', 'arrivalOffsetDays', true);
  nonNeg('returnOffsetDays', 'returnOffsetDays', true);
  nonNeg('lodgingPerNight', 'lodgingPerNight');
  nonNeg('foodPerPersonPerDay', 'foodPerPersonPerDay');
  nonNeg('transportPerDay', 'transportPerDay');
  nonNeg('activitiesPerPersonPerDay', 'activitiesPerPersonPerDay');
  nonNeg('feesPct', 'feesPct');
  if (typeof o.baggageIncluded === 'boolean') out.baggageIncluded = o.baggageIncluded;

  if (o.airfarePerPersonByMonth !== undefined) {
    const fares: Record<string, number> = {};
    if (typeof o.airfarePerPersonByMonth !== 'object' || o.airfarePerPersonByMonth === null) errors.push('"airfarePerPersonByMonth" must be an object.');
    else
      for (const [k, v] of Object.entries(o.airfarePerPersonByMonth)) {
        const n = num(v);
        if (!/^\d{4}-\d{2}$/.test(k)) errors.push(`Airfare month "${k}" must look like 2027-05.`);
        else if (n === null || !Number.isFinite(n) || n <= 0) errors.push(`Airfare for ${k} must be a positive number.`);
        else fares[k] = n;
      }
    out.airfarePerPersonByMonth = fares;
  }
  if (o.climateByMonth !== undefined) {
    const climate: Record<string, ClimateMonth> = {};
    if (typeof o.climateByMonth !== 'object' || o.climateByMonth === null) errors.push('"climateByMonth" must be an object.');
    else
      for (const [k, v] of Object.entries(o.climateByMonth)) {
        const c = (v ?? {}) as Record<string, unknown>;
        const score = num(c.score);
        if (!/^\d{2}$/.test(k)) errors.push(`Climate month "${k}" must look like 05.`);
        else if (score === null || !Number.isFinite(score) || score < 0 || score > 5) errors.push(`Climate score for ${k} must be 0–5.`);
        else climate[k] = { score, summary: typeof c.summary === 'string' ? c.summary : '' };
      }
    out.climateByMonth = climate;
  }
  if (o.sources !== undefined) {
    if (!Array.isArray(o.sources)) errors.push('"sources" must be a list.');
    else
      out.sources = o.sources
        .map((x) => (x ?? {}) as Record<string, unknown>)
        .map((x): PriceSource => ({
          url: typeof x.url === 'string' ? x.url : '',
          note: typeof x.note === 'string' ? x.note : '',
          checkedAt: typeof x.checkedAt === 'string' ? x.checkedAt : '',
        }))
        .filter((x) => x.url || x.note);
  }
  if (errors.length) return { assumptions: null, errors };
  if (Object.keys(out).length === 0) return { assumptions: null, errors: ['The reply contained none of the expected fields.'] };
  return { assumptions: { ...out, origin: 'assistant', researchedAt: new Date().toISOString().slice(0, 10) }, errors: [] };
}

/** Targeted follow-up for one promising window: the fare for its exact dates. */
export function buildWindowFarePrompt(
  trip: Trip,
  profile: FamilyProfile,
  w: { departureDate: string; destinationDepartureDate: string; returnDate: string },
): string {
  const airport = trip.constraints?.departureAirport || profile.homeAirport || '(home airport)';
  return `Please look up the current round-trip economy fare for ${travelerCount(trip)} travelers (${trip.travelers.adults} adults, ${trip.travelers.children} children), one checked bag each:
- From ${airport} to ${trip.destination}
- Leave home ${w.departureDate}; return flight leaves ${trip.destination} on ${w.destinationDepartureDate} (back home ${w.returnDate})
Report the price per person in ${trip.currency}, the airline/itinerary, where you found it (URL) and when. If you cannot see a live fare for these exact dates, say so and give only a clearly labeled estimate.`;
}
