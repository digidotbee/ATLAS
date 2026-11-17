import { useState } from 'react';
import { chosenDate, formatMoney, nightsBetween, travelerCount } from '../domain/budget';
import { blankDateOption } from '../domain/factory';
import { buildAssumptionsPrompt, buildWindowFarePrompt, parseImportedAssumptions } from '../domain/research';
import type { Availability, CandidateTravelWindow, DateRange, PlanningAssumptions, ScoringWeights, TripConstraints } from '../domain/types';
import {
  blankAssumptions,
  DEFAULT_WEIGHTS,
  departureMonths,
  evaluateWindow,
  FULL_VACATION_NIGHTS,
  generateWindows,
  lockWindow,
  missingInputs,
  setWindowStatus,
  type GenerateResult,
} from '../domain/windows';
import { useStore } from '../state/store';
import { Banner, Field, formatDate, formatDateTimeLocal, formatLocalTime, Money, NumberInput, PriceBadge } from './common';
import { CalendarPicker } from './CalendarPicker';
import { href } from './router';
import type { TabProps } from './TripView';

const fmt = (iso: string) => formatDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });

export function DatesTab({ trip, update }: TabProps) {
  const { data } = useStore();
  const av: Availability = trip.availability ?? { earliestDeparture: '', latestReturn: '', preferredRanges: [], excludedRanges: [] };
  const cons: TripConstraints = trip.constraints ?? { departureAirport: data.profile.homeAirport, minNights: null, preferredNights: null, maxNights: null };
  const setAv = (p: Partial<Availability>) => update((t) => ({ ...t, availability: { ...av, ...p } }));
  const setCons = (p: Partial<TripConstraints>) => update((t) => ({ ...t, constraints: { ...cons, ...p } }));
  const span = nightsBetween(av.earliestDeparture, av.latestReturn);
  const locked = chosenDate(trip);
  const lockedNights = locked ? nightsBetween(locked.start, locked.end) : null;
  const legacy = trip.dateOptions.filter((d) => d.legacyAvailability);

  return (
    <div className="stack">
      <div className="intro">
        <h2>When & how long</h2>
        <p className="muted">
          Tell ORIVOIR when you <em>could</em> travel. It finds the vacation windows — dates and trip length — that fit your budget. Nothing is
          costed over your whole availability.
        </p>
      </div>

      {legacy.length > 0 && (
        <Banner tone="info">
          Your earlier date range ({legacy.map((d) => `${formatDate(d.start)} – ${formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}`).join(', ')}) is
          now treated as your <strong>availability</strong>, not a {nightsBetween(legacy[0].start, legacy[0].end)}-night trip. Costs based on it have been
          cleared; nothing was deleted.
        </Banner>
      )}

      {locked && (
        <div className="card locked-card">
          <p className="eyebrow">Trip dates in use</p>
          <h3>
            {formatDate(locked.start, { weekday: 'short', month: 'long', day: 'numeric' })}
            {locked.end !== locked.start && ` – ${formatDate(locked.end, { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {locked.startTime && ` · ${formatLocalTime(locked.startTime)}`}
            {locked.endTime && `–${formatLocalTime(locked.endTime)}`}
            {lockedNights !== null && lockedNights > 0 && ` · ${lockedNights} nights`}
          </h3>
          <p className="muted small">{locked.notes}</p>
          <div className="actions">
            <a className="btn btn-primary btn-small" href={href({ page: 'trip', id: trip.id, tab: 'explore' })}>
              Plan stays & experiences →
            </a>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => update((t) => (locked.fromWindowId ? setWindowStatus(t, locked.fromWindowId, 'kept') : { ...t, chosenDateId: null }))}>
              Unlock these dates
            </button>
          </div>
        </div>
      )}

      <AvailabilityCard trip={trip} update={update} av={av} cons={cons} setAv={setAv} setCons={setCons} span={span} />

      <EstimatesCard trip={trip} update={update} />

      {/* 3. Windows */}
      <WindowsCard trip={trip} update={update} />

      <details className="card">
        <summary>Already know your exact dates? Enter them directly</summary>
        <ManualDates trip={trip} update={update} />
      </details>
    </div>
  );
}

function RangeList({ label, ranges, onChange }: { label: string; ranges: DateRange[]; onChange: (r: DateRange[]) => void }) {
  return (
    <div className="stack-sm">
      <span className="field-label">{label}</span>
      {ranges.map((r, i) => (
        <div key={i} className="range-calendar-row">
          <CalendarPicker
            label={`${label} ${i + 1}`}
            mode="range"
            start={r.start}
            end={r.end}
            onChange={(start, end = '') => onChange(ranges.map((x, j) => (j === i ? { start, end } : x)))}
          />
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange(ranges.filter((_, j) => j !== i))} aria-label="Remove">
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange([...ranges, { start: '', end: '' }])}>
        + Add
      </button>
    </div>
  );
}

function StageHead({ n, title, done, children }: { n: number; title: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="stage-head">
      <span className={`stage-num ${done ? 'done' : ''}`} aria-hidden="true">
        {done ? '✓' : n}
      </span>
      <h3>{title}</h3>
      <span className="stage-actions">{children}</span>
    </div>
  );
}

function AvailabilityCard({
  av,
  cons,
  setAv,
  setCons,
  span,
}: TabProps & {
  av: Availability;
  cons: TripConstraints;
  setAv: (p: Partial<Availability>) => void;
  setCons: (p: Partial<TripConstraints>) => void;
  span: number | null;
}) {
  const done = span !== null && span > 0;
  const [editing, setEditing] = useState(!done);
  const lengthText =
    cons.minNights || cons.maxNights || cons.preferredNights
      ? [
          cons.minNights || cons.maxNights ? `${cons.minNights ?? 1}–${cons.maxNights ?? 'any'} nights` : '',
          cons.preferredNights ? `ideally ${cons.preferredNights}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : 'any length — ORIVOIR suggests';
  return (
    <section className="card stage">
      <StageHead n={1} title="When you could travel" done={done && !editing}>
        {done && !editing && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </StageHead>
      {done && !editing ? (
        <dl className="summary">
          <div>
            <dt>Leave on or after</dt>
            <dd>{fmt(av.earliestDeparture)}</dd>
          </div>
          <div>
            <dt>Back by</dt>
            <dd>{fmt(av.latestReturn)}</dd>
          </div>
          <div>
            <dt>Trip length</dt>
            <dd>{lengthText}</dd>
          </div>
          {av.idealDuration && (
            <div>
              <dt>Ideal length</dt>
              <dd>{av.idealDuration}</dd>
            </div>
          )}
          {av.optInBy && (
            <div>
              <dt>Opt in by</dt>
              <dd>{formatDateTimeLocal(av.optInBy)}</dd>
            </div>
          )}
          <div>
            <dt>Flying from</dt>
            <dd>{cons.departureAirport || '—'}</dd>
          </div>
          <p className="summary-note">
            {span} nights to choose from — ORIVOIR looks for the best trip <em>inside</em> this range.
          </p>
        </dl>
      ) : (
        <div className="stack-sm">
          <CalendarPicker
            label="Possible date window"
            mode="range"
            start={av.earliestDeparture}
            end={av.latestReturn}
            startLabel="Earliest start"
            endLabel="Latest wrap-up"
            onChange={(earliestDeparture, latestReturn = '') => setAv({ earliestDeparture, latestReturn })}
          />
          <Field label="Ideal length (optional)">
            <input value={av.idealDuration ?? ''} onChange={(e) => setAv({ idealDuration: e.target.value })} placeholder="e.g., 3 hours, 1 weekend, or 5 days" />
          </Field>
          <Field label="Opt in by">
            <input type="datetime-local" value={av.optInBy ?? ''} onChange={(e) => setAv({ optInBy: e.target.value })} />
            <span className="field-hint">Collaborators must submit their availability before this cutoff to join the planning crew.</span>
          </Field>
          {span !== null && span > 0 && (
            <p className="availability-pill">
              {span} nights to choose from — ORIVOIR looks for the best trip <em>inside</em> this range, not a {span}-night trip.
            </p>
          )}
          <Field label="Departing from">
            <input value={cons.departureAirport} onChange={(e) => setCons({ departureAirport: e.target.value.toUpperCase() })} placeholder="LAS" />
          </Field>
          <details className="more" open={Boolean(cons.minNights || cons.maxNights || cons.preferredNights)}>
            <summary>Trip length (optional)</summary>
            <div className="grid-3">
              <Field label="Shortest" hint="nights">
                <NumberInput value={cons.minNights} min={1} onChange={(v) => setCons({ minNights: v })} aria-label="Minimum nights" />
              </Field>
              <Field label="Ideal" hint="nights">
                <NumberInput value={cons.preferredNights} min={1} onChange={(v) => setCons({ preferredNights: v })} aria-label="Preferred nights" />
              </Field>
              <Field label="Longest" hint="nights">
                <NumberInput value={cons.maxNights} min={1} onChange={(v) => setCons({ maxNights: v })} aria-label="Maximum nights" />
              </Field>
            </div>
          </details>
          <details className="more" open={av.preferredRanges.length + av.excludedRanges.length > 0}>
            <summary>Preferred or blocked dates (optional)</summary>
            <div className="stack-sm">
              <RangeList label="Preferred dates" ranges={av.preferredRanges} onChange={(r) => setAv({ preferredRanges: r })} />
              <RangeList label="Dates you can't travel" ranges={av.excludedRanges} onChange={(r) => setAv({ excludedRanges: r })} />
            </div>
          </details>
          {done && (
            <div className="actions">
              <button type="button" className="btn btn-primary btn-small" onClick={() => setEditing(false)}>
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Same day / next day choice for flight timing. */
function DayOffset({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {[0, 1].map((v) => (
          <button type="button" key={v} className={value === v ? 'on' : ''} aria-pressed={value === v} onClick={() => onChange(v)}>
            {v === 0 ? 'Same day' : 'Next day'}
          </button>
        ))}
      </div>
    </div>
  );
}

function EstimatesCard({ trip, update }: TabProps) {
  const { data, saveClimate } = useStore();
  const a = trip.assumptions ?? blankAssumptions();
  const setA = (p: Partial<PlanningAssumptions>) => update((t) => ({ ...t, assumptions: { ...(t.assumptions ?? blankAssumptions()), ...p, origin: p.origin ?? 'manual' } }));
  const av = trip.availability;
  const months = av ? departureMonths(av.earliestDeparture, av.latestReturn) : [];
  const climateMonths = [...new Set(months.map((m) => m.slice(5, 7)))];
  const cached = data.climateCache?.[trip.destination.trim().toLowerCase()];
  const missing = missingInputs(trip).filter((m) => !m.startsWith('Earliest departure'));
  const ready = Boolean(av) && missing.length === 0;
  const [mode, setMode] = useState<'view' | 'assistant' | 'edit'>(ready ? 'view' : 'assistant');
  const [pasted, setPasted] = useState('');
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string; list?: string[] } | null>(null);
  const [copyMsg, setCopyMsg] = useState('');
  const prompt = buildAssumptionsPrompt(trip, data.profile);
  const cur = trip.currency;
  const money = (n: number | null) => (n === null ? '—' : formatMoney(n, cur));
  const fares = months.map((m) => a.airfarePerPersonByMonth[m]).filter((v): v is number => v > 0);

  if (!av) {
    return (
      <section className="card stage disabled">
        <StageHead n={2} title="Typical costs & weather" done={false} />
        <p className="muted small">Add when you could travel first.</p>
      </section>
    );
  }

  return (
    <section className="card stage">
      <StageHead n={2} title="Typical costs & weather" done={ready && mode === 'view'}>
        {mode === 'view' && (
          <>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setMode('edit')}>
              Edit
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setMode('assistant')}>
              Refresh
            </button>
          </>
        )}
      </StageHead>

      {mode === 'assistant' && (
        <div className="stack-sm">
          <p className="muted small">
            One request fills in typical airfare by month, lodging, food, getting around, activities and seasonal weather. Everything stays marked
            as an estimate.
          </p>
          <ol className="how">
            <li>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigator.clipboard.writeText(prompt).then(
                      () => setCopyMsg('Copied — paste it into Claude or another assistant.'),
                      (e: Error) => setCopyMsg(`Copy failed (${e.message}). Open “See the request” and copy it by hand.`),
                    )
                  }
                >
                  Copy the request
                </button>
                {copyMsg && <span className="small muted">{copyMsg}</span>}
              </div>
              <details className="more">
                <summary>See the request</summary>
                <textarea className="mono" rows={8} readOnly value={prompt} aria-label="Planning brief" />
              </details>
            </li>
            <li>
              <Field label="Paste the reply here">
                <textarea className="mono" rows={5} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "airfarePerPersonByMonth": … }' />
              </Field>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!pasted.trim()}
                onClick={() => {
                  const r = parseImportedAssumptions(pasted, trip.currency);
                  if (r.errors.length) return setMsg({ tone: 'error', text: 'Nothing was imported. Fix these and try again:', list: r.errors });
                  const imp = r.assumptions!;
                  update((t) => {
                    const base = t.assumptions ?? blankAssumptions();
                    return {
                      ...t,
                      assumptions: {
                        ...base,
                        ...imp,
                        airfarePerPersonByMonth: { ...base.airfarePerPersonByMonth, ...(imp.airfarePerPersonByMonth ?? {}) },
                        climateByMonth: { ...base.climateByMonth, ...(imp.climateByMonth ?? {}) },
                      },
                    };
                  });
                  if (imp.climateByMonth && Object.keys(imp.climateByMonth).length) saveClimate(trip.destination, imp.climateByMonth);
                  setPasted('');
                  setMsg(null);
                  setMode('view');
                }}
              >
                Use these estimates
              </button>
            </li>
          </ol>
          <div className="actions">
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setMode('edit')}>
              Or enter them by hand
            </button>
            {ready && (
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setMode('view')}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'view' && (
        <div className="stack-sm">
          <dl className="summary">
            <div>
              <dt>Flights / person</dt>
              <dd>{fares.length ? (Math.min(...fares) === Math.max(...fares) ? money(fares[0]) : `${money(Math.min(...fares))}–${money(Math.max(...fares))}`) : '—'}</dd>
            </div>
            <div>
              <dt>Lodging / night</dt>
              <dd>{money(a.lodgingPerNight)}</dd>
            </div>
            <div>
              <dt>Food / person / day</dt>
              <dd>{money(a.foodPerPersonPerDay)}</dd>
            </div>
            <div>
              <dt>Getting around / day</dt>
              <dd>{money(a.transportPerDay)}</dd>
            </div>
            <div>
              <dt>Activities / person / day</dt>
              <dd>{money(a.activitiesPerPersonPerDay)}</dd>
            </div>
            <div>
              <dt>Flight lands</dt>
              <dd>{a.arrivalOffsetDays === 1 ? 'Next day' : a.arrivalOffsetDays === 0 ? 'Same day' : `${a.arrivalOffsetDays} days later`}</dd>
            </div>
          </dl>
          {climateMonths.some((mm) => a.climateByMonth[mm]) && (
            <ul className="weather-list">
              {climateMonths.map((mm) => {
                const c = a.climateByMonth[mm];
                return c ? (
                  <li key={mm}>
                    <strong>{formatDate(`2027-${mm}-15`, { month: 'long' })}</strong> <span className="score">{c.score}/5</span> {c.summary}
                  </li>
                ) : null;
              })}
            </ul>
          )}
          <p className="small muted">
            <PriceBadge status="estimated" /> {a.origin === 'assistant' ? `From an assistant, ${a.researchedAt}` : 'Entered by hand'}
            {a.sources.length > 0 && ` · ${a.sources.length} source${a.sources.length === 1 ? '' : 's'}`}. Seasonal weather is an average, not a forecast.
          </p>
        </div>
      )}

      {mode === 'edit' && (
        <div className="stack-sm">
          <div className="grid-2">
            <Field label={`Lodging per night (${cur})`} hint="whole family">
              <NumberInput value={a.lodgingPerNight} onChange={(v) => setA({ lodgingPerNight: v })} step={10} aria-label="Lodging per night" />
            </Field>
            <Field label="Food per person per day">
              <NumberInput value={a.foodPerPersonPerDay} onChange={(v) => setA({ foodPerPersonPerDay: v })} aria-label="Food per person per day" />
            </Field>
            <Field label="Getting around per day" hint="whole group">
              <NumberInput value={a.transportPerDay} onChange={(v) => setA({ transportPerDay: v })} aria-label="Transport per day" />
            </Field>
            <Field label="Activities per person per day">
              <NumberInput value={a.activitiesPerPersonPerDay} onChange={(v) => setA({ activitiesPerPersonPerDay: v })} aria-label="Activities per person per day" />
            </Field>
            <Field label="Taxes & fees" hint="% of lodging">
              <NumberInput value={a.feesPct} onChange={(v) => setA({ feesPct: v ?? 0 })} aria-label="Fees percent" />
            </Field>
          </div>
          <div className="grid-2">
            <DayOffset label="Outbound flight lands" value={a.arrivalOffsetDays} onChange={(v) => setA({ arrivalOffsetDays: v })} />
            <DayOffset label="Flight home lands" value={a.returnOffsetDays} onChange={(v) => setA({ returnOffsetDays: v })} />
          </div>
          <h4 className="sub-head">By departure month</h4>
          <div className="month-list">
            {months.map((m) => {
              const mm = m.slice(5, 7);
              const c = a.climateByMonth[mm];
              return (
                <div key={m} className="month-item">
                  <strong>{formatDate(m + '-15', { month: 'long', year: 'numeric' })}</strong>
                  <div className="grid-2">
                    <Field label="Airfare per person">
                      <NumberInput
                        value={a.airfarePerPersonByMonth[m] ?? null}
                        onChange={(v) => {
                          const next = { ...a.airfarePerPersonByMonth };
                          if (v && v > 0) next[m] = v;
                          else delete next[m];
                          setA({ airfarePerPersonByMonth: next });
                        }}
                        step={10}
                        aria-label={`Airfare ${m}`}
                      />
                    </Field>
                    <Field label="Weather (0–5)" hint={c?.summary}>
                      <NumberInput
                        value={c?.score ?? null}
                        step={0.5}
                        onChange={(v) => {
                          const next = { ...a.climateByMonth };
                          if (v === null) delete next[mm];
                          else next[mm] = { score: Math.min(5, Math.max(0, v)), summary: c?.summary ?? '' };
                          setA({ climateByMonth: next });
                        }}
                        aria-label={`Climate score ${mm}`}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
          {cached && Object.keys(a.climateByMonth).length === 0 && (
            <button type="button" className="btn btn-small" onClick={() => setA({ climateByMonth: cached })}>
              Reuse saved weather for {trip.destination}
            </button>
          )}
          <div className="actions">
            <button type="button" className="btn btn-primary btn-small" onClick={() => setMode(missingInputs(trip).length ? 'edit' : 'view')}>
              Done
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setMode('assistant')}>
              Use an assistant instead
            </button>
          </div>
          {missing.length > 0 && <p className="small warn-text">Still needed: {missing.join(' · ')}</p>}
        </div>
      )}

      {msg && (
        <Banner tone={msg.tone}>
          {msg.text}
          {msg.list && (
            <ul>
              {msg.list.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </Banner>
      )}
    </section>
  );
}

const WEIGHT_LABELS: { k: keyof ScoringWeights; label: string; hint: string }[] = [
  { k: 'cost', label: 'Money left over', hint: 'remaining budget' },
  { k: 'value', label: 'Value per night', hint: 'cost per vacation night' },
  { k: 'duration', label: 'Trip length', hint: `closeness to your ideal length, or more nights up to ${FULL_VACATION_NIGHTS}` },
  { k: 'weather', label: 'Weather', hint: 'seasonal climate score' },
  { k: 'preferences', label: 'Preferred dates', hint: 'overlap with your preferred dates' },
];

function WindowsCard({ trip, update }: TabProps) {
  const { data } = useStore();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const weights = trip.weights ?? DEFAULT_WEIGHTS;
  const missing = missingInputs(trip);
  const windows = trip.windows ?? [];
  const active = windows.filter((w) => w.status !== 'rejected');
  const rejected = windows.filter((w) => w.status === 'rejected');
  const compared = windows.filter((w) => w.status === 'kept' || w.status === 'locked');

  const run = () => {
    const r = generateWindows(trip);
    setResult(r);
    if (!r.missing.length) update((t) => ({ ...t, windows: r.windows }));
  };

  return (
    <section className={`card stage stack-sm ${missing.length ? 'disabled' : ''}`}>
      <StageHead n={3} title="Find your vacation windows" done={windows.some((w) => w.status === 'locked')} />

      {missing.length > 0 ? (
        <p className="muted small">Finish the steps above, then ORIVOIR compares dates and trip lengths for you.</p>
      ) : (
        <>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={run}>
              {active.length ? 'Search again' : 'Find vacation windows'}
            </button>
          </div>
          <p className="small muted">
            Runs on this device in seconds using the estimates above — no web requests, no AI calls. Live fare search isn’t set up yet (it needs a secure
            server and a flight-data provider).
          </p>
        </>
      )}
      {missing.length === 0 && (
        <>
      <details className="more">
        <summary className="small">Ranking weights (how windows are scored)</summary>
        <div className="grid-4 weights">
          {WEIGHT_LABELS.map(({ k, label, hint }) => (
            <Field key={k} label={label} hint={hint}>
              <NumberInput value={weights[k]} onChange={(v) => update((t) => ({ ...t, weights: { ...weights, [k]: Math.max(0, v ?? 0) } }))} aria-label={`Weight ${label}`} />
            </Field>
          ))}
        </div>
        <p className="small muted">
          Score = weighted average of these, each 0–1. Transportation convenience isn't scored in Planning Estimate Mode (no route data).{' '}
          <button type="button" className="btn btn-ghost btn-small" onClick={() => update((t) => ({ ...t, weights: DEFAULT_WEIGHTS }))}>
            Reset
          </button>
        </p>
      </details>
        </>
      )}
      {result && result.missing.length > 0 && missing.length === 0 && <Banner tone="warn">{result.missing.join(' ')}</Banner>}
      {result?.shortfall && (
        <Banner tone="error">
          <strong>No window fits the budget.</strong>
          <ul>
            {result.shortfall.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Banner>
      )}
      {result && !result.shortfall && !result.missing.length && (
        <p className="small muted">Compared {result.evaluatedCount} date-and-length combinations.</p>
      )}

      {compared.length > 1 && <CompareTable windows={compared} currency={trip.currency} />}

      <div className="window-list">
        {active.map((w) => (
          <WindowCard key={w.id} w={w} trip={trip} update={update} profileAirport={data.profile.homeAirport} />
        ))}
      </div>

      {rejected.length > 0 && (
        <div>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setShowRejected((s) => !s)}>
            {showRejected ? 'Hide' : 'Show'} {rejected.length} rejected window{rejected.length === 1 ? '' : 's'}
          </button>
          {showRejected &&
            rejected.map((w) => (
              <div key={w.id} className="row rejected-row">
                <span>
                  {fmt(w.departureDate)} · {w.destinationNights} nights{w.feedback && <span className="muted small"> — “{w.feedback}”</span>}
                </span>
                <button type="button" className="btn btn-small" onClick={() => update((t) => setWindowStatus(t, w.id, 'proposed'))}>
                  Restore
                </button>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

function CompareTable({ windows, currency }: { windows: CandidateTravelWindow[]; currency: string }) {
  const rows: { label: string; get: (w: CandidateTravelWindow) => React.ReactNode }[] = [
    { label: 'Leave home', get: (w) => fmt(w.departureDate) },
    { label: 'Nights there', get: (w) => w.destinationNights },
    { label: 'Projected total ≈', get: (w) => <Money amount={w.projectedTotal} currency={currency} /> },
    { label: 'Left over', get: (w) => (w.remainingBudget === null ? 'No budget target' : <Money amount={w.remainingBudget} currency={currency} />) },
    { label: 'Per night ≈', get: (w) => <Money amount={w.projectedTotal / w.destinationNights} currency={currency} /> },
    { label: 'Weather', get: (w) => (w.weatherScore === null ? '—' : `${w.weatherScore}/5`) },
    { label: 'Score', get: (w) => w.score },
  ];
  return (
    <div className="table-wrap">
      <table className="compare">
        <thead>
          <tr>
            <th>Compare</th>
            {windows.map((w) => (
              <th key={w.id}>{w.status === 'locked' ? '🔒 Locked' : 'Kept'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              {windows.map((w) => (
                <td key={w.id}>{r.get(w)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WindowCard({ w, trip, update, profileAirport }: { w: CandidateTravelWindow; profileAirport: string } & TabProps) {
  const { data } = useStore();
  const [feedback, setFeedback] = useState('');
  const [nights, setNights] = useState<number | null>(w.destinationNights);
  const [research, setResearch] = useState(false);
  const [fare, setFare] = useState<number | null>(w.fareOverridePerPerson ?? null);
  const [fareSource, setFareSource] = useState(w.fareOverrideSource ?? '');
  const [fareChecked, setFareChecked] = useState(!!w.fareOverrideVerified);
  const [err, setErr] = useState('');
  const cur = trip.currency;
  const people = travelerCount(trip);
  const lines: [string, number][] = [
    [`Airfare (${people} travelers)`, w.airfareTotal],
    ['Lodging', w.lodgingTotal],
    ['Getting around', w.groundTransportTotal],
    ['Food', w.foodTotal],
    ['Activities', w.activitiesTotal],
    ['Taxes & fees', w.feesTotal],
    ...(trip.budgetTotal === null ? [] : [[`Cushion (${trip.contingencyPct}%)`, w.contingency] as [string, number]]),
  ];
  void profileAirport;

  return (
    <article className={`window card status-${w.status}`}>
      <div className="window-head">
        <div>
          <div className="tags">
            {w.status === 'locked' && <span className="tag tag-lock">🔒 Locked for planning</span>}
            {w.status === 'kept' && <span className="tag">★ Kept</span>}
            {w.labels.map((l) => (
              <span key={l} className="tag tag-good">
                {l}
              </span>
            ))}
          </div>
          <h3>
            {w.destinationNights} nights · {formatDate(w.arrivalDate, { month: 'short', day: 'numeric' })} –{' '}
            {formatDate(w.destinationDepartureDate, { month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <p className="muted small">
            Leave home {fmt(w.departureDate)} → arrive {fmt(w.arrivalDate)} · leave {fmt(w.destinationDepartureDate)} → home {fmt(w.returnDate)}
          </p>
        </div>
        <div className="window-total">
          <Money amount={w.projectedTotal} currency={cur} />
          {w.remainingBudget === null ? (
            <span className="small">No budget target</span>
          ) : (
            <span className={w.remainingBudget < 0 ? 'over small' : 'small'}>
              <Money amount={w.remainingBudget} currency={cur} /> left
            </span>
          )}
          <PriceBadge status={w.priceStatus} />
          <span className={`conf conf-${w.confidence}`}>{w.confidence} confidence</span>
        </div>
      </div>
      <div className="window-body">
        <table className="window-costs">
          <tbody>
            {lines.map(([l, v]) => (
              <tr key={l}>
                <th>{l}</th>
                <td>
                  ≈ <Money amount={v} currency={cur} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="small">
          <p>{w.weatherAssessment}</p>
          <ul className="reasons">
            {w.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="muted">Score {w.score}/100</p>
        </div>
      </div>
      <div className="cand-actions">
        {w.status !== 'locked' && (
          <button type="button" className="btn btn-small btn-choose" onClick={() => update((t) => lockWindow(t, w.id))}>
            🔒 Lock for planning
          </button>
        )}
        {w.status === 'proposed' && (
          <button type="button" className="btn btn-small" onClick={() => update((t) => setWindowStatus(t, w.id, 'kept'))}>
            ★ Keep
          </button>
        )}
        {w.status !== 'proposed' && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => update((t) => setWindowStatus(t, w.id, 'proposed'))}>
            {w.status === 'locked' ? 'Unlock' : 'Un-keep'}
          </button>
        )}
        <input className="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Why not? (optional)" aria-label="Rejection reason" />
        <button type="button" className="btn btn-small btn-ghost" onClick={() => update((t) => setWindowStatus(t, w.id, 'rejected', feedback))}>
          ✕ Reject
        </button>
      </div>
      <div className="cand-actions">
        <span className="small muted">Different length from this date:</span>
        <span className="mini-num">
          <NumberInput value={nights} min={1} onChange={setNights} aria-label="Different length nights" />
        </span>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => {
            setErr('');
            if (!nights) return;
            const e = evaluateWindow(trip, w.departureDate, nights);
            if (!e) return setErr(`${nights} nights from ${w.departureDate} doesn't fit your availability (or there's no airfare estimate for that month).`);
            update((t) => ({ ...t, constraints: { ...(t.constraints ?? { departureAirport: '', minNights: null, maxNights: null, preferredNights: null }), preferredNights: nights } }));
            setErr(`Ideal length set to ${nights} nights. Press “Find vacation windows” to search again.`);
          }}
        >
          Prefer this length
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setResearch((r) => !r)} aria-expanded={research}>
          Research these exact dates
        </button>
      </div>
      {err && <p className="small warn-text">{err}</p>}
      {research && (
        <div className="stack-sm research-dates">
          <p className="small muted">
            One targeted request for this window. Paste the brief into an assistant or check the airline yourself, then enter what you find.
          </p>
          <textarea className="mono" rows={5} readOnly value={buildWindowFarePrompt(trip, data.profile, w)} aria-label="Exact dates brief" />
          <div className="grid-3">
            <Field label="Fare per person found">
              <NumberInput value={fare} onChange={setFare} aria-label="Exact fare per person" />
            </Field>
            <Field label="Where (URL / airline)">
              <input value={fareSource} onChange={(e) => setFareSource(e.target.value)} />
            </Field>
            <label className="field checkbox">
              <span className="field-label">Checked by you?</span>
              <span>
                <input type="checkbox" checked={fareChecked} onChange={(e) => setFareChecked(e.target.checked)} /> I saw this exact fare myself
              </span>
            </label>
          </div>
          <button
            type="button"
            className="btn btn-small btn-primary"
            disabled={!fare}
            onClick={() => {
              const e = evaluateWindow(trip, w.departureDate, w.destinationNights, {
                fareOverridePerPerson: fare,
                fareOverrideVerified: fareChecked,
                fareOverrideSource: fareSource,
              });
              if (!e) return setErr('Could not re-cost this window.');
              const { parts: _p, fareMonth: _m, farePerPerson: _f, ...rest } = e;
              update((t) => ({
                ...t,
                windows: (t.windows ?? []).map((x) =>
                  x.id === w.id ? { ...x, ...rest, reasons: [`Airfare ${fare}/person for these exact dates${fareChecked ? ' (you checked it)' : ' (estimate)'}`, ...x.reasons.slice(1)] } : x,
                ),
              }));
              setResearch(false);
            }}
          >
            Use this fare
          </button>
        </div>
      )}
    </article>
  );
}

function ManualDates({ update }: TabProps) {
  const [d, setD] = useState(blankDateOption());
  const n = nightsBetween(d.start, d.end);
  return (
    <div className="stack-sm">
      <p className="small muted">Arrival at your destination to the day you leave it.</p>
      <div className="grid-2">
        <CalendarPicker
          label="Trip dates"
          mode="range"
          start={d.start}
          end={d.end}
          startLabel="Arrive"
          endLabel="Leave"
          onChange={(start, end = '') => setD({ ...d, start, end })}
        />
        <Field label="Airfare per person">
          <NumberInput value={d.flightPerPerson} onChange={(v) => setD({ ...d, flightPerPerson: v })} aria-label="Manual airfare per person" />
        </Field>
      </div>
      {n !== null && <p className="small muted">{n} nights</p>}
      <button
        type="button"
        className="btn btn-small"
        disabled={n === null || n < 1}
        onClick={() => {
          const opt = { ...d, label: d.label || `${n} nights` };
          update((t) => ({ ...t, dateOptions: [...t.dateOptions, opt], chosenDateId: opt.id }));
          setD(blankDateOption());
        }}
      >
        Use these dates
      </button>
    </div>
  );
}
