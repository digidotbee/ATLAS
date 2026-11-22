import { describe, expect, it } from 'vitest';
import { createTrip, defaultProfile } from './factory';
import { FOLLOW_UP_QUESTIONS } from './questions';
import { buildAssumptionsPrompt, buildResearchPrompt } from './research';
import type { Trip } from './types';

// A Venture saved before the kids question was removed still carries its answer.
function savedTrip(): Trip {
  const t = createTrip({
    name: 'Cabin weekend',
    destination: 'Big Bear, California',
    region: '',
    currency: 'USD',
    budgetTotal: null,
    adults: 2,
    children: 2,
    childAges: '',
    flexibility: '',
    dateOptions: [{ label: 'Weekend', start: '2027-01-15', end: '2027-01-17', flightPerPerson: null, flightStatus: 'estimated', notes: '' }],
  });
  return {
    ...t,
    answers: { purpose: 'A slow snowy weekend', kids: 'Maya is 7 and cannot swim yet' },
  };
}

describe('Shape it questions', () => {
  it('no longer asks what will make it great for the kids', () => {
    expect(FOLLOW_UP_QUESTIONS.map((q) => q.id)).not.toContain('kids');
    expect(FOLLOW_UP_QUESTIONS.some((q) => /kids/i.test(q.question))).toBe(false);
  });

  it('leaves a previously saved kids answer out of both research prompts', () => {
    const t = savedTrip();
    const profile = defaultProfile();
    for (const prompt of [buildResearchPrompt(t, profile, 'all'), buildAssumptionsPrompt(t, profile)]) {
      expect(prompt).not.toContain('Maya is 7');
      expect(prompt).not.toContain('What will make it great for the kids?');
      expect(prompt).toContain('A slow snowy weekend');
    }
  });
});
