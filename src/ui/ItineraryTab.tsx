import { candidateCost, tripShape } from '../domain/budget';
import { buildItinerary } from '../domain/itinerary';
import { CATEGORIES, type Candidate } from '../domain/types';
import { Banner, formatDate, Money } from './common';
import { href } from './router';
import type { TabProps } from './TripView';

export function ItineraryTab({ trip, update }: TabProps) {
  const it = buildItinerary(trip);
  if (!it) {
    return (
      <div className="stack">
        <h2>Itinerary</h2>
        <Banner tone="warn">
          Choose your travel dates first. <a href={href({ page: 'trip', id: trip.id, tab: 'dates' })}>Go to Dates →</a>
        </Banner>
      </div>
    );
  }
  const shape = tripShape(trip);
  const setDay = (id: string, day: number | null) =>
    update((t) => ({ ...t, candidates: t.candidates.map((c) => (c.id === id ? { ...c, day } : c)) }));
  const setNote = (i: number, v: string) => update((t) => ({ ...t, dayNotes: { ...t.dayNotes, [String(i)]: v } }));
  const dayOptions = it.days.map((d) => ({ value: d.index, label: `Day ${d.index + 1} · ${formatDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}` }));

  const dayPicker = (c: Candidate) => (
    <select aria-label={`Day for ${c.name}`} value={c.day ?? ''} onChange={(e) => setDay(c.id, e.target.value === '' ? null : Number(e.target.value))}>
      <option value="">{c.category === 'lodging' ? 'Check-in day…' : 'Unscheduled'}</option>
      {dayOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {c.category === 'lodging' ? `Check in ${o.label}` : o.label}
        </option>
      ))}
    </select>
  );

  const selectedLodging = trip.candidates.filter((c) => c.status === 'selected' && c.category === 'lodging');

  return (
    <div className="stack">
      <div className="intro">
        <h2>Itinerary</h2>
        <p className="muted">
          {shape.days} days, {shape.nights} nights. Put chosen experiences on days and leave room for wandering — not every day needs a plan.
        </p>
      </div>

      {it.nightsWithoutLodging.length > 0 && (
        <Banner tone="warn">
          No place to stay chosen for night{it.nightsWithoutLodging.length > 1 ? 's' : ''} {it.nightsWithoutLodging.map((n) => n + 1).join(', ')}.
          {selectedLodging.length > 1 && ' Set each lodging’s check-in day and number of nights (Edit → “How many”).'}
        </Banner>
      )}
      {it.doubleBooked.length > 0 && <Banner tone="warn">Two places are booked for night {it.doubleBooked.map((n) => n + 1).join(', ')}.</Banner>}

      {selectedLodging.length > 1 && (
        <div className="card">
          <h3>Where you're staying</h3>
          {selectedLodging.map((c) => (
            <div key={c.id} className="row">
              <span>
                ⌂ {c.name} <span className="muted small">· {c.units ?? shape.nights} nights</span>
              </span>
              {dayPicker(c)}
            </div>
          ))}
        </div>
      )}

      {it.unscheduled.filter((c) => c.category !== 'lodging').length > 0 && (
        <div className="card unscheduled">
          <h3>Chosen but not yet on a day</h3>
          {it.unscheduled
            .filter((c) => c.category !== 'lodging')
            .map((c) => (
              <div key={c.id} className="row">
                <span>
                  {CATEGORIES.find((x) => x.id === c.category)!.icon} {c.name}
                </span>
                {dayPicker(c)}
              </div>
            ))}
          <p className="small muted">Car rentals and meal budgets can stay unscheduled — they still count toward the budget.</p>
        </div>
      )}

      <ol className="days">
        {it.days.map((d) => (
          <li key={d.index} className="day card">
            <div className="day-head">
              <span className="day-num">Day {d.index + 1}</span>
              <span className="day-date">{formatDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              {d.lodging ? <span className="tag">⌂ {d.lodging.name}</span> : d.index === shape.nights ? <span className="tag">Travel home</span> : null}
            </div>
            {d.items.length > 0 && (
              <ul className="day-items">
                {d.items.map((c) => (
                  <li key={c.id}>
                    <span>
                      {CATEGORIES.find((x) => x.id === c.category)!.icon} {c.name}
                      {c.location && <span className="muted small"> · {c.location}</span>}
                    </span>
                    <span className="day-item-right">
                      <Money amount={candidateCost(c, shape)} currency={trip.currency} />
                      {dayPicker(c)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <textarea rows={2} value={d.note} onChange={(e) => setNote(d.index, e.target.value)} placeholder="Free time, a market to wander, where to eat…" aria-label={`Notes for day ${d.index + 1}`} />
          </li>
        ))}
      </ol>
      <div className="actions">
        <a className="btn btn-primary" href={href({ page: 'print', id: trip.id })}>
          See the one-sheet →
        </a>
      </div>
    </div>
  );
}
