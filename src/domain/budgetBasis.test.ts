import { describe, expect, it } from 'vitest';
import { budgetBasisOf, budgetTargetLabel, enteredBudget, setBudgetAmount, setBudgetBasis, withBudgetTotal } from './budget';
import { createTrip, emptyData, type NewTripInput } from './factory';
import type { Trip } from './types';
import { parseAtlasData } from './validate';

function venture(input: Partial<NewTripInput> = {}): Trip {
  return createTrip({
    name: 'Cabin weekend',
    destination: 'Big Bear Lake',
    region: '',
    currency: 'USD',
    budgetTotal: 1200,
    adults: 3,
    children: 1,
    flexibility: '',
    dateOptions: [],
    ...input,
  });
}

function withPeople(t: Trip, adults: number, children: number): Trip {
  return withBudgetTotal({ ...t, travelers: { ...t.travelers, adults, children } });
}

describe('budget basis', () => {
  it('saves a total budget as entered and leaves it alone when the headcount changes', () => {
    const t = venture();
    expect(t.budgetBasis).toBe('total');
    expect(t.budgetPerPerson).toBeUndefined();
    expect(enteredBudget(t)).toBe(1200);
    expect(withPeople(t, 6, 0).budgetTotal).toBe(1200);
  });

  it('saves the per-person amount and derives the group total from the headcount', () => {
    const t = venture({ budgetBasis: 'perPerson', budgetPerPerson: 150.25, budgetTotal: null });
    expect(t).toMatchObject({ budgetBasis: 'perPerson', budgetPerPerson: 150.25, budgetTotal: 601 });
    expect(enteredBudget(t)).toBe(150.25);

    const bigger = withPeople(t, 4, 2);
    expect(bigger).toMatchObject({ budgetPerPerson: 150.25, budgetTotal: 901.5 });
    expect(withPeople(bigger, 1, 0).budgetTotal).toBe(150.25);
  });

  it('keeps no target when a per-person budget has no amount', () => {
    const t = venture({ budgetBasis: 'perPerson', budgetPerPerson: null, budgetTotal: null });
    expect(t).toMatchObject({ budgetBasis: 'perPerson', budgetPerPerson: null, budgetTotal: null });
    expect(withPeople(t, 5, 0).budgetTotal).toBeNull();
  });

  it('sets the amount in the current basis', () => {
    expect(setBudgetAmount(venture(), 900)).toMatchObject({ budgetTotal: 900 });
    const per = venture({ budgetBasis: 'perPerson', budgetPerPerson: 100, budgetTotal: null });
    expect(setBudgetAmount(per, 250)).toMatchObject({ budgetPerPerson: 250, budgetTotal: 1000 });
    expect(setBudgetAmount(per, null)).toMatchObject({ budgetPerPerson: null, budgetTotal: null });
  });

  it('switches basis without changing the group total', () => {
    const per = setBudgetBasis(venture(), 'perPerson');
    expect(per).toMatchObject({ budgetBasis: 'perPerson', budgetPerPerson: 300, budgetTotal: 1200 });

    const back = setBudgetBasis(withPeople(per, 5, 1), 'total');
    expect(back).toMatchObject({ budgetBasis: 'total', budgetTotal: 1800 });
    expect(back.budgetPerPerson).toBeUndefined();
    expect(withPeople(back, 2, 0).budgetTotal).toBe(1800);
    expect(setBudgetBasis(back, 'total')).toBe(back);
  });

  it('rounds an uneven per-person split to the cent', () => {
    const t = setBudgetBasis(venture({ budgetTotal: 1000, adults: 3, children: 0 }), 'perPerson');
    expect(t).toMatchObject({ budgetPerPerson: 333.33, budgetTotal: 999.99 });
  });
});

describe('loading saved budgets', () => {
  const saved = (trip: Record<string, unknown>) => ({ ...emptyData(), trips: [trip] });

  it('treats Ventures saved before budget bases as total budgets', () => {
    const old: Record<string, unknown> = { ...venture() };
    delete old.budgetBasis;
    const [t] = parseAtlasData(saved(old), 'test').trips;
    expect(budgetBasisOf(t)).toBe('total');
    expect(t.budgetTotal).toBe(1200);
  });

  it('re-derives a stale per-person total on load', () => {
    const stale = {
      ...venture({ budgetBasis: 'perPerson', budgetPerPerson: 100, budgetTotal: null }),
      travelers: { adults: 5, children: 0 },
      budgetTotal: 400,
    };
    expect(parseAtlasData(saved(stale), 'test').trips[0].budgetTotal).toBe(500);
  });

  it('refuses an unknown basis or a per-person basis without a numeric amount', () => {
    expect(() => parseAtlasData(saved({ ...venture(), budgetBasis: 'perNight' }), 'test')).toThrow(/unknown budget basis "perNight"/);
    expect(() => parseAtlasData(saved({ ...venture(), budgetBasis: 'perPerson', budgetPerPerson: '150' }), 'test')).toThrow(/per-person/);
    expect(() => parseAtlasData(saved({ ...venture(), budgetBasis: 'perPerson' }), 'test')).toThrow(/per-person/);
  });
});

describe('Budget pill label (BUDGET-01)', () => {
  it('shows the target as entered and keeps it through a headcount change', () => {
    const per = venture({ budgetBasis: 'perPerson', budgetPerPerson: 150, budgetTotal: null, adults: 4, children: 0 });
    expect(budgetTargetLabel(per)).toBe('$150 per person');
    const six = withPeople(per, 6, 0);
    expect(budgetTargetLabel(six)).toBe('$150 per person');
    expect(six.budgetTotal).toBe(900);

    const total = venture({ budgetTotal: 600, adults: 4, children: 0 });
    expect(budgetTargetLabel(total)).toBe('$600 total');
    expect(budgetTargetLabel(withPeople(total, 6, 0))).toBe('$600 total');
  });

  it('keeps cents as entered and has no label without a target', () => {
    expect(budgetTargetLabel(venture({ budgetBasis: 'perPerson', budgetPerPerson: 150.25, budgetTotal: null }))).toBe('$150.25 per person');
    expect(budgetTargetLabel(venture({ budgetTotal: null }))).toBeNull();
    expect(budgetTargetLabel(venture({ budgetBasis: 'perPerson', budgetPerPerson: null, budgetTotal: null }))).toBeNull();
  });

  it('labels a legacy saved total as a total', () => {
    const legacy: Trip = { ...venture({ budgetTotal: 600 }) };
    delete legacy.budgetBasis;
    expect(budgetTargetLabel(legacy)).toBe('$600 total');
  });
});
