import {
  budgetBasisOf,
  budgetTargetLabel,
  enteredBudget,
  formatMoney,
  setBudgetAmount,
  setBudgetBasis,
  travelerCount,
} from '../domain/budget';
import type { Trip } from '../domain/types';
import { Field, NumberInput } from './common';
import { href } from './router';
import type { TabProps } from './TripView';

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

/**
 * Header pill (BUDGET-01): the target as entered, such as "$150 per person" or "$600 total",
 * or "+Set budget" when none is set. Every state opens the Budget view.
 */
export function BudgetPill({ trip, active }: { trip: Trip; active: boolean }) {
  const label = budgetTargetLabel(trip);
  return (
    <a
      className={`budget-pill ${label === null ? 'unset' : ''} ${active ? 'active' : ''}`}
      href={href({ page: 'trip', id: trip.id, tab: 'budget' })}
      aria-label={label === null ? 'Set budget' : `Budget: ${label}`}
      aria-current={active ? 'page' : undefined}
    >
      {label ?? '+Set budget'}
    </a>
  );
}

/** Budget view: set or edit the target and see the planning headcount it uses (BUDGET-01, BUDGET-03). */
export function BudgetTab({ trip, update }: TabProps) {
  const basis = budgetBasisOf(trip);
  const count = travelerCount(trip);
  const perPerson = basis === 'perPerson';
  const groupHint = perPerson
    ? trip.budgetTotal === null
      ? 'Group target appears once you enter an amount'
      : `${formatMoney(trip.budgetTotal, trip.currency, 2)} for ${people(count)} · follows the headcount`
    : undefined;

  return (
    <div className="stack">
      <h2>Budget</h2>
      <p className="muted">
        Set a target for the whole Venture or for each person. A per-person target stays as you entered it, and the group target follows the
        planning headcount. You can choose and confirm costs without a target.
      </p>
      <div className="card stack-sm">
        <div className="segmented" role="group" aria-label="Budget type">
          <button type="button" className={basis === 'total' ? 'on' : ''} aria-pressed={basis === 'total'} onClick={() => update((t) => setBudgetBasis(t, 'total'))}>
            Total (Everything included)
          </button>
          <button type="button" className={perPerson ? 'on' : ''} aria-pressed={perPerson} onClick={() => update((t) => setBudgetBasis(t, 'perPerson'))}>
            Per person
          </button>
        </div>
        <div className="grid-3">
          <Field label={perPerson ? 'Budget per person' : 'Total budget'} hint={groupHint}>
            <NumberInput
              value={enteredBudget(trip)}
              onChange={(v) => update((t) => setBudgetAmount(t, v))}
              step={perPerson ? 10 : 100}
              aria-label={perPerson ? 'Budget per person' : 'Total budget'}
              placeholder="No target set"
            />
          </Field>
          <Field label="Currency" hint="3-letter code">
            <input value={trip.currency} maxLength={3} onChange={(e) => update((t) => ({ ...t, currency: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Cushion for surprises (%)" hint="Held back from what's left to plan">
            <NumberInput value={trip.contingencyPct} onChange={(v) => update((t) => ({ ...t, contingencyPct: Math.min(50, v ?? 0) }))} aria-label="Contingency percent" />
          </Field>
        </div>
      </div>
      <div className="card stack-sm">
        <h3>Planning headcount</h3>
        <p>
          <strong>{people(count)}</strong> from Who
          {trip.travelers.children > 0 && ` (${trip.travelers.adults} adults, ${trip.travelers.children} children)`}.{' '}
          <a href={href({ page: 'trip', id: trip.id, tab: 'setup' })}>Change in Venture settings</a>
        </p>
        <p className="muted small">
          {perPerson
            ? 'Changing the headcount recalculates the group target. The per-person target stays the same.'
            : 'A total target stays the same when the headcount changes.'}
        </p>
      </div>
    </div>
  );
}
