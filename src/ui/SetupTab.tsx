import { budgetBasisOf, enteredBudget, formatMoney, setBudgetAmount, setBudgetBasis, travelerCount } from '../domain/budget';
import { useStore } from '../state/store';
import { Field, NumberInput } from './common';
import { go } from './router';
import type { TabProps } from './TripView';

export function SetupTab({ trip, update }: TabProps) {
  const { deleteTrip } = useStore();
  const basis = budgetBasisOf(trip);
  const people = travelerCount(trip);
  const groupHint =
    basis === 'perPerson'
      ? `${trip.budgetTotal === null ? 'No group total yet' : `${formatMoney(trip.budgetTotal, trip.currency, 2)} for ${people} ${people === 1 ? 'person' : 'people'}`} · follows the headcount`
      : undefined;
  return (
    <div className="stack">
      <h2>Venture settings</h2>
      <div className="card stack-sm">
        <div className="grid-2">
          <Field label="Venture name">
            <input value={trip.name} onChange={(e) => update((t) => ({ ...t, name: e.target.value }))} />
          </Field>
          <Field label="Destination">
            <input value={trip.destination} onChange={(e) => update((t) => ({ ...t, destination: e.target.value }))} />
          </Field>
        </div>
        <Field label="Wider region">
          <input value={trip.region} onChange={(e) => update((t) => ({ ...t, region: e.target.value }))} />
        </Field>
      </div>
      <div className="card stack-sm">
        <div className="segmented" role="group" aria-label="Budget type">
          <button type="button" className={basis === 'total' ? 'on' : ''} aria-pressed={basis === 'total'} onClick={() => update((t) => setBudgetBasis(t, 'total'))}>
            Total (Everything included)
          </button>
          <button type="button" className={basis === 'perPerson' ? 'on' : ''} aria-pressed={basis === 'perPerson'} onClick={() => update((t) => setBudgetBasis(t, 'perPerson'))}>
            Per person
          </button>
        </div>
        <div className="grid-3">
          <Field label={basis === 'perPerson' ? 'Budget per person' : 'Total budget'} hint={groupHint}>
            <NumberInput
              value={enteredBudget(trip)}
              onChange={(v) => update((t) => setBudgetAmount(t, v))}
              step={basis === 'perPerson' ? 10 : 100}
              aria-label={basis === 'perPerson' ? 'Budget per person' : 'Total budget'}
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
        <div className="grid-3">
          <Field label="Adults">
            <NumberInput value={trip.travelers.adults} min={1} onChange={(v) => update((t) => ({ ...t, travelers: { ...t.travelers, adults: Math.max(1, v ?? 1) } }))} aria-label="Adults" />
          </Field>
          <Field label="Children">
            <NumberInput value={trip.travelers.children} onChange={(v) => update((t) => ({ ...t, travelers: { ...t.travelers, children: v ?? 0 } }))} aria-label="Children" />
          </Field>
          <Field label="Children's ages">
            <input value={trip.travelers.childAges} onChange={(e) => update((t) => ({ ...t, travelers: { ...t.travelers, childAges: e.target.value } }))} />
          </Field>
        </div>
        <Field label="Date flexibility">
          <input value={trip.flexibility} onChange={(e) => update((t) => ({ ...t, flexibility: e.target.value }))} />
        </Field>
      </div>
      <div className="card danger-zone">
        <h3>Exit Venture</h3>
        <p className="muted small">Removes this Venture and all its research from every synced device.</p>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (confirm(`Exit “${trip.name}”? This removes the Venture and all its research from every synced device and can't be undone.`)) {
              deleteTrip(trip.id);
              go({ page: 'trips' });
            }
          }}
        >
          Exit Venture
        </button>
      </div>
    </div>
  );
}
