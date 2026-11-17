import { useState } from 'react';
import { travelerCount } from '../domain/budget';
import { buildWindowFarePrompt } from '../domain/research';
import type { CandidateTravelWindow, ScoringWeights } from '../domain/types';
import {
  DEFAULT_WEIGHTS,
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
import { StageHead } from './StageHead';
import type { TabProps } from './TripView';

const fmt = (iso: string) => formatDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });

const WEIGHT_LABELS: { k: keyof ScoringWeights; label: string; hint: string }[] = [
  { k: 'cost', label: 'Money left over', hint: 'remaining budget' },
  { k: 'value', label: 'Value per night', hint: 'cost per vacation night' },
  { k: 'duration', label: 'Trip length', hint: `closeness to your ideal length, or more nights up to ${FULL_VACATION_NIGHTS}` },
  { k: 'weather', label: 'Weather', hint: 'seasonal climate score' },
  { k: 'preferences', label: 'Preferred dates', hint: 'overlap with your preferred dates' },
];

function CompareTable({ windows, currency }: { windows: CandidateTravelWindow[]; currency: string }) {
  const rows: { label: string; get: (w: CandidateTravelWindow) => React.ReactNode }[] = [
    { label: 'Leave home', get: (w) => fmt(w.departureDate) },
    { label: 'Nights there', get: (w) => w.destinationNights },
    { label: 'Projected total ≈', get: (w) => <Money amount={w.projectedTotal} currency={currency} /> },
    {
      label: 'Left over',
      get: (w) =>
        w.remainingBudget === null ? 'No budget target' : <Money amount={w.remainingBudget} currency={currency} />,
    },
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

function WindowCard({ w, trip, update }: { w: CandidateTravelWindow } & TabProps) {
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
            Leave home {fmt(w.departureDate)} → arrive {fmt(w.arrivalDate)} · leave {fmt(w.destinationDepartureDate)} → home{' '}
            {fmt(w.returnDate)}
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
        <input
          className="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Why not? (optional)"
          aria-label="Rejection reason"
        />
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={() => update((t) => setWindowStatus(t, w.id, 'rejected', feedback))}
        >
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
            if (!e)
              return setErr(
                `${nights} nights from ${w.departureDate} doesn't fit your availability (or there's no airfare estimate for that month).`,
              );
            update((t) => ({
              ...t,
              constraints: {
                ...(t.constraints ?? { departureAirport: '', minNights: null, maxNights: null, preferredNights: null }),
                preferredNights: nights,
              },
            }));
            setErr(`Ideal length set to ${nights} nights. Press "Find vacation windows" to search again.`);
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
          <textarea
            className="mono"
            rows={5}
            readOnly
            value={buildWindowFarePrompt(trip, data.profile, w)}
            aria-label="Exact dates brief"
          />
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
                <input type="checkbox" checked={fareChecked} onChange={(e) => setFareChecked(e.target.checked)} /> I saw this exact fare
                myself
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
                  x.id === w.id
                    ? {
                        ...x,
                        ...rest,
                        reasons: [
                          `Airfare ${fare}/person for these exact dates${fareChecked ? ' (you checked it)' : ' (estimate)'}`,
                          ...x.reasons.slice(1),
                        ],
                      }
                    : x,
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

export function WindowsCard({ trip, update }: TabProps) {
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
            Runs on this device in seconds using the estimates above — no web requests, no AI calls. Live fare search isn't set up yet (it
            needs a secure server and a flight-data provider).
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
                  <NumberInput
                    value={weights[k]}
                    onChange={(v) => update((t) => ({ ...t, weights: { ...weights, [k]: Math.max(0, v ?? 0) } }))}
                    aria-label={`Weight ${label}`}
                  />
                </Field>
              ))}
            </div>
            <p className="small muted">
              Score = weighted average of these, each 0–1. Transportation convenience isn't scored in Planning Estimate Mode (no route
              data).{' '}
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
          <WindowCard key={w.id} w={w} trip={trip} update={update} />
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
                  {fmt(w.departureDate)} · {w.destinationNights} nights
                  {w.feedback && <span className="muted small"> — "{w.feedback}"</span>}
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

