import { useState } from 'react';
import { chosenDate, nightsBetween, travelerCount } from '../domain/budget';
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
import { Banner, Field, formatDate, Money, NumberInput, PriceBadge } from './common';
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
  const legacy = trip.dateOptions.filter((d) => d.legacyAvailability);

  return (
    <div className="stack">
      <div className="intro">
        <h2>When & how long</h2>
        <p className="muted">
          Tell ATLAS when you <em>could</em> travel. It finds the vacation windows — dates and trip length — that fit your budget. Nothing is
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
            {formatDate(locked.start, { weekday: 'short', month: 'long', day: 'numeric' })} –{' '}
            {formatDate(locked.end, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} · {nightsBetween(locked.start, locked.end)} nights
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

      {/* 1. Availability */}
      <section className="card stack-sm">
        <h3>1 · Your availability</h3>
        <div className="grid-2">
          <Field label="Earliest day you can leave home">
            <input type="date" value={av.earliestDeparture} onChange={(e) => setAv({ earliestDeparture: e.target.value })} />
          </Field>
          <Field label="Latest day you must be back home">
            <input type="date" value={av.latestReturn} min={av.earliestDeparture} onChange={(e) => setAv({ latestReturn: e.target.value })} />
          </Field>
        </div>
        {span !== null && (
          <p className="availability-pill">
            Available for {span} nights — ATLAS looks for the best trip <em>inside</em> this range, not a {span}-night trip.
          </p>
        )}
        <div className="grid-4">
          <Field label="Shortest trip" hint="nights, optional">
            <NumberInput value={cons.minNights} min={1} onChange={(v) => setCons({ minNights: v })} aria-label="Minimum nights" />
          </Field>
          <Field label="Ideal trip" hint="nights, optional">
            <NumberInput value={cons.preferredNights} min={1} onChange={(v) => setCons({ preferredNights: v })} aria-label="Preferred nights" />
          </Field>
          <Field label="Longest trip" hint="nights, optional">
            <NumberInput value={cons.maxNights} min={1} onChange={(v) => setCons({ maxNights: v })} aria-label="Maximum nights" />
          </Field>
          <Field label="Departure airport">
            <input value={cons.departureAirport} onChange={(e) => setCons({ departureAirport: e.target.value.toUpperCase() })} placeholder="LAS" />
          </Field>
        </div>
        <RangeList label="Preferred dates (optional)" ranges={av.preferredRanges} onChange={(r) => setAv({ preferredRanges: r })} />
        <RangeList label="Dates you can't travel (optional)" ranges={av.excludedRanges} onChange={(r) => setAv({ excludedRanges: r })} />
      </section>

      {/* 2. Assumptions */}
      <AssumptionsCard trip={trip} update={update} />

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
        <div key={i} className="range-row">
          <input type="date" value={r.start} aria-label={`${label} from`} onChange={(e) => onChange(ranges.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
          <span>to</span>
          <input type="date" value={r.end} min={r.start} aria-label={`${label} to`} onChange={(e) => onChange(ranges.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
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

function AssumptionsCard({ trip, update }: TabProps) {
  const { data, saveClimate } = useStore();
  const a = trip.assumptions ?? blankAssumptions();
  const setA = (p: Partial<PlanningAssumptions>) => update((t) => ({ ...t, assumptions: { ...(t.assumptions ?? blankAssumptions()), ...p, origin: p.origin ?? 'manual' } }));
  const av = trip.availability;
  const months = av ? departureMonths(av.earliestDeparture, av.latestReturn) : [];
  const climateMonths = [...new Set(months.map((m) => m.slice(5, 7)))];
  const cached = data.climateCache?.[trip.destination.trim().toLowerCase()];
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string; list?: string[] } | null>(null);
  const [copyMsg, setCopyMsg] = useState('');
  const prompt = buildAssumptionsPrompt(trip, data.profile);
  const cur = trip.currency;

  return (
    <section className="card stack-sm">
      <div className="row">
        <h3>2 · Budget & planning assumptions</h3>
        <span className="mode-pill">Planning Estimate Mode</span>
      </div>
      <p className="muted small">
        Budget <strong><Money amount={trip.budgetTotal} currency={cur} /></strong> for {travelerCount(trip)} travelers · {trip.contingencyPct}% cushion held back.
        These typical costs drive the date search. All are <strong>estimates</strong>: monthly airfares are route averages, not fares for specific dates.
      </p>

      <div className="assume-grid">
        <Field label={`Lodging / night (${cur})`} hint="whole family">
          <NumberInput value={a.lodgingPerNight} onChange={(v) => setA({ lodgingPerNight: v })} step={10} aria-label="Lodging per night" />
        </Field>
        <Field label="Food / person / day">
          <NumberInput value={a.foodPerPersonPerDay} onChange={(v) => setA({ foodPerPersonPerDay: v })} aria-label="Food per person per day" />
        </Field>
        <Field label="Getting around / day" hint="whole group">
          <NumberInput value={a.transportPerDay} onChange={(v) => setA({ transportPerDay: v })} aria-label="Transport per day" />
        </Field>
        <Field label="Activities / person / day">
          <NumberInput value={a.activitiesPerPersonPerDay} onChange={(v) => setA({ activitiesPerPersonPerDay: v })} aria-label="Activities per person per day" />
        </Field>
        <Field label="Taxes & fees (% of lodging)">
          <NumberInput value={a.feesPct} onChange={(v) => setA({ feesPct: v ?? 0 })} aria-label="Fees percent" />
        </Field>
        <Field label="Days to arrive" hint="1 if the flight lands the next day">
          <NumberInput value={a.arrivalOffsetDays} onChange={(v) => setA({ arrivalOffsetDays: Math.round(v ?? 0) })} aria-label="Arrival offset days" />
        </Field>
        <Field label="Days to get home">
          <NumberInput value={a.returnOffsetDays} onChange={(v) => setA({ returnOffsetDays: Math.round(v ?? 0) })} aria-label="Return offset days" />
        </Field>
      </div>

      {months.length > 0 && (
        <div className="month-table">
          <div className="month-row month-head">
            <span>Departure month</span>
            <span>Airfare / person ≈</span>
            <span>Climate (0–5, seasonal average)</span>
          </div>
          {months.map((m) => {
            const mm = m.slice(5, 7);
            const c = a.climateByMonth[mm];
            return (
              <div key={m} className="month-row">
                <span>{formatDate(m + '-15', { month: 'long', year: 'numeric' })}</span>
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
                {climateMonths.includes(mm) && (
                  <span className="climate-cell">
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
                    <span className="muted small">{c?.summary}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {cached && Object.keys(a.climateByMonth).length === 0 && (
        <button type="button" className="btn btn-small" onClick={() => setA({ climateByMonth: cached })}>
          Reuse saved climate for {trip.destination}
        </button>
      )}
      <p className="small muted">
        {a.origin === 'assistant' ? `From an assistant on ${a.researchedAt}` : 'Entered by hand'} · bags {a.baggageIncluded ? 'included' : 'not included'} ·{' '}
        <PriceBadge status="estimated" />
        {a.sources.length > 0 && (
          <>
            {' '}· Sources:{' '}
            {a.sources.map((s, i) => (
              <span key={i}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.note || s.url}
                  </a>
                ) : (
                  s.note
                )}
                {s.checkedAt && ` (${s.checkedAt})`}
                {i < a.sources.length - 1 && '; '}
              </span>
            ))}
          </>
        )}
      </p>

      <button type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} disabled={!av}>
        ✦ Fill these in with one assistant request
      </button>
      {open && (
        <div className="grid-2">
          <div className="stack-sm">
            <textarea className="mono" rows={10} readOnly value={prompt} aria-label="Planning brief" />
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigator.clipboard.writeText(prompt).then(
                  () => setCopyMsg('Copied. This is the one research request for this pass.'),
                  (e: Error) => setCopyMsg(`Copy failed (${e.message}). Select the text and copy it manually.`),
                )
              }
            >
              Copy brief
            </button>
            {copyMsg && <span className="small muted">{copyMsg}</span>}
          </div>
          <div className="stack-sm">
            <Field label="Paste the reply">
              <textarea className="mono" rows={10} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "airfarePerPersonByMonth": { … } }' />
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
                setMsg({ tone: 'info', text: 'Planning estimates updated. Now find vacation windows below.' });
              }}
            >
              Import estimates
            </button>
          </div>
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
    <section className="card stack-sm">
      <h3>3 · Vacation windows</h3>
      <details>
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

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={run} disabled={missing.length > 0}>
          Find vacation windows
        </button>
        <button type="button" className="btn" disabled title="Needs a secure backend with a flight-data provider and a weather provider">
          Live price search (not set up)
        </button>
      </div>
      <p className="small muted">
        Runs on this device in seconds: weekly departure dates × several trip lengths, then a closer look around the best. No web requests; no
        AI calls. Live price search needs a secure backend with an authorized flight-data provider and weather provider — not configured yet.
      </p>
      {missing.length > 0 && (
        <Banner tone="warn">
          Needed before searching:
          <ul>
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Banner>
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
    { label: 'Left over', get: (w) => <Money amount={w.remainingBudget} currency={currency} /> },
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
    [`Cushion (${trip.contingencyPct}%)`, w.contingency],
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
          <span className={w.remainingBudget < 0 ? 'over small' : 'small'}>
            <Money amount={w.remainingBudget} currency={cur} /> left
          </span>
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
      <div className="grid-3">
        <Field label="Arrive">
          <input type="date" value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} />
        </Field>
        <Field label="Leave" hint={n !== null ? `${n} nights` : undefined}>
          <input type="date" value={d.end} min={d.start} onChange={(e) => setD({ ...d, end: e.target.value })} />
        </Field>
        <Field label="Airfare per person">
          <NumberInput value={d.flightPerPerson} onChange={(v) => setD({ ...d, flightPerPerson: v })} aria-label="Manual airfare per person" />
        </Field>
      </div>
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
