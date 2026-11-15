import { useEffect, useRef, useState } from 'react';
import { chosenDate, nightsBetween, summarize } from '../domain/budget';
import { duplicateTrip } from '../domain/factory';
import type { Trip } from '../domain/types';
import { useStore } from '../state/store';
import { BudgetMeter } from './BudgetPanel';
import { formatDate, Money } from './common';
import { go, href } from './router';

type Status = { key: 'booked' | 'dates' | 'planning' | 'draft'; label: string };

/** Booked = dates locked and every chosen price verified; Dates set; In planning; Draft. */
export function tripStatus(t: Trip): Status {
  const d = chosenDate(t);
  if (d) {
    const selected = t.candidates.filter((c) => c.status === 'selected');
    const flightOk = selected.some((c) => c.category === 'flights') || d.flightStatus === 'verified';
    if (selected.length > 0 && flightOk && selected.every((c) => c.priceStatus === 'verified')) return { key: 'booked', label: 'Booked' };
    return { key: 'dates', label: 'Dates set' };
  }
  if (t.availability || (t.windows ?? []).length > 0) return { key: 'planning', label: 'In planning' };
  return { key: 'draft', label: 'Draft' };
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function whenText(t: Trip): string {
  const d = chosenDate(t);
  if (d) {
    const n = nightsBetween(d.start, d.end);
    return `${formatDate(d.start)} – ${formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}${n !== null ? ` · ${n} nights` : ''}`;
  }
  if (t.availability) return `Available ${formatDate(t.availability.earliestDeparture)} – ${formatDate(t.availability.latestReturn)}`;
  return 'Dates not set';
}

function TripMenu({ t }: { t: Trip }) {
  const { addTrip, deleteTrip } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="trip-menu" ref={ref}>
      <button type="button" className="more-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Actions for ${t.name}`} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="trip-menu-list" role="menu">
          <a role="menuitem" href={href({ page: 'trip', id: t.id, tab: 'plan' })}>
            Open
          </a>
          <a role="menuitem" href={href({ page: 'print', id: t.id })}>
            Print one-sheet
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const copy = duplicateTrip(t);
              addTrip(copy);
              setOpen(false);
              go({ page: 'trip', id: copy.id, tab: 'plan' });
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              if (confirm(`Delete “${t.name}” and all its research? This can't be undone.`)) deleteTrip(t.id);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/** Cold-side data card: flat, hairline, radius-xs. `featured` adds shadow-prism. */
function TripCard({ t, featured }: { t: Trip; featured?: boolean }) {
  const status = tripStatus(t);
  const d = chosenDate(t);
  const s = summarize(t);
  return (
    <article className={`trip-row${featured ? ' featured' : ''}`}>
      <div className="trip-row-main">
        {featured ? <span className="eyebrow">Next venture</span> : t.region && <span className="trip-row-region">{t.region}</span>}
        <h3>
          <a className="stretched" href={href({ page: 'trip', id: t.id, tab: 'plan' })}>
            {t.name}
          </a>
        </h3>
        <p className="trip-row-when">
          <CalendarIcon />
          <span>{whenText(t)}</span>
        </p>
      </div>
      <div className="trip-row-side">
        <span className={`chip chip-${status.key}`}>{status.label}</span>
        {d ? (
          <div className="trip-row-budget">
            <BudgetMeter summary={s} currency={t.currency} compact />
            <span className={s.remaining < 0 ? 'over' : s.remaining < t.budgetTotal * 0.1 ? 'low' : ''}>
              <Money amount={s.remaining} currency={t.currency} /> left of <Money amount={t.budgetTotal} currency={t.currency} />
            </span>
          </div>
        ) : (
          <span className="trip-row-budget muted">
            <Money amount={t.budgetTotal} currency={t.currency} /> · {t.travelers.adults + t.travelers.children} travelers
          </span>
        )}
      </div>
      <TripMenu t={t} />
    </article>
  );
}

function split(trips: Trip[]) {
  const upcoming = trips.filter((t) => chosenDate(t)).sort((a, b) => chosenDate(a)!.start.localeCompare(chosenDate(b)!.start));
  const planning = trips.filter((t) => !chosenDate(t)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { upcoming, planning };
}

export function TripList() {
  const { data } = useStore();
  const { upcoming, planning } = split(data.trips);
  const [next, ...laterTrips] = upcoming;
  return (
    <div className="page home">
      <section className="hero-card">
        <div className="hero-copy">
          <h1 className="hero-title">
            The world <span className="accent">awaits.</span>
          </h1>
          <a className="btn btn-primary btn-lg" href={href({ page: 'new' })}>
            Make A Plan <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {data.trips.length === 0 ? (
        <div className="empty home-empty">
          <p>No ventures yet. Your ventures appear here and are saved automatically.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="trip-section">
              <div className="section-head">
                <h2 className="section-label">Upcoming · {upcoming.length}</h2>
                <a className="view-all" href={href({ page: 'all' })}>
                  View all <span aria-hidden="true">→</span>
                </a>
              </div>
              <TripCard t={next} featured />
              {laterTrips.length > 0 && (
                <div className="trip-stack">
                  {laterTrips.map((t) => (
                    <TripCard key={t.id} t={t} />
                  ))}
                </div>
              )}
            </section>
          )}
          {planning.length > 0 && (
            <section className="trip-section">
              <div className="section-head">
                <h2 className="section-label">In planning · {planning.length}</h2>
                {upcoming.length === 0 && (
                  <a className="view-all" href={href({ page: 'all' })}>
                    View all <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
              <div className="trip-stack">
                {planning.map((t) => (
                  <TripCard key={t.id} t={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function AllTrips() {
  const { data } = useStore();
  const { upcoming, planning } = split(data.trips);
  return (
    <div className="page home">
      <div className="section-head">
        <h1>All ventures</h1>
        <a className="btn btn-primary" href={href({ page: 'new' })}>
          Make A Plan <span aria-hidden="true">→</span>
        </a>
      </div>
      {data.trips.length === 0 ? (
        <div className="empty">
          <p>No ventures yet.</p>
        </div>
      ) : (
        <div className="trip-list">
          {[...upcoming, ...planning].map((t) => (
            <TripCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
