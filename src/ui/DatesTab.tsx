import { chosenDate, nightsBetween } from '../domain/budget';
import type { Availability, TripConstraints } from '../domain/types';
import { setWindowStatus } from '../domain/windows';
import { useStore } from '../state/store';
import { Banner, formatDate, formatLocalTime } from './common';
import { href } from './router';
import type { TabProps } from './TripView';
import { AvailabilityCard } from './AvailabilityCard';
import { EstimatesCard } from './EstimatesCard';
import { WindowsCard } from './WindowsCard';
import { ManualDates } from './ManualDates';

export function DatesTab({ trip, update }: TabProps) {
  const { data } = useStore();
  const av: Availability = trip.availability ?? { earliestDeparture: '', latestReturn: '', preferredRanges: [], excludedRanges: [] };
  const cons: TripConstraints = trip.constraints ?? {
    departureAirport: data.profile.homeAirport,
    minNights: null,
    preferredNights: null,
    maxNights: null,
  };
  const setAv = (p: Partial<Availability>) => update((t) => ({ ...t, availability: { ...av, ...p } }));
  const setCons = (p: Partial<TripConstraints>) => update((t) => ({ ...t, constraints: { ...cons, ...p } }));
  const span = nightsBetween(av.earliestDeparture, av.latestReturn);
  const locked = chosenDate(trip);
  const lockedNights = locked ? nightsBetween(locked.start, locked.end) : null;
  const legacy = trip.dateOptions.filter((d) => d.legacyAvailability);

  return (
    <div className="stack">
      <div className="intro">
        <h2>When &amp; how long</h2>
        <p className="muted">
          Tell ORIVOIR when you <em>could</em> travel. It finds the vacation windows — dates and trip length — that fit your budget. Nothing
          is costed over your whole availability.
        </p>
      </div>

      {legacy.length > 0 && (
        <Banner tone="info">
          Your earlier date range (
          {legacy
            .map((d) => `${formatDate(d.start)} – ${formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}`)
            .join(', ')}
          ) is now treated as your <strong>availability</strong>, not a {nightsBetween(legacy[0].start, legacy[0].end)}-night trip. Costs
          based on it have been cleared; nothing was deleted.
        </Banner>
      )}

      {locked && (
        <div className="card locked-card">
          <p className="eyebrow">Trip dates in use</p>
          <h3>
            {formatDate(locked.start, { weekday: 'short', month: 'long', day: 'numeric' })}
            {locked.end !== locked.start &&
              ` – ${formatDate(locked.end, { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {locked.startTime && ` · ${formatLocalTime(locked.startTime)}`}
            {locked.endTime && `–${formatLocalTime(locked.endTime)}`}
            {lockedNights !== null && lockedNights > 0 && ` · ${lockedNights} nights`}
          </h3>
          <p className="muted small">{locked.notes}</p>
          <div className="actions">
            <a className="btn btn-primary btn-small" href={href({ page: 'trip', id: trip.id, tab: 'explore' })}>
              Plan stays &amp; experiences →
            </a>
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() =>
                update((t) =>
                  locked.fromWindowId ? setWindowStatus(t, locked.fromWindowId, 'kept') : { ...t, chosenDateId: null },
                )
              }
            >
              Unlock these dates
            </button>
          </div>
        </div>
      )}

      <AvailabilityCard av={av} cons={cons} setAv={setAv} setCons={setCons} span={span} />

      <EstimatesCard trip={trip} update={update} />

      <WindowsCard trip={trip} update={update} />

      <details className="card">
        <summary>Already know your exact dates? Enter them directly</summary>
        <ManualDates trip={trip} update={update} />
      </details>
    </div>
  );
}
