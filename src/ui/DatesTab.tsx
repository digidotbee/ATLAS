import { nightsBetween, summarize } from '../domain/budget';
import { blankDateOption } from '../domain/factory';
import type { DateOption } from '../domain/types';
import { Field, formatDate, Money, NumberInput, PriceBadge } from './common';
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
  const rows = valid.map((d) => ({ d, s: summarize(trip, d) }));
  const best = rows.length > 1 ? rows.reduce((a, b) => (b.s.remaining > a.s.remaining ? b : a)) : null;

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

      {rows.length > 0 && (
        <div className="card table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Option</th>
                <th>Nights</th>
                <th>Airfare</th>
                <th>Projected cost</th>
                <th>Left</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, s }) => (
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
                    <Money amount={s.committed} currency={trip.currency} />
                  </td>
                  <td className={s.remaining < 0 ? 'over' : ''}>
                    <Money amount={s.remaining} currency={trip.currency} />
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
