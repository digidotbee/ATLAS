import { describe, expect, it } from 'vitest';
import { href, parseHash } from './router';

describe('Venture routes', () => {
  it('opens the Budget view and round-trips its link', () => {
    expect(parseHash('#/trip/abc/budget')).toEqual({ page: 'trip', id: 'abc', tab: 'budget' });
    expect(href({ page: 'trip', id: 'abc', tab: 'budget' })).toBe('#/trip/abc/budget');
    expect(parseHash('#/trip/abc/nope')).toEqual({ page: 'notFound', hash: '#/trip/abc/nope' });
  });
});
