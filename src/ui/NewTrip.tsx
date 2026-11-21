import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatMoney, nightsBetween } from '../domain/budget';
import { createTrip } from '../domain/factory';
import { budgetTotalForEntry, CURRENCY_CODE, NEW_TRIP_STEPS, optInDeadlineAfter, preferredNightsForDuration, stepErrors, type BudgetMode, type NewTripDraft, type NewTripStep } from '../domain/newTrip';
import { useStore } from '../state/store';
import { Banner, Field, formatDateTimeLocal, formatLocalTime, NumberInput, todayISO } from './common';
import { CalendarPicker } from './CalendarPicker';
import { go, href } from './router';

const STEP_COPY: Record<NewTripStep, { title: string; hint: string }> = {
  where: {
    title: 'Set the Scene',
    hint: 'Where does this Venture begin? Enter a destination, a spot, or a vibe.',
  },
  when: { title: 'Schedule', hint: 'Set a date or give your Crew a window to choose from.' },
  who: { title: 'Crew', hint: 'Include yourself and everyone you expect in the planning headcount.' },
  budget: {
    title: 'Budget & Launch',
    hint: 'Set a spending target or skip it, then review your invite.',
  },
};

function scheduleSummary(draft: NewTripDraft): string {
  if (draft.whenMode === 'decision') {
    return `${formatDateTimeLocal(draft.earliest)} – ${formatDateTimeLocal(draft.latest)}`;
  }
  const start = formatDateTimeLocal(`${draft.date}T${draft.startTime}`);
  if (!draft.singleDay) return `${start} – ${formatDateTimeLocal(`${draft.endDate}T${draft.endTime}`)}`;
  if (!draft.endTime) return start;
  return `${start} ${draft.startTime ? '–' : 'until'} ${formatLocalTime(draft.endTime)}`;
}

export function NewTrip() {
  const { data, addTrip } = useStore();
  const p = data.profile;
  const defaultCurrency = CURRENCY_CODE.test(p.defaultCurrency) ? p.defaultCurrency : 'USD';
  const today = todayISO();
  const [d, setD] = useState<NewTripDraft>({
    destination: '',
    name: '',
    region: '',
    budget: null,
    budgetSkipped: false,
    currency: defaultCurrency,
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
  const [step, setStep] = useState<NewTripStep>(NEW_TRIP_STEPS[0]);
  const [errors, setErrors] = useState<string[]>([]);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('total');
  const stepIndex = NEW_TRIP_STEPS.indexOf(step);
  const completedSteps = NEW_TRIP_STEPS.slice(0, stepIndex);
  const set = (patch: Partial<NewTripDraft>) => {
    setD((x) => ({ ...x, ...patch }));
    setErrors([]); // a correction clears the old message
  };
  const span = nightsBetween(d.earliest, d.latest);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function visit(target: NewTripStep) {
    setErrors([]);
    setStep(target);
  }

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
      budgetBasis: budgetMode,
      budgetPerPerson: budgetMode === 'perPerson' ? d.budget : undefined,
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
    if (errs.length) {
      setErrors(errs);
      return;
    }
    if (step === 'budget') create();
    else visit(NEW_TRIP_STEPS[stepIndex + 1]);
  }

  function skipBudget() {
    set({
      budget: null,
      budgetSkipped: true,
      currency: CURRENCY_CODE.test(d.currency) ? d.currency : defaultCurrency,
    });
  }

  const people = (d.adults ?? 0) + (d.children ?? 0);
  const summaries: Record<NewTripStep, string> = {
    where: d.destination.trim(),
    when: scheduleSummary(d),
    who: `${people} ${people === 1 ? 'person' : 'people'}`,
    budget: d.budget === null
      ? 'No target set'
      : `${formatMoney(d.budget, d.currency, 20)} ${budgetMode === 'perPerson' ? 'per person' : 'total'}`,
  };

  return (
    <div className="page narrow wizard">
      <div className="wizard-top">
        <a className="crumb" href={href({ page: 'trips' })}>
          Cancel
        </a>
        <span className="wizard-count">
          Step {stepIndex + 1} of {NEW_TRIP_STEPS.length}
        </span>
      </div>
      <div className="wizard-progress" role="progressbar" aria-valuemin={1} aria-valuemax={NEW_TRIP_STEPS.length} aria-valuenow={stepIndex + 1} aria-valuetext={STEP_COPY[step].title} aria-label="Venture creation progress">
        {NEW_TRIP_STEPS.map((s, k) => (
          <span key={s} className={k <= stepIndex ? 'done' : ''} />
        ))}
      </div>

      {completedSteps.length > 0 && (
        <ul className="wizard-answers">
          {completedSteps.map((completed) => (
            <li key={completed}>
              <button
                type="button"
                aria-label={`Edit ${STEP_COPY[completed].title}`}
                aria-description={step === 'budget' ? undefined : summaries[completed]}
                onClick={() => visit(completed)}
              >
                <span>{step === 'budget' ? 'Edit ' : ''}{STEP_COPY[completed].title}</span>
                {step !== 'budget' && summaries[completed]}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={`wizard-step ${step === 'when' ? 'when-wizard-step' : ''}`} onSubmit={next} noValidate>
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
                <Field label="Name this Venture">
                  <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Pacific coast spring break" />
                </Field>
                <Field label="General area or neighborhood">
                  <input value={d.region} onChange={(e) => set({ region: e.target.value })} placeholder="e.g. Central America" />
                </Field>
              </div>
            </details>
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
                  showLabel={false}
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
                <p className="muted small when-helper">Your Venture will open in planning with these dates.</p>
              </div>
            ) : (
              <div className="stack when-mode-content">
                <h2>What’s the possible window?</h2>
                <CalendarPicker
                  label="Possible date window"
                  showLabel={false}
                  mode="range"
                  start={d.earliest}
                  end={d.latest}
                  startLabel="Earliest start"
                  endLabel="Latest wrap-up"
                  onChange={(earliest, latest = '') => set({ earliest, latest })}
                />
                {span !== null && span > 0 && <p className="availability-pill">{span} nights to choose from</p>}
                <Field label="Ideal length (optional)" hint="For example, 3 hours, a weekend, or 5 days.">
                  <input value={d.idealDuration} onChange={(e) => set({ idealDuration: e.target.value })} placeholder="How long would feel right?" />
                </Field>
                <Field label="Opt in by">
                  <input type="datetime-local" value={d.optInBy} onChange={(e) => set({ optInBy: e.target.value })} />
                </Field>
                <div className="chips" role="group" aria-label="Deadline shortcuts">
                  <button type="button" className="chip" onClick={() => set({ optInBy: optInDeadlineAfter(24) })}>In 24 hours</button>
                  <button type="button" className="chip" onClick={() => set({ optInBy: optInDeadlineAfter(72) })}>In 3 days</button>
                </div>
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
            <p className="budget-helper">Planning headcount · {summaries.who}</p>
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
              <input className="currency" value={d.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase(), budgetSkipped: false })} maxLength={3} aria-label="Currency" />
            </div>
            <p className="budget-helper">
              {budgetMode === 'total'
                ? 'Covers the whole Venture.'
                : 'Target spend for each person in the Crew.'}
            </p>
            <button type="button" className="wizard-skip" aria-pressed={d.budgetSkipped} onClick={skipBudget}>
              Skip for now
            </button>
            <section className="card invite-preview" aria-label="Invite card preview">
              <p className="eyebrow">Invite card preview</p>
              <h2>{d.name.trim() || 'Let’s have an adventure…'}</h2>
              <p>{[summaries.where, d.region.trim()].filter(Boolean).join(' · ')}</p>
              <p>{summaries.when}</p>
              {d.whenMode === 'decision' && (
                <>
                  {d.idealDuration.trim() && <p>Ideal length · {d.idealDuration.trim()}</p>}
                  <p><strong>Opt in by</strong> {formatDateTimeLocal(d.optInBy)}</p>
                </>
              )}
              <p>Planning headcount · {summaries.who}</p>
              <p>Budget · {summaries.budget}</p>
            </section>
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
          {stepIndex > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => visit(NEW_TRIP_STEPS[stepIndex - 1])}
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="actions">
            <button className={`btn btn-primary ${step === 'budget' ? '' : 'wizard-next'}`} type="submit">
              {step === 'budget' ? 'Launch Venture' : 'Next →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
