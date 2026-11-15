import { chosenDate, nightsBetween, summarize } from '../domain/budget';
import type { Trip } from '../domain/types';
import { useStore } from '../state/store';
import { BudgetMeter } from './BudgetPanel';
import { formatDate, Money } from './common';
import { href } from './router';
import { StormScene, TripScene } from './Scenes';

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function whenText(t: Trip): string {
  const d = chosenDate(t);
  if (d) return `${formatDate(d.start)} – ${formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  if (t.availability) return `Available ${formatDate(t.availability.earliestDeparture)} – ${formatDate(t.availability.latestReturn)} · dates not set`;
  return 'Dates not set';
}

/** Photo-style trip card: landscape, name, dates, prism edge. */
function TripCard({ t, detailed }: { t: Trip; detailed?: boolean }) {
  const s = summarize(t);
  const d = chosenDate(t);
  const n = d ? nightsBetween(d.start, d.end) : null;
  return (
    <a className="trip-card scene-card" href={href({ page: 'trip', id: t.id, tab: 'plan' })}>
      <TripScene id={t.id} />
      <span className="scene-shade" aria-hidden="true" />
      <span className="more-btn" aria-hidden="true">
        •••
      </span>
      <div className="scene-card-body">
        {t.region && <span className="trip-card-region">{t.region}</span>}
        <h3>{t.name}</h3>
        <p className="scene-when">
          <CalendarIcon /> {whenText(t)}
          {n !== null && <span> · {n} nights</span>}
        </p>
        {detailed && (
          <>
            <BudgetMeter summary={s} currency={t.currency} compact />
            <p className="trip-card-remaining">
              {d ? (
                <>
                  <Money amount={s.remaining} currency={t.currency} /> left of <Money amount={t.budgetTotal} currency={t.currency} />
                </>
              ) : (
                <>
                  Budget <Money amount={t.budgetTotal} currency={t.currency} /> · {t.travelers.adults + t.travelers.children} travelers
                </>
              )}
            </p>
          </>
        )}
      </div>
    </a>
  );
}

function sortTrips(trips: Trip[]): Trip[] {
  // Trips with locked dates first (soonest first), then the rest by most recently edited.
  return [...trips].sort((a, b) => {
    const da = chosenDate(a)?.start;
    const db = chosenDate(b)?.start;
    if (da && db) return da.localeCompare(db);
    if (da) return -1;
    if (db) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function TripList() {
  const { data } = useStore();
  const trips = sortTrips(data.trips);
  return (
    <div className="page home">
      <section className="hero-card">
        <StormScene />
        <div className="hero-copy">
          <h1 className="hero-title">
            The world is <span className="accent">waiting.</span>
          </h1>
          <a className="btn btn-primary btn-lg" href={href({ page: 'new' })}>
            Plan a trip <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <div className="section-head">
        <h2 className="label-wide">Upcoming trips</h2>
        {trips.length > 0 && (
          <a className="view-all" href={href({ page: 'all' })}>
            View all <span aria-hidden="true">→</span>
          </a>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="empty">
          <p>No trips yet. Your trips appear here and are saved automatically.</p>
        </div>
      ) : (
        <div className="trip-rail">
          {trips.slice(0, 6).map((t) => (
            <TripCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AllTrips() {
  const { data } = useStore();
  const trips = sortTrips(data.trips);
  return (
    <div className="page">
      <div className="section-head">
        <h1>All trips</h1>
        <a className="btn btn-primary" href={href({ page: 'new' })}>
          Plan a trip <span aria-hidden="true">→</span>
        </a>
      </div>
      {trips.length === 0 ? (
        <div className="empty">
          <p>No trips yet.</p>
        </div>
      ) : (
        <div className="trip-grid">
          {trips.map((t) => (
            <TripCard key={t.id} t={t} detailed />
          ))}
        </div>
      )}
    </div>
  );
}
