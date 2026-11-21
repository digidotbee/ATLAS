import { chosenDate } from '../domain/budget';
import type { Trip } from '../domain/types';
import { useStore } from '../state/store';
import { BudgetPanel } from './BudgetPanel';
import { BudgetPill, BudgetTab } from './BudgetTab';
import { DatesTab } from './DatesTab';
import { ExploreTab } from './ExploreTab';
import { ItineraryTab } from './ItineraryTab';
import { PlanTab } from './PlanTab';
import { href, type TripTab } from './router';
import { SetupTab } from './SetupTab';
import { SyncBadge } from './SyncBadge';

const TABS: { id: TripTab; label: string; short: string; hint: string }[] = [
  { id: 'plan', label: '1 · Shape it', short: 'Shape', hint: 'Follow-up questions' },
  { id: 'dates', label: '2 · When & how long', short: 'When', hint: 'Find vacation windows' },
  { id: 'explore', label: '3 · Explore', short: 'Explore', hint: 'Options & choices' },
  { id: 'itinerary', label: '4 · Itinerary', short: 'Itinerary', hint: 'Day by day' },
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
        <h1>Venture not found</h1>
        <p>It may have been deleted, or it hasn't synced to this device yet.</p>
        <a className="btn" href={href({ page: 'trips' })}>
          Back to Ventures
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
            ← All Ventures
          </a>
          <h1>{trip.name}</h1>
          {/* Subtitle only when it adds something beyond the trip name */}
          {(() => {
            const parts = [trip.destination.trim() !== trip.name.trim() ? trip.destination : '', trip.region].filter(Boolean);
            return parts.length > 0 ? <p className="muted">{parts.join(' · ')}</p> : null;
          })()}
          <BudgetPill trip={trip} active={tab === 'budget'} />
          <SyncBadge />
        </div>
        <div className="trip-header-actions">
          <a className={`btn btn-ghost ${tab === 'setup' ? 'active' : ''}`} href={href({ page: 'trip', id: trip.id, tab: 'setup' })}>
            ⚙ Venture settings
          </a>
          <a className={`btn ${chosenDate(trip) ? 'btn-primary' : ''}`} href={href({ page: 'print', id: trip.id })}>
            Print one-sheet
          </a>
        </div>
      </header>
      <nav className="tabs" aria-label="Venture planning steps">
        {TABS.map((t) => (
          <a key={t.id} href={href({ page: 'trip', id: trip.id, tab: t.id })} className={`tab ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
            <span className="tab-long">{t.label}</span>
            <span className="tab-short">
              <b>{t.label.slice(0, 1)}</b> {t.short}
            </span>
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
          {tab === 'budget' && <BudgetTab {...props} />}
        </main>
        <BudgetPanel trip={trip} />
      </div>
    </div>
  );
}
