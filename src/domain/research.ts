import { chosenDate, nightsBetween, travelerCount } from './budget';
import { blankCandidate } from './factory';
import { FOLLOW_UP_QUESTIONS } from './questions';
import {
  CATEGORIES,
  PRICE_BASES,
  type Candidate,
  type Category,
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
- If we have more than one base, include the transport between bases and to/from the airport as options.
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
  ]
}
("units": nights for lodging; otherwise null, or a count that overrides the automatic one, e.g. 2 people for a lesson only the kids take.)`;
}

export interface ImportResult {
  candidates: Candidate[];
  errors: string[];
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
    return { candidates: [], errors: [(e as Error).message] };
  }
  const list = Array.isArray(raw) ? raw : (raw as { candidates?: unknown })?.candidates;
  if (!Array.isArray(list)) {
    return { candidates: [], errors: ['Expected an object with a "candidates" array.'] };
  }
  if (list.length === 0) return { candidates: [], errors: ['The "candidates" array is empty.'] };

  const errors: string[] = [];
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
  return errors.length ? { candidates: [], errors } : { candidates: out, errors: [] };
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
