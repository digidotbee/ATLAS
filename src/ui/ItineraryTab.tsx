import { candidateCost, tripShape } from '../domain/budget';
import { buildItinerary } from '../domain/itinerary';
import { legLabel, legTimeline, type TravelLeg } from '../domain/moves';
import { CATEGORIES, type Candidate, type Move } from '../domain/types';
import { Banner, Field, formatDate, Money, NumberInput, PriceBadge } from './common';
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
  const setMove = (l: TravelLeg, patch: Partial<Move>) =>
    update((t) => ({ ...t, moves: { ...(t.moves ?? {}), [l.key]: { ...l.move, ...patch } } }));
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
      {it.baseMismatches.map((m) => (
        <Banner key={`${m.day}-${m.item.id}`} tone="warn">
          Day {m.day + 1}: “{m.item.name}” is planned from {m.itemBase}, but you're staying in {m.stayBase} that night. Move it to a day
          when you're in {m.itemBase}, or set it aside.
        </Banner>
      ))}
      {it.doubleBooked.length > 0 && <Banner tone="warn">Two places are booked for night {it.doubleBooked.map((n) => n + 1).join(', ')}.</Banner>}

      {selectedLodging.length > 1 && (
        <div className="card">
          <h3>Where you're staying</h3>
          {selectedLodging.map((c) => (
            <div key={c.id} className="row">
              <span>
                ⌂ {c.name}
                {c.base && <span className="base-label"> · ⌖ {c.base}</span>}
                <span className="muted small"> · {c.units ?? shape.nights} nights</span>
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
            {d.legs.map((l) => (
              <LegPanel key={l.key} leg={l} currency={trip.currency} people={shape.people} onChange={(p) => setMove(l, p)} />
            ))}
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

function LegPanel({ leg, currency, people, onChange }: { leg: TravelLeg; currency: string; people: number; onChange: (p: Partial<Move>) => void }) {
  const m = leg.move;
  return (
    <div className="leg">
      <div className="leg-head">
        <strong>⇄ {legLabel(leg)}</strong>
        <span className="leg-cost">
          {leg.cost === null ? <span className="warn-text small">costs not entered</span> : <Money amount={leg.cost} currency={currency} />}
          <PriceBadge status={m.priceStatus} onToggle={() => onChange({ priceStatus: m.priceStatus === 'verified' ? 'estimated' : 'verified' })} />
        </span>
      </div>
      <ol className="leg-steps">
        {legTimeline(leg).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <details>
        <summary>Edit travel time & costs (per person × {people})</summary>
        <div className="grid-4">
          <Field label="Ride">
            <input value={m.mode} onChange={(e) => onChange({ mode: e.target.value })} placeholder="e.g. Shinkansen" />
          </Field>
          <Field label="Ride fare">
            <NumberInput value={m.ridePerPerson} onChange={(v) => onChange({ ridePerPerson: v })} aria-label="Ride fare per person" />
          </Field>
          <Field label="Taxi / bus / subway">
            <NumberInput value={m.localPerPerson} onChange={(v) => onChange({ localPerPerson: v })} aria-label="Local transfer per person" />
          </Field>
          <Field label="Food on the way">
            <NumberInput value={m.mealPerPerson} onChange={(v) => onChange({ mealPerPerson: v })} aria-label="Meal per person" />
          </Field>
        </div>
        <div className="grid-4">
          <Field label="Door to door (hours)" hint="Packing, station, ride, transfer">
            <NumberInput value={m.hours} step={0.5} onChange={(v) => onChange({ hours: v })} aria-label="Hours door to door" />
          </Field>
          {leg.kind !== 'arrive' && (
            <Field label="Check out by">
              <input type="time" value={m.checkout} onChange={(e) => onChange({ checkout: e.target.value })} />
            </Field>
          )}
          {leg.kind !== 'depart' && (
            <Field label="Check in from">
              <input type="time" value={m.checkin} onChange={(e) => onChange({ checkin: e.target.value })} />
            </Field>
          )}
          <Field label="Notes">
            <input value={m.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Seat reservations, luggage…" />
          </Field>
        </div>
      </details>
      {m.notes && <p className="small muted">{m.notes}</p>}
    </div>
  );
}
