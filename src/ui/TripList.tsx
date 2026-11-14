import { chosenDate, nightsBetween, summarize } from '../domain/budget';
import { useStore } from '../state/store';
import { BudgetMeter } from './BudgetPanel';
import { formatDate, Money } from './common';
import { href } from './router';

export function TripList() {
  const { data } = useStore();
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Family travel planner</p>
        <h1>Where to next?</h1>
        <p className="lede">
          Start with a place, a budget, who's coming and a few possible dates. ATLAS keeps the research, the choices and the
          numbers together until you're ready to print the plan.
        </p>
        <a className="btn btn-primary btn-lg" href={href({ page: 'new' })}>
          + Plan a new trip
        </a>
      </section>

      {data.trips.length === 0 ? (
        <div className="empty">
          <div className="empty-globe" aria-hidden>
            ◎
          </div>
          <p>No trips yet. Your trips appear here and are saved automatically.</p>
        </div>
      ) : (
        <section>
          <h2 className="section-title">Your trips</h2>
          <div className="trip-grid">
            {data.trips.map((t) => {
              const s = summarize(t);
              const d = chosenDate(t);
              const n = d ? nightsBetween(d.start, d.end) : null;
              const selected = t.candidates.filter((c) => c.status === 'selected').length;
              return (
                <a key={t.id} className="trip-card" href={href({ page: 'trip', id: t.id, tab: 'plan' })}>
                  <div className="trip-card-top">
                    <span className="trip-card-region">{t.region || 'Trip'}</span>
                    <h3>{t.name}</h3>
                    <p className="muted">{t.destination}</p>
                  </div>
                  <dl className="trip-card-facts">
                    <div>
                      <dt>When</dt>
                      <dd>
                        {d
                          ? `${formatDate(d.start)} – ${formatDate(d.end, { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : t.availability
                            ? `Available ${formatDate(t.availability.earliestDeparture)} – ${formatDate(t.availability.latestReturn)} · dates not set`
                            : 'Dates not set'}
                        {n !== null && <span className="muted"> · {n} nights</span>}
                      </dd>
                    </div>
                    <div>
                      <dt>Who</dt>
                      <dd>{t.travelers.adults + t.travelers.children} travelers</dd>
                    </div>
                    <div>
                      <dt>Chosen</dt>
                      <dd>{selected} items</dd>
                    </div>
                  </dl>
                  <BudgetMeter summary={s} currency={t.currency} compact />
                  <p className="trip-card-remaining">
                    <Money amount={s.remaining} currency={t.currency} /> left of{' '}
                    <Money amount={t.budgetTotal} currency={t.currency} />
                  </p>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
