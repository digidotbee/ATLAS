import { useState, type FormEvent } from 'react';
import { nightsBetween } from '../domain/budget';
import { blankDateOption, createTrip } from '../domain/factory';
import type { DateOption } from '../domain/types';
import { useStore } from '../state/store';
import { Banner, Field, NumberInput } from './common';
import { go } from './router';

export function NewTrip() {
  const { data, addTrip } = useStore();
  const p = data.profile;
  const [destination, setDestination] = useState('');
  const [region, setRegion] = useState('');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<number | null>(null);
  const [currency, setCurrency] = useState(p.defaultCurrency);
  const [adults, setAdults] = useState<number | null>(p.defaultAdults);
  const [children, setChildren] = useState<number | null>(p.defaultChildren);
  const [childAges, setChildAges] = useState('');
  const [flexibility, setFlexibility] = useState('');
  const [dates, setDates] = useState<DateOption[]>([blankDateOption()]);
  const [errors, setErrors] = useState<string[]>([]);

  const setDate = (id: string, patch: Partial<DateOption>) =>
    setDates((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!destination.trim()) errs.push('Add a destination or region.');
    if (!budget || budget <= 0) errs.push('Set a total budget.');
    if (!adults || adults < 1) errs.push('At least one adult is needed.');
    if (!/^[A-Z]{3}$/.test(currency)) errs.push('Currency must be a 3-letter code such as USD or EUR.');
    const filled = dates.filter((d) => d.start || d.end);
    filled.forEach((d, i) => {
      if (nightsBetween(d.start, d.end) === null) errs.push(`Date option ${i + 1}: end date must be on or after the start date.`);
    });
    setErrors(errs);
    if (errs.length) return;
    const trip = createTrip({
      name,
      destination,
      region,
      currency,
      budgetTotal: budget!,
      adults: adults!,
      children: children ?? 0,
      childAges,
      flexibility,
      dateOptions: filled.map(({ id: _id, ...rest }, i) => ({ ...rest, label: rest.label || `Option ${String.fromCharCode(65 + i)}` })),
    });
    addTrip(trip);
    go({ page: 'trip', id: trip.id, tab: 'plan' });
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">New trip</p>
      <h1>Four things to begin</h1>
      <p className="lede">You can change any of this later.</p>
      <form className="stack-lg" onSubmit={submit} noValidate>
        <fieldset className="card">
          <legend>
            <span className="step">1</span> Where
          </legend>
          <div className="grid-2">
            <Field label="Destination or region" hint="A country, region, town — or a broad idea like “Atlantic coast of Portugal”.">
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Guanacaste, Costa Rica" autoFocus />
            </Field>
            <Field label="Wider region (optional)">
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Central America" />
            </Field>
          </div>
          <Field label="Trip name (optional)">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pacific coast spring break" />
          </Field>
        </fieldset>

        <fieldset className="card">
          <legend>
            <span className="step">2</span> Total budget
          </legend>
          <p className="muted small">Everything included: flights, places to stay, getting around, food, experiences and a cushion for surprises.</p>
          <div className="grid-2">
            <Field label="Total budget">
              <NumberInput value={budget} onChange={setBudget} step={100} placeholder="9000" aria-label="Total budget" />
            </Field>
            <Field label="Currency">
              <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>
            <span className="step">3</span> Travelers
          </legend>
          <div className="grid-3">
            <Field label="Adults">
              <NumberInput value={adults} onChange={setAdults} min={1} aria-label="Adults" />
            </Field>
            <Field label="Children">
              <NumberInput value={children} onChange={setChildren} aria-label="Children" />
            </Field>
            <Field label="Children's ages">
              <input value={childAges} onChange={(e) => setChildAges(e.target.value)} placeholder="e.g. 9, 12" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>
            <span className="step">4</span> Flexible dates
          </legend>
          <p className="muted small">Add one or more possible date ranges. You'll compare their costs later.</p>
          {dates.map((d, i) => (
            <div key={d.id} className="date-row">
              <Field label={`Option ${String.fromCharCode(65 + i)} label`}>
                <input value={d.label} onChange={(e) => setDate(d.id, { label: e.target.value })} placeholder="e.g. Spring break" />
              </Field>
              <Field label="From">
                <input type="date" value={d.start} onChange={(e) => setDate(d.id, { start: e.target.value })} />
              </Field>
              <Field label="To">
                <input type="date" value={d.end} min={d.start} onChange={(e) => setDate(d.id, { end: e.target.value })} />
              </Field>
              {dates.length > 1 && (
                <button type="button" className="btn btn-ghost" onClick={() => setDates((ds) => ds.filter((x) => x.id !== d.id))} aria-label="Remove date option">
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setDates((ds) => [...ds, blankDateOption()])}>
            + Another date option
          </button>
          <Field label="How flexible are you?" hint="e.g. “any 8–10 nights in March”, “must include Easter week”.">
            <input value={flexibility} onChange={(e) => setFlexibility(e.target.value)} />
          </Field>
        </fieldset>

        {errors.length > 0 && (
          <Banner tone="error">
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Banner>
        )}
        <div className="actions">
          <button className="btn btn-primary btn-lg" type="submit">
            Create trip →
          </button>
        </div>
      </form>
    </div>
  );
}
