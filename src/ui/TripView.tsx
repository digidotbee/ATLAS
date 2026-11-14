import type { Trip } from '../domain/types';
import { useStore } from '../state/store';
import { BudgetPanel } from './BudgetPanel';
import { DatesTab } from './DatesTab';
import { ExploreTab } from './ExploreTab';
import { ItineraryTab } from './ItineraryTab';
import { PlanTab } from './PlanTab';
import { href, type TripTab } from './router';
import { SetupTab } from './SetupTab';

const TABS: { id: TripTab; label: string; hint: string }[] = [
  { id: 'plan', label: '1 · Shape it', hint: 'Follow-up questions' },
  { id: 'dates', label: '2 · When & how long', hint: 'Find vacation windows' },
  { id: 'explore', label: '3 · Explore', hint: 'Options & choices' },
  { id: 'itinerary', label: '4 · Itinerary', hint: 'Day by day' },
];

export interface TabProps {
  trip: Trip;
  update: (fn: (t: Trip) => Trip) => void;
}

export function TripView({ id, tab }: { id: string; tab: TripTab }) {
  const { data, updateTrip } = useStore();
  const trip = data.trips.find((t) => t.id === id);
  if (!trip) {
    return (
      <div className="page narrow">
        <h1>Trip not found</h1>
        <p>It may have been deleted, or it hasn't synced to this device yet.</p>
        <a className="btn" href={href({ page: 'trips' })}>
          Back to trips
        </a>
      </div>
    );
  }
  const update = (fn: (t: Trip) => Trip) => updateTrip(trip.id, fn);
  const props = { trip, update };

  return (
    <div className="page wide">
      <header className="trip-header">
        <div>
          <a className="crumb" href={href({ page: 'trips' })}>
            ← All trips
          </a>
          <h1>{trip.name}</h1>
          <p className="muted">
            {trip.destination}
            {trip.region && ` · ${trip.region}`}
          </p>
        </div>
        <div className="trip-header-actions">
          <a className={`btn btn-ghost ${tab === 'setup' ? 'active' : ''}`} href={href({ page: 'trip', id: trip.id, tab: 'setup' })}>
            ⚙ Trip settings
          </a>
          <a className="btn btn-primary" href={href({ page: 'print', id: trip.id })}>
            Print one-sheet
          </a>
        </div>
      </header>
      <nav className="tabs" aria-label="Trip planning steps">
        {TABS.map((t) => (
          <a key={t.id} href={href({ page: 'trip', id: trip.id, tab: t.id })} className={`tab ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
            <span>{t.label}</span>
            <small>{t.hint}</small>
          </a>
        ))}
      </nav>
      <div className="trip-layout">
        <main className="trip-main">
          {tab === 'plan' && <PlanTab {...props} />}
          {tab === 'dates' && <DatesTab {...props} />}
          {tab === 'explore' && <ExploreTab {...props} />}
          {tab === 'itinerary' && <ItineraryTab {...props} />}
          {tab === 'setup' && <SetupTab {...props} />}
        </main>
        <BudgetPanel trip={trip} />
      </div>
    </div>
  );
}
