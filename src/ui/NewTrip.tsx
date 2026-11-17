import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatMoney, nightsBetween } from '../domain/budget';
import { createTrip } from '../domain/factory';
import { budgetTotalForEntry, NEW_TRIP_STEPS, preferredNightsForDuration, stepErrors, type BudgetMode, type NewTripDraft, type NewTripStep } from '../domain/newTrip';
import { useStore } from '../state/store';
import { Banner, Field, formatDate, formatDateTimeLocal, NumberInput, todayISO } from './common';
import { CalendarPicker } from './CalendarPicker';
import { go, href } from './router';

const STEP_COPY: Record<NewTripStep, { title: string; hint: string }> = {
  where: {
    title: 'Where does this venture begin?',
    hint: 'Name a city, a trailhead, a favorite restaurant, or a vibe you want to explore.',
  },
  budget: {
    title: 'What’s the budget?',
    hint: 'A rough target to keep everyone aligned — from food and tickets to travel, stays, and a little cushion for surprises.',
  },
  when: { title: 'When is this happening?', hint: 'Lock in a set date and time now, or open a window for your crew to weigh in.' },
  who: { title: 'Who’s coming?', hint: '' },
};

export function NewTrip() {
  const { data, addTrip } = useStore();
  const p = data.profile;
  const today = todayISO();
  const [d, setD] = useState<NewTripDraft>({
    destination: '',
    name: '',
    region: '',
    budget: null,
    budgetSkipped: false,
    currency: p.defaultCurrency,
    whenMode: 'date',
    date: today,
    endDate: '',
    startTime: '',
    endTime: '',
    singleDay: true,
    earliest: today,
    latest: '',
    optInBy: '',
    idealDuration: '',
    airport: p.homeAirport,
    flexibility: '',
    adults: p.defaultAdults,
    children: p.defaultChildren,
    childAges: '',
  });
  const [i, setI] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('total');
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
    const dateOptions =
      d.whenMode === 'date' && d.date
        ? [
            {
              label: d.name || d.destination,
              start: d.date,
              end: d.singleDay ? d.date : d.endDate,
              startTime: d.startTime || undefined,
              endTime: d.endTime || undefined,
              flightPerPerson: null,
              flightStatus: 'estimated' as const,
              notes: '',
            },
          ]
        : [];
    const trip = createTrip({
      name: d.name,
      destination: d.destination,
      region: d.region,
      currency: d.currency,
      budgetTotal: budgetTotalForEntry(d.budget, budgetMode, d.adults!, d.children ?? 0),
      adults: d.adults!,
      children: d.children ?? 0,
      childAges: d.childAges,
      flexibility: d.whenMode === 'decision' ? d.flexibility : '',
      dateOptions,
    });
    if (d.whenMode === 'decision' && d.earliest && d.latest) {
      trip.availability = {
        earliestDeparture: d.earliest,
        latestReturn: d.latest,
        preferredRanges: [],
        excludedRanges: [],
        optInBy: d.optInBy,
        idealDuration: d.idealDuration.trim() || undefined,
      };
    }
    trip.constraints = {
      departureAirport: d.whenMode === 'decision' ? d.airport.trim().toUpperCase() : '',
      minNights: null,
      preferredNights: d.whenMode === 'decision' ? preferredNightsForDuration(d.idealDuration) : null,
      maxNights: null,
    };
    addTrip(trip);
    // Fixed dates go straight to the itinerary; date-decision windows go to date planning.
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
  if (i > 0 && step !== 'budget' && step !== 'when') answered.push({ step: 0, label: 'Where', value: d.destination });
  if (i > 1 && step !== 'when')
    answered.push({
      step: 1,
      label: 'Budget',
      value: d.budgetSkipped ? 'No target set' : `${formatMoney(d.budget ?? 0, d.currency)}${budgetMode === 'perPerson' ? ' per person' : ''}`,
    });
  if (i > 2)
    answered.push({
      step: 2,
      label: 'When',
      value:
        d.whenMode === 'date' && d.date
          ? `${formatDate(d.date, { month: 'short', day: 'numeric', year: 'numeric' })}${d.startTime ? ` · ${d.startTime}` : ''}`
          : d.whenMode === 'decision' && d.earliest && d.latest
            ? `${formatDate(d.earliest)} – ${formatDate(d.latest, { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Dates not set',
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

      <form className={`wizard-step ${step === 'when' ? 'when-wizard-step' : ''}`} onSubmit={next} noValidate>
        {step === 'budget' && <p className="wizard-context">WHERE • {d.destination}</p>}
        {step === 'when' && (
          <div className="wizard-contexts">
            <p className="wizard-context">WHERE • {d.destination}</p>
            <p className="wizard-context">
              BUDGET • {d.budgetSkipped ? 'No target set' : `${formatMoney(d.budget ?? 0, d.currency)}${budgetMode === 'perPerson' ? ' per person' : ''}`}
            </p>
          </div>
        )}
        <h1 ref={headingRef} tabIndex={-1}>
          {STEP_COPY[step].title}
        </h1>
        {STEP_COPY[step].hint && <p className="muted">{STEP_COPY[step].hint}</p>}

        {step === 'where' && (
          <div className="stack">
            <input className="input-lg" value={d.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Destination or setting..." aria-label="Destination" autoFocus />
            <details className="more" open={Boolean(d.name || d.region)}>
              <summary>Fine-tune the details (optional)</summary>
              <div className="grid-2">
                <Field label="Name this venture">
                  <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Pacific coast spring break" />
                </Field>
                <Field label="General area or neighborhood">
                  <input value={d.region} onChange={(e) => set({ region: e.target.value })} placeholder="e.g. Central America" />
                </Field>
              </div>
            </details>
          </div>
        )}

        {step === 'budget' && (
          <div className="stack">
            <div className="segmented budget-toggle" role="group" aria-label="Budget type">
              <button
                type="button"
                className={budgetMode === 'total' ? 'on' : ''}
                aria-pressed={budgetMode === 'total'}
                onClick={() => {
                  setBudgetMode('total');
                  set({ budgetSkipped: false });
                }}
              >
                Total (Everything included)
              </button>
              <button
                type="button"
                className={budgetMode === 'perPerson' ? 'on' : ''}
                aria-pressed={budgetMode === 'perPerson'}
                onClick={() => {
                  setBudgetMode('perPerson');
                  set({ budgetSkipped: false });
                }}
              >
                Per person
              </button>
            </div>
            <div className="budget-entry">
              <NumberInput
                value={d.budget}
                onChange={(v) => set({ budget: v, budgetSkipped: false })}
                step={100}
                placeholder="$ 0"
                aria-label={budgetMode === 'total' ? 'Total budget' : 'Budget per person'}
              />
              <input className="currency" value={d.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} maxLength={3} aria-label="Currency" />
            </div>
            <p className="budget-helper">
              {budgetMode === 'total'
                ? 'Covers the whole venture across everyone joining.'
                : 'Target spend for each individual collaborator.'}
            </p>
            <button type="button" className="wizard-skip" aria-pressed={d.budgetSkipped} onClick={() => set({ budget: null, budgetSkipped: true })}>
              Skip for now — we'll figure it out as we go
            </button>
          </div>
        )}

        {step === 'when' && (
          <div className="stack when-step">
            <div className="segmented budget-toggle when-toggle" role="group" aria-label="Date planning mode">
              <button type="button" className={d.whenMode === 'date' ? 'on' : ''} aria-pressed={d.whenMode === 'date'} onClick={() => set({ whenMode: 'date' })}>
                SET A DATE
              </button>
              <button type="button" className={d.whenMode === 'decision' ? 'on' : ''} aria-pressed={d.whenMode === 'decision'} onClick={() => set({ whenMode: 'decision' })}>
                SET FOR DATE DECISION
              </button>
            </div>
            {d.whenMode === 'date' ? (
              <div className="stack when-mode-content">
                <label className="single-day-checkbox">
                  <input
                    type="checkbox"
                    checked={d.singleDay}
                    onChange={(e) => set(e.target.checked ? { singleDay: true, endDate: '' } : { singleDay: false })}
                  />
                  <span>Single day / evening</span>
                </label>
                <CalendarPicker
                  label="Venture dates"
                  mode={d.singleDay ? 'single' : 'range'}
                  start={d.date}
                  end={d.endDate}
                  startLabel="Start date"
                  endLabel="End date"
                  onChange={(date, end = '') => set(d.singleDay ? { date } : { date, endDate: end })}
                />
                <div className="grid-2 when-time-row">
                  <Field label="Start time (optional)">
                    <input type="time" value={d.startTime} onChange={(e) => set({ startTime: e.target.value })} />
                  </Field>
                  <Field label="End time (optional)">
                    <input type="time" value={d.endTime} onChange={(e) => set({ endTime: e.target.value })} />
                  </Field>
                </div>
                <p className="muted small when-helper">Invitees will go straight into the shared itinerary once created.</p>
              </div>
            ) : (
              <div className="stack when-mode-content">
                <h2>What’s the possible window?</h2>
                <CalendarPicker
                  label="Possible date window"
                  mode="range"
                  start={d.earliest}
                  end={d.latest}
                  startLabel="Earliest start"
                  endLabel="Latest wrap-up"
                  onChange={(earliest, latest = '') => set({ earliest, latest })}
                />
                {span !== null && span > 0 && <p className="availability-pill">{span} nights to choose from</p>}
                <Field label="Ideal length (optional)" hint="e.g., 3 hours, 1 weekend, or 5 days — ORIVOIR finds the sweet spot.">
                  <input value={d.idealDuration} onChange={(e) => set({ idealDuration: e.target.value })} placeholder="How long would feel right?" />
                </Field>
                <Field label="Opt in by">
                  <input type="datetime-local" value={d.optInBy} onChange={(e) => set({ optInBy: e.target.value })} />
                  <span className="field-hint">Collaborators must submit their availability before this cutoff to join the planning crew.</span>
                </Field>
                <Field label="Any timing notes? (optional)" hint="e.g., “Evenings work best” or “Must include Sunday brunch”">
                  <input value={d.flexibility} onChange={(e) => set({ flexibility: e.target.value })} />
                </Field>
                <details className="more">
                  <summary>+ Add departure city / flight info (optional)</summary>
                  <Field label="Departing from">
                    <input value={d.airport} onChange={(e) => set({ airport: e.target.value.toUpperCase() })} placeholder="City or airport (e.g., LAS)" />
                  </Field>
                </details>
              </div>
            )}
          </div>
        )}

        {step === 'who' && (
          <div className="stack">
            {d.whenMode === 'decision' && d.earliest && d.latest && d.optInBy && (
              <section className="card invite-preview" aria-label="Invite card preview">
                <p className="eyebrow">Invite card preview</p>
                <h2>Let’s have an adventure...</h2>
                <p>
                  {d.destination} · {formatDate(d.earliest)} – {formatDate(d.latest, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p>
                  <strong>Budget:</strong>{' '}
                  {d.budgetSkipped ? 'No target set' : `${formatMoney(d.budget ?? 0, d.currency)}${budgetMode === 'perPerson' ? ' per person' : ''}`}
                  {d.idealDuration.trim() && ` · ${d.idealDuration}`}
                </p>
                <p>
                  <strong>Opt in by:</strong> {formatDateTimeLocal(d.optInBy)}
                </p>
              </section>
            )}
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
            <button className={`btn btn-primary ${last ? '' : 'wizard-next'}`} type="submit">
              {last ? 'Create trip →' : 'Next →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
