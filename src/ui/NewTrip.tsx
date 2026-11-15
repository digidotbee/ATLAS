import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatMoney, nightsBetween } from '../domain/budget';
import { createTrip } from '../domain/factory';
import { NEW_TRIP_STEPS, stepErrors, type NewTripDraft, type NewTripStep } from '../domain/newTrip';
import { useStore } from '../state/store';
import { Banner, Field, formatDate, NumberInput } from './common';
import { go, href } from './router';

const STEP_COPY: Record<NewTripStep, { title: string; hint: string }> = {
  where: { title: 'Where are you dreaming of going?', hint: 'A country, a region, a town — or just an idea like “Atlantic coast of Portugal”.' },
  budget: { title: 'What’s the total budget?', hint: 'Everything included: flights, places to stay, getting around, food, experiences and a cushion for surprises.' },
  when: { title: 'When could you travel?', hint: 'Your availability, not the trip dates. ATLAS finds the best dates and trip length inside it.' },
  who: { title: 'Who’s coming?', hint: '' },
};

export function NewTrip() {
  const { data, addTrip } = useStore();
  const p = data.profile;
  const [d, setD] = useState<NewTripDraft>({
    destination: '',
    name: '',
    region: '',
    budget: null,
    currency: p.defaultCurrency,
    earliest: '',
    latest: '',
    minNights: null,
    prefNights: null,
    maxNights: null,
    airport: p.homeAirport,
    flexibility: '',
    adults: p.defaultAdults,
    children: p.defaultChildren,
    childAges: '',
  });
  const [i, setI] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const step = NEW_TRIP_STEPS[i];
  const last = i === NEW_TRIP_STEPS.length - 1;
  const set = (patch: Partial<NewTripDraft>) => {
    setD((x) => ({ ...x, ...patch }));
    setErrors([]); // a correction clears the old message
  };
  const span = nightsBetween(d.earliest, d.latest);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [i]);

  function create() {
    const trip = createTrip({
      name: d.name,
      destination: d.destination,
      region: d.region,
      currency: d.currency,
      budgetTotal: d.budget!,
      adults: d.adults!,
      children: d.children ?? 0,
      childAges: d.childAges,
      flexibility: d.flexibility,
      // Availability is never stored as trip dates; ATLAS finds the trip dates inside it.
      dateOptions: [],
    });
    if (d.earliest && d.latest) {
      trip.availability = { earliestDeparture: d.earliest, latestReturn: d.latest, preferredRanges: [], excludedRanges: [] };
    }
    trip.constraints = { departureAirport: d.airport.trim().toUpperCase(), minNights: d.minNights, preferredNights: d.prefNights, maxNights: d.maxNights };
    addTrip(trip);
    // Hybrid flow: land on the suggested next step.
    go({ page: 'trip', id: trip.id, tab: trip.availability ? 'dates' : 'plan' });
  }

  function next(e: FormEvent) {
    e.preventDefault();
    const errs = stepErrors(step, d);
    setErrors(errs);
    if (errs.length) return;
    if (last) create();
    else setI(i + 1);
  }

  const answered: { step: number; label: string; value: string }[] = [];
  if (i > 0) answered.push({ step: 0, label: 'Where', value: d.destination });
  if (i > 1) answered.push({ step: 1, label: 'Budget', value: formatMoney(d.budget ?? 0, d.currency) });
  if (i > 2)
    answered.push({
      step: 2,
      label: 'When',
      value: d.earliest && d.latest ? `${formatDate(d.earliest)} – ${formatDate(d.latest, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Not sure yet',
    });

  return (
    <div className="page narrow wizard">
      <div className="wizard-top">
        <a className="crumb" href={href({ page: 'trips' })}>
          Cancel
        </a>
        <span className="wizard-count">
          Step {i + 1} of {NEW_TRIP_STEPS.length}
        </span>
      </div>
      <div className="wizard-progress" role="progressbar" aria-valuemin={1} aria-valuemax={NEW_TRIP_STEPS.length} aria-valuenow={i + 1} aria-label="New trip progress">
        {NEW_TRIP_STEPS.map((s, k) => (
          <span key={s} className={k <= i ? 'done' : ''} />
        ))}
      </div>

      {answered.length > 0 && (
        <ul className="wizard-answers">
          {answered.map((a) => (
            <li key={a.label}>
              <button type="button" onClick={() => setI(a.step)}>
                <span>{a.label}</span> {a.value}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="wizard-step" onSubmit={next} noValidate>
        <h1 ref={headingRef} tabIndex={-1}>
          {STEP_COPY[step].title}
        </h1>
        {STEP_COPY[step].hint && <p className="muted">{STEP_COPY[step].hint}</p>}

        {step === 'where' && (
          <div className="stack">
            <input className="input-lg" value={d.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="e.g. Guanacaste, Costa Rica" aria-label="Destination" autoFocus />
            <details className="more" open={Boolean(d.name || d.region)}>
              <summary>More details (optional)</summary>
              <div className="grid-2">
                <Field label="Trip name">
                  <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Pacific coast spring break" />
                </Field>
                <Field label="Wider region">
                  <input value={d.region} onChange={(e) => set({ region: e.target.value })} placeholder="e.g. Central America" />
                </Field>
              </div>
            </details>
          </div>
        )}

        {step === 'budget' && (
          <div className="budget-entry">
            <NumberInput value={d.budget} onChange={(v) => set({ budget: v })} step={100} placeholder="9000" aria-label="Total budget" />
            <input className="currency" value={d.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} maxLength={3} aria-label="Currency" />
          </div>
        )}

        {step === 'when' && (
          <div className="stack">
            <div className="grid-2">
              <Field label="Earliest day you can leave home">
                <input type="date" value={d.earliest} onChange={(e) => set({ earliest: e.target.value })} />
              </Field>
              <Field label="Latest day you must be back" hint={span !== null && span > 0 ? `${span} nights of availability` : undefined}>
                <input type="date" value={d.latest} min={d.earliest} onChange={(e) => set({ latest: e.target.value })} />
              </Field>
            </div>
            <details className="more" open={Boolean(d.minNights || d.prefNights || d.maxNights)}>
              <summary>Trip length (optional — ATLAS suggests one if blank)</summary>
              <div className="grid-3">
                <Field label="Shortest" hint="nights">
                  <NumberInput value={d.minNights} min={1} onChange={(v) => set({ minNights: v })} aria-label="Minimum nights" />
                </Field>
                <Field label="Ideal" hint="nights">
                  <NumberInput value={d.prefNights} min={1} onChange={(v) => set({ prefNights: v })} aria-label="Preferred nights" />
                </Field>
                <Field label="Longest" hint="nights">
                  <NumberInput value={d.maxNights} min={1} onChange={(v) => set({ maxNights: v })} aria-label="Maximum nights" />
                </Field>
              </div>
            </details>
            <div className="grid-2">
              <Field label="Flying from">
                <input value={d.airport} onChange={(e) => set({ airport: e.target.value.toUpperCase() })} placeholder="LAS" />
              </Field>
              <Field label="Anything else about timing?" hint="e.g. “must include Easter week”">
                <input value={d.flexibility} onChange={(e) => set({ flexibility: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {step === 'who' && (
          <div className="stack">
            {(p.defaultAdults !== d.adults || p.defaultChildren !== d.children) && (
              <button type="button" className="chip" onClick={() => set({ adults: p.defaultAdults, children: p.defaultChildren })}>
                Our usual {p.defaultAdults + p.defaultChildren}: {p.defaultAdults} adults, {p.defaultChildren} children
              </button>
            )}
            <div className="grid-3">
              <Field label="Adults">
                <NumberInput value={d.adults} min={1} onChange={(v) => set({ adults: v })} aria-label="Adults" />
              </Field>
              <Field label="Children">
                <NumberInput value={d.children} onChange={(v) => set({ children: v })} aria-label="Children" />
              </Field>
              <Field label="Children's ages">
                <input value={d.childAges} onChange={(e) => set({ childAges: e.target.value })} placeholder="e.g. 15, 17" />
              </Field>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <Banner tone="error">
            {errors.length === 1 ? (
              errors[0]
            ) : (
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </Banner>
        )}

        <div className="wizard-actions">
          {i > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setErrors([]);
                setI(i - 1);
              }}
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="actions">
            {step === 'when' && !d.earliest && !d.latest && (
              <button type="button" className="btn" onClick={() => setI(i + 1)}>
                Not sure yet
              </button>
            )}
            <button className="btn btn-primary" type="submit">
              {last ? 'Create trip →' : 'Next →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
