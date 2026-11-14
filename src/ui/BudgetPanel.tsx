import { chosenDate, summarize, type BudgetSummary } from '../domain/budget';
import { CATEGORIES, type Trip } from '../domain/types';
import { formatDate, Money } from './common';

/** Stacked bar: verified, estimated, contingency, remaining. */
export function BudgetMeter({ summary: s, currency, compact }: { summary: BudgetSummary; currency: string; compact?: boolean }) {
  const total = Math.max(s.budget, s.committed + s.contingency, 1);
  const pct = (n: number) => `${Math.max(0, (n / total) * 100)}%`;
  const over = s.remaining < 0;
  return (
    <div className={`meter ${compact ? 'meter-compact' : ''}`} role="img" aria-label={`Budget: ${s.committed} committed, ${s.remaining} remaining`}>
      <div className="meter-bar">
        <span className="seg seg-verified" style={{ width: pct(s.verified) }} />
        <span className="seg seg-estimated" style={{ width: pct(s.estimated) }} />
        <span className="seg seg-contingency" style={{ width: pct(s.contingency) }} />
      </div>
      {!compact && (
        <ul className="meter-legend">
          <li>
            <i className="dot seg-verified" /> Verified <Money amount={s.verified} currency={currency} />
          </li>
          <li>
            <i className="dot seg-estimated" /> Estimated <Money amount={s.estimated} currency={currency} />
          </li>
          <li>
            <i className="dot seg-contingency" /> Cushion <Money amount={s.contingency} currency={currency} />
          </li>
          <li className={over ? 'over' : ''}>
            <i className="dot seg-free" /> {over ? 'Over by' : 'Left'} <Money amount={Math.abs(s.remaining)} currency={currency} />
          </li>
        </ul>
      )}
    </div>
  );
}

export function BudgetPanel({ trip }: { trip: Trip }) {
  if (!chosenDate(trip)) {
    const av = trip.availability;
    return (
      <aside className="budget-panel card" aria-label="Budget">
        <p className="eyebrow">Budget</p>
        <div className="budget-big">
          <Money amount={trip.budgetTotal} currency={trip.currency} />
          <span>total, everything included</span>
        </div>
        <p className="muted small">
          {trip.travelers.adults + trip.travelers.children} travelers · {trip.contingencyPct}% cushion
          {av && (
            <>
              <br />
              Available {formatDate(av.earliestDeparture)} – {formatDate(av.latestReturn, { month: 'short', day: 'numeric', year: 'numeric' })}
            </>
          )}
        </p>
        <p className="small">
          No trip dates yet, so nothing is projected. Find and lock a vacation window in <strong>When & how long</strong>.
        </p>
      </aside>
    );
  }
  const s = summarize(trip);
  const over = s.remaining < 0;
  return (
    <aside className="budget-panel card" aria-label="Budget">
      <p className="eyebrow">Budget</p>
      <div className={`budget-big ${over ? 'over' : ''}`}>
        <Money amount={s.remaining} currency={trip.currency} />
        <span>{over ? 'over budget' : 'left to plan'}</span>
      </div>
      <p className="muted small">
        of <Money amount={s.budget} currency={trip.currency} /> · {s.shape.people} people · {s.shape.nights} nights
      </p>
      <BudgetMeter summary={s} currency={trip.currency} />
      <table className="budget-table">
        <tbody>
          {CATEGORIES.map((c) =>
            s.byCategory[c.id] > 0 ? (
              <tr key={c.id}>
                <th>
                  <span className="cat-icon">{c.icon}</span> {c.label}
                </th>
                <td>
                  <Money amount={s.byCategory[c.id]} currency={trip.currency} />
                </td>
              </tr>
            ) : null,
          )}
          <tr className="subtle">
            <th>Cushion ({trip.contingencyPct}%)</th>
            <td>
              <Money amount={s.contingency} currency={trip.currency} />
            </td>
          </tr>
        </tbody>
      </table>
      {s.consideringTotal > 0 && (
        <p className="small muted">
          Still considering: <Money amount={s.consideringTotal} currency={trip.currency} /> if you took everything.
        </p>
      )}
      {s.warnings.map((w) => (
        <p key={w} className="small warn-text">
          {w}
        </p>
      ))}
    </aside>
  );
}
