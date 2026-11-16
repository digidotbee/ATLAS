import { candidateCost, chosenDate, summarize } from '../domain/budget';
import { buildItinerary } from '../domain/itinerary';
import { FOLLOW_UP_QUESTIONS } from '../domain/questions';
import { CATEGORIES, type Candidate } from '../domain/types';
import { useStore } from '../state/store';
import { formatDate, Money } from './common';
import { href } from './router';

/** The printable one-page itinerary. Uses print CSS to fit a single Letter/A4 sheet. */
export function PrintView({ id }: { id: string }) {
  const { data } = useStore();
  const trip = data.trips.find((t) => t.id === id);
  if (!trip) {
    return (
      <div className="page narrow">
        <h1>Trip not found</h1>
        <a href={href({ page: 'trips' })}>Back to trips</a>
      </div>
    );
  }
  const s = summarize(trip);
  const d = chosenDate(trip);
  const it = buildItinerary(trip);
  const cur = trip.currency;
  const selected = trip.candidates.filter((c) => c.status === 'selected');
  const byCat = (cat: Candidate['category']) => selected.filter((c) => c.category === cat);
  const est = (c: { priceStatus: string } | { status: string }) => ('priceStatus' in c ? c.priceStatus : c.status) !== 'verified';
  const highlights = FOLLOW_UP_QUESTIONS.filter((q) => ['purpose', 'mustDo'].includes(q.id) && trip.answers[q.id]?.trim());

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <a className="btn btn-ghost" href={href({ page: 'trip', id: trip.id, tab: 'itinerary' })}>
          ← Back to planning
        </a>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className="sheet">
        <header className="sheet-head">
          <div>
            <p className="sheet-brand">ORIVOIR · {data.profile.familyName ? `${data.profile.familyName} family` : 'Family'} itinerary</p>
            <h1>{trip.name}</h1>
            <p>
              {trip.destination}
              {d && (
                <>
                  {' · '}
                  {formatDate(d.start, { weekday: 'short', month: 'short', day: 'numeric' })} – {formatDate(d.end, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {s.shape.nights} nights
                </>
              )}
              {' · '}
              {s.shape.people} travelers
            </p>
          </div>
          <div className={`sheet-remaining ${s.remaining !== null && s.remaining < 0 ? 'over' : ''}`}>
            <span>{s.remaining === null ? 'Tracked spend' : s.remaining < 0 ? 'Over budget' : 'Remaining'}</span>
            <strong>
              <Money amount={s.remaining === null ? s.committed : Math.abs(s.remaining)} currency={cur} />
            </strong>
            <span>{s.budget === null ? 'No budget target' : <>of <Money amount={s.budget} currency={cur} /></>}</span>
          </div>
        </header>

        {highlights.length > 0 && (
          <p className="sheet-highlights">
            {highlights.map((q) => (
              <span key={q.id}>
                <b>{q.id === 'purpose' ? 'The idea:' : 'Must-dos:'}</b> {trip.answers[q.id]}{' '}
              </span>
            ))}
          </p>
        )}

        <div className="sheet-cols">
          <section>
            <h2>Budget</h2>
            <table className="sheet-table">
              <tbody>
                {CATEGORIES.filter((c) => s.byCategory[c.id] > 0).map((c) => (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td className="num">
                      <Money amount={s.byCategory[c.id]} currency={cur} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Cushion ({trip.contingencyPct}%)</td>
                  <td className="num">
                    <Money amount={s.contingency} currency={cur} />
                  </td>
                </tr>
                <tr className="total">
                  <td>Projected total</td>
                  <td className="num">
                    <Money amount={s.committed + s.contingency} currency={cur} />
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="sheet-note">
              Verified <Money amount={s.verified} currency={cur} /> · Estimated <Money amount={s.estimated} currency={cur} /> (marked ≈)
            </p>

            <h2>Staying</h2>
            {byCat('lodging').length === 0 ? (
              <p className="sheet-note">Not chosen yet.</p>
            ) : (
              <ul className="sheet-list">
                {byCat('lodging').map((c) => (
                  <Line key={c.id} c={c} cost={candidateCost(c, s.shape)} cur={cur} est={est(c)} />
                ))}
              </ul>
            )}

            <h2>Getting there & around</h2>
            <ul className="sheet-list">
              {s.lines
                .filter((l) => l.candidateId === null && (l.category === 'flights' || l.key.startsWith('move-')))
                .map((l) => (
                  <li key={l.key}>
                    <span>{l.label}</span>
                    <span className="num">
                      {l.status !== 'verified' && '≈ '}
                      <Money amount={l.amount} currency={cur} />
                    </span>
                  </li>
                ))}
              {[...byCat('flights'), ...byCat('transport')].map((c) => (
                <Line key={c.id} c={c} cost={candidateCost(c, s.shape)} cur={cur} est={est(c)} />
              ))}
            </ul>

            {[...byCat('food'), ...byCat('other')].length > 0 && (
              <>
                <h2>Food & other</h2>
                <ul className="sheet-list">
                  {[...byCat('food'), ...byCat('other')].map((c) => (
                    <Line key={c.id} c={c} cost={candidateCost(c, s.shape)} cur={cur} est={est(c)} />
                  ))}
                </ul>
              </>
            )}
          </section>

          <section>
            <h2>Day by day</h2>
            {!it ? (
              <p className="sheet-note">Choose dates to see the day-by-day plan.</p>
            ) : (
              <ol className="sheet-days">
                {it.days.map((day) => (
                  <li key={day.index}>
                    <div className="sheet-day-head">
                      <b>{formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</b>
                      {day.lodging && <span> · {day.lodging.name}</span>}
                    </div>
                    {day.legs.map((l) => (
                      <div key={l.key} className="sheet-day-item sheet-leg">
                        {l.kind === 'arrive' ? `Arrive → ${l.to}` : l.kind === 'depart' ? `${l.from} → airport` : `Move ${l.from} → ${l.to}`}
                        {l.move.mode && ` by ${l.move.mode}`}
                        {l.move.hours !== null && ` (~${l.move.hours} h)`}
                        {l.kind === 'move' && ` · out by ${l.move.checkout}`}
                      </div>
                    ))}
                    {day.items.map((c) => (
                      <div key={c.id} className="sheet-day-item">
                        {c.name}
                        {c.location && <span className="muted"> ({c.location})</span>}
                      </div>
                    ))}
                    {day.note && <div className="sheet-day-note">{day.note}</div>}
                    {day.items.length === 0 && day.legs.length === 0 && !day.note && (
                      <div className="sheet-day-note">{day.index === s.shape.nights ? 'Travel home' : 'Free to explore'}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {it && it.unscheduled.filter((c) => c.category === 'activities').length > 0 && (
              <p className="sheet-note">
                <b>Also planned:</b> {it.unscheduled.filter((c) => c.category === 'activities').map((c) => c.name).join(', ')}
              </p>
            )}
          </section>
        </div>
        <footer className="sheet-foot">
          ≈ = estimated price · Prepared {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </footer>
      </article>
    </div>
  );
}

function Line({ c, cost, cur, est }: { c: Candidate; cost: number; cur: string; est: boolean }) {
  return (
    <li>
      <span>
        {c.name}
        {c.location && <span className="muted"> · {c.location}</span>}
      </span>
      <span className="num">
        {est && '≈ '}
        <Money amount={cost} currency={cur} />
      </span>
    </li>
  );
}
