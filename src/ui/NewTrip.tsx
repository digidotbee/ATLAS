import { useState, type FormEvent } from 'react';
import { nightsBetween } from '../domain/budget';
import { createTrip } from '../domain/factory';
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
  const [earliest, setEarliest] = useState('');
  const [latest, setLatest] = useState('');
  const [minNights, setMinNights] = useState<number | null>(null);
  const [prefNights, setPrefNights] = useState<number | null>(null);
  const [maxNights, setMaxNights] = useState<number | null>(null);
  const [airport, setAirport] = useState(p.homeAirport);
  const [errors, setErrors] = useState<string[]>([]);
  const span = nightsBetween(earliest, latest);

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!destination.trim()) errs.push('Add a destination or region.');
    if (!budget || budget <= 0) errs.push('Set a total budget.');
    if (!adults || adults < 1) errs.push('At least one adult is needed.');
    if (!/^[A-Z]{3}$/.test(currency)) errs.push('Currency must be a 3-letter code such as USD or EUR.');
    if ((earliest || latest) && (span === null || span < 1)) errs.push('The latest return must be after the earliest departure.');
    if (minNights && maxNights && minNights > maxNights) errs.push('Shortest trip can’t be longer than the longest trip.');
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
      // Availability is never stored as trip dates; ATLAS finds the trip dates inside it.
      dateOptions: [],
    });
    if (earliest && latest) {
      trip.availability = { earliestDeparture: earliest, latestReturn: latest, preferredRanges: [], excludedRanges: [] };
    }
    trip.constraints = { departureAirport: airport.trim().toUpperCase(), minNights, preferredNights: prefNights, maxNights };
    addTrip(trip);
    go({ page: 'trip', id: trip.id, tab: earliest && latest ? 'dates' : 'plan' });
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
            <span className="step">4</span> When could you travel?
          </legend>
          <p className="muted small">
            Your <strong>availability</strong>, not the trip dates. ATLAS will find the best dates and trip length inside it that fit your budget.
          </p>
          <div className="grid-2">
            <Field label="Earliest day you can leave home">
              <input type="date" value={earliest} onChange={(e) => setEarliest(e.target.value)} />
            </Field>
            <Field label="Latest day you must be back" hint={span !== null && span > 0 ? `${span} nights of availability` : undefined}>
              <input type="date" value={latest} min={earliest} onChange={(e) => setLatest(e.target.value)} />
            </Field>
          </div>
          <div className="grid-4">
            <Field label="Shortest trip" hint="nights · optional">
              <NumberInput value={minNights} min={1} onChange={setMinNights} aria-label="Minimum nights" />
            </Field>
            <Field label="Ideal trip" hint="nights · optional">
              <NumberInput value={prefNights} min={1} onChange={setPrefNights} aria-label="Preferred nights" />
            </Field>
            <Field label="Longest trip" hint="nights · optional">
              <NumberInput value={maxNights} min={1} onChange={setMaxNights} aria-label="Maximum nights" />
            </Field>
            <Field label="Departure airport">
              <input value={airport} onChange={(e) => setAirport(e.target.value.toUpperCase())} placeholder="LAS" />
            </Field>
          </div>
          <p className="small muted">Leave trip length blank and ATLAS will suggest realistic lengths for your budget.</p>
          <Field label="Anything else about timing?" hint="e.g. “must include Easter week”, “avoid school exams”.">
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
