import { useState } from 'react';
import { formatMoney } from '../domain/budget';
import { buildAssumptionsPrompt, parseImportedAssumptions } from '../domain/research';
import type { PlanningAssumptions } from '../domain/types';
import { blankAssumptions, departureMonths, missingInputs } from '../domain/windows';
import { useStore } from '../state/store';
import { Banner, Field, formatDate, NumberInput, PriceBadge } from './common';
import { StageHead } from './StageHead';
import type { TabProps } from './TripView';

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

export function EstimatesCard({ trip, update }: TabProps) {
  const { data, saveClimate } = useStore();
  const a = trip.assumptions ?? blankAssumptions();
  const setA = (p: Partial<PlanningAssumptions>) =>
    update((t) => ({ ...t, assumptions: { ...(t.assumptions ?? blankAssumptions()), ...p, origin: p.origin ?? 'manual' } }));
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
            One request fills in typical airfare by month, lodging, food, getting around, activities and seasonal weather. Everything stays
            marked as an estimate.
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
                      (e: Error) => setCopyMsg(`Copy failed (${e.message}). Open "See the request" and copy it by hand.`),
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
                <textarea
                  className="mono"
                  rows={5}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder='{ "airfarePerPersonByMonth": … }'
                />
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
              <dd>
                {fares.length
                  ? Math.min(...fares) === Math.max(...fares)
                    ? money(fares[0])
                    : `${money(Math.min(...fares))}–${money(Math.max(...fares))}`
                  : '—'}
              </dd>
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
              <dd>
                {a.arrivalOffsetDays === 1 ? 'Next day' : a.arrivalOffsetDays === 0 ? 'Same day' : `${a.arrivalOffsetDays} days later`}
              </dd>
            </div>
          </dl>
          {climateMonths.some((mm) => a.climateByMonth[mm]) && (
            <ul className="weather-list">
              {climateMonths.map((mm) => {
                const c = a.climateByMonth[mm];
                return c ? (
                  <li key={mm}>
                    {/* Use year 2000 — a stable past year — purely to render the month name. */}
                    <strong>{formatDate(`2000-${mm}-15`, { month: 'long' })}</strong> <span className="score">{c.score}/5</span> {c.summary}
                  </li>
                ) : null;
              })}
            </ul>
          )}
          <p className="small muted">
            <PriceBadge status="estimated" /> {a.origin === 'assistant' ? `From an assistant, ${a.researchedAt}` : 'Entered by hand'}
            {a.sources.length > 0 && ` · ${a.sources.length} source${a.sources.length === 1 ? '' : 's'}`}. Seasonal weather is an average,
            not a forecast.
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
              <NumberInput
                value={a.foodPerPersonPerDay}
                onChange={(v) => setA({ foodPerPersonPerDay: v })}
                aria-label="Food per person per day"
              />
            </Field>
            <Field label="Getting around per day" hint="whole group">
              <NumberInput value={a.transportPerDay} onChange={(v) => setA({ transportPerDay: v })} aria-label="Transport per day" />
            </Field>
            <Field label="Activities per person per day">
              <NumberInput
                value={a.activitiesPerPersonPerDay}
                onChange={(v) => setA({ activitiesPerPersonPerDay: v })}
                aria-label="Activities per person per day"
              />
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
