import { useState } from 'react';
import { affordableNights, nightsBetween, summarize } from '../domain/budget';
import { blankDateOption, newId } from '../domain/factory';
import { buildDatesPrompt, parseImportedDates } from '../domain/research';
import { useStore } from '../state/store';
import type { DateOption } from '../domain/types';
import { Banner, Field, formatDate, Money, NumberInput, PriceBadge } from './common';
import { href } from './router';
import type { TabProps } from './TripView';

export function DatesTab({ trip, update }: TabProps) {
  const setDate = (id: string, patch: Partial<DateOption>) =>
    update((t) => ({ ...t, dateOptions: t.dateOptions.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const remove = (id: string) =>
    update((t) => ({ ...t, dateOptions: t.dateOptions.filter((d) => d.id !== id), chosenDateId: t.chosenDateId === id ? null : t.chosenDateId }));
  const add = () =>
    update((t) => ({ ...t, dateOptions: [...t.dateOptions, { ...blankDateOption(), label: `Option ${String.fromCharCode(65 + t.dateOptions.length)}` }] }));

  const valid = trip.dateOptions.filter((d) => nightsBetween(d.start, d.end) !== null);
  // Until a place to stay is chosen, project the whole trip from the daily estimate so long windows aren't flattered.
  const hasLodging = trip.candidates.some((c) => c.status === 'selected' && c.category === 'lodging');
  const daily = !hasLodging && trip.dailyEstimate ? trip.dailyEstimate : 0;
  const rows = valid.map((d) => {
    const s = summarize(trip, d);
    const projected = s.committed + daily * s.shape.nights;
    const allowed = affordableNights(trip, d.flightPerPerson);
    return { d, s, projected, left: s.budget - s.contingency - projected, allowed, fits: !allowed || allowed.nights >= s.shape.nights };
  });
  const fitting = rows.filter((r) => r.fits);
  const best = rows.length > 1 && fitting.length > 0 ? fitting.reduce((a, b) => (b.left > a.left ? b : a)) : null;

  return (
    <div className="stack">
      <div className="intro">
        <h2>Compare dates</h2>
        <p className="muted">
          Add each possible window — the day you arrive at your destination to the day you leave (overnight flights often land the next
          day) — with an airfare estimate. ATLAS recalculates nightly and daily costs for every option using what you've
          chosen so far. {trip.flexibility && <em>Flexibility: {trip.flexibility}</em>}
        </p>
      </div>

      <DateFinder {...{ trip, update }} />

      {rows.length > 0 && (
        <div className="card table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Option</th>
                <th>Nights</th>
                <th>Airfare</th>
                <th title="Longest stay the budget covers with this airfare">Budget allows</th>
                <th>Projected cost</th>
                <th>Left</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, s, projected, left, allowed }) => (
                <tr key={d.id} className={d.id === trip.chosenDateId ? 'chosen' : ''}>
                  <td>
                    <strong>{d.label || 'Option'}</strong>
                    <div className="muted small">
                      {formatDate(d.start)} – {formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {best?.d.id === d.id && <span className="tag tag-good">Best value</span>}
                  </td>
                  <td>{s.shape.nights}</td>
                  <td>
                    <Money amount={s.byCategory.flights} currency={trip.currency} />
                  </td>
                  <td>
                    {!allowed ? (
                      <span className="muted small">set a daily spend</span>
                    ) : (
                      <span className={allowed.nights < s.shape.nights ? 'over' : ''}>
                        {allowed.nights} nights
                        {allowed.nights < s.shape.nights && <div className="small">too long by {s.shape.nights - allowed.nights}</div>}
                      </span>
                    )}
                  </td>
                  <td>
                    <Money amount={projected} currency={trip.currency} />
                    {daily > 0 && <div className="muted small">incl. daily estimate</div>}
                  </td>
                  <td className={left < 0 ? 'over' : ''}>
                    <Money amount={left} currency={trip.currency} />
                  </td>
                  <td>
                    {d.id === trip.chosenDateId ? (
                      <span className="tag">✓ Chosen</span>
                    ) : (
                      <button type="button" className="btn btn-small" onClick={() => update((t) => ({ ...t, chosenDateId: d.id }))}>
                        Choose
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trip.dateOptions.map((d) => {
        const n = nightsBetween(d.start, d.end);
        return (
          <div key={d.id} className={`card date-card ${d.id === trip.chosenDateId ? 'chosen' : ''}`}>
            <div className="grid-3">
              <Field label="Label">
                <input value={d.label} onChange={(e) => setDate(d.id, { label: e.target.value })} />
              </Field>
              <Field label="Arrive">
                <input type="date" value={d.start} onChange={(e) => setDate(d.id, { start: e.target.value })} />
              </Field>
              <Field label="Leave" hint={n === null ? (d.start || d.end ? 'End must be on or after start' : undefined) : `${n} nights`}>
                <input type="date" value={d.end} min={d.start} onChange={(e) => setDate(d.id, { end: e.target.value })} />
              </Field>
            </div>
            <div className="grid-3">
              <Field label="Airfare per person">
                <NumberInput value={d.flightPerPerson} onChange={(v) => setDate(d.id, { flightPerPerson: v })} step={10} aria-label="Airfare per person" />
              </Field>
              <Field label="Airfare price is">
                <div>
                  <PriceBadge status={d.flightStatus} onToggle={() => setDate(d.id, { flightStatus: d.flightStatus === 'verified' ? 'estimated' : 'verified' })} />
                </div>
              </Field>
              <Field label="Notes">
                <input value={d.notes} onChange={(e) => setDate(d.id, { notes: e.target.value })} placeholder="School break, surf season…" />
              </Field>
            </div>
            <div className="row-end">
              <button type="button" className="btn btn-ghost btn-small" onClick={() => remove(d.id)}>
                Remove option
              </button>
            </div>
          </div>
        );
      })}
      <div className="actions">
        <button type="button" className="btn" onClick={add}>
          + Add date option
        </button>
        <a className="btn btn-primary" href={href({ page: 'trip', id: trip.id, tab: 'explore' })}>
          Next: explore options →
        </a>
      </div>
    </div>
  );
}

function DateFinder({ trip, update }: TabProps) {
  const { data } = useStore();
  const starts = trip.dateOptions.map((d) => d.start).filter(Boolean).sort();
  const ends = trip.dateOptions.map((d) => d.end).filter(Boolean).sort();
  const windowStart = trip.windowStart ?? starts[0] ?? '';
  const windowEnd = trip.windowEnd ?? ends[ends.length - 1] ?? '';
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const hasLodging = trip.candidates.some((c) => c.status === 'selected' && c.category === 'lodging' && c.basis === 'perNight');
  const sampleFare = trip.dateOptions.find((d) => d.id === trip.chosenDateId)?.flightPerPerson ?? trip.dateOptions.find((d) => d.flightPerPerson)?.flightPerPerson ?? null;
  const afford = affordableNights(trip, sampleFare);
  const prompt = buildDatesPrompt(trip, data.profile, windowStart, windowEnd);

  return (
    <section className="card stack-sm finder">
      <div className="row">
        <div>
          <h3>Find the best dates</h3>
          <p className="muted small">
            Tell ATLAS when you could go. It works out how long the budget allows, and an assistant checks the whole window for the best
            weather, crowds and airfare. You confirm a window below, and its airfare goes into the budget.
          </p>
        </div>
      </div>
      <div className="grid-3">
        <Field label="Earliest arrival">
          <input type="date" value={windowStart} onChange={(e) => update((t) => ({ ...t, windowStart: e.target.value }))} />
        </Field>
        <Field label="Leave by">
          <input type="date" value={windowEnd} min={windowStart} onChange={(e) => update((t) => ({ ...t, windowEnd: e.target.value }))} />
        </Field>
        <Field
          label="Daily spend, whole group"
          hint={hasLodging ? 'Not used: ATLAS uses your chosen places to stay instead' : 'Lodging, food, local travel, activities — not flights'}
        >
          <NumberInput value={trip.dailyEstimate ?? null} onChange={(v) => update((t) => ({ ...t, dailyEstimate: v }))} step={10} aria-label="Daily spend" />
        </Field>
      </div>
      {afford ? (
        <p className="afford">
          With airfare at {sampleFare ? <Money amount={sampleFare} currency={trip.currency} /> : 'nothing yet'} per person, your budget covers about{' '}
          <strong>{afford.nights} nights</strong> ({<Money amount={afford.perNight} currency={trip.currency} />} per night
          {afford.source === 'choices' ? ' from your chosen places and daily costs' : ' from your daily estimate'}, after the{' '}
          {trip.contingencyPct}% cushion).
        </p>
      ) : (
        <p className="muted small">Enter a daily spend (or let the assistant estimate it) to see how many nights the budget allows.</p>
      )}
      <button type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ✦ Ask an assistant to find the best window
      </button>
      {open && (
        <div className="grid-2">
          <div className="stack-sm">
            <textarea className="mono" rows={10} readOnly value={prompt} aria-label="Dates brief" />
            <button
              type="button"
              className="btn"
              onClick={() =>
                navigator.clipboard.writeText(prompt).then(
                  () => setCopyMsg('Copied.'),
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
              <textarea className="mono" rows={10} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "dateOptions": [ … ] }' />
            </Field>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!pasted.trim()}
              onClick={() => {
                const r = parseImportedDates(pasted);
                setErrors(r.errors);
                if (r.errors.length) return setDone('');
                update((t) => ({
                  ...t,
                  dateOptions: [...t.dateOptions, ...r.dateOptions.map((d) => ({ ...d, id: newId() }))],
                  dailyEstimate: r.dailyEstimate ?? t.dailyEstimate ?? null,
                }));
                setDone(`Added ${r.dateOptions.length} date windows below. Compare them, then press Choose to confirm one.`);
                setPasted('');
              }}
            >
              Import date windows
            </button>
            {done && <Banner tone="info">{done}</Banner>}
            {errors.length > 0 && (
              <Banner tone="error">
                Nothing was imported. Fix these and try again:
                <ul>
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Banner>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
