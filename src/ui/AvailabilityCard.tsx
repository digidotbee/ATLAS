import { useState } from 'react';
import { newId } from '../domain/factory';
import { deviceTimeZone, plannerZoneSuffix, timeZoneOptionLabel } from '../domain/timeZone';
import type { Availability, DateRange, TripConstraints } from '../domain/types';
import { Field, formatDate, formatDateTimeLocal, NumberInput } from './common';
import { CalendarPicker } from './CalendarPicker';
import { StageHead } from './StageHead';

export interface AvailabilityCardProps {
  av: Availability;
  cons: TripConstraints;
  setAv: (p: Partial<Availability>) => void;
  setCons: (p: Partial<TripConstraints>) => void;
  span: number | null;
  /** The Venture's IANA time zone (D10); Opt in by is a clock time in it. */
  timeZone: string;
}

const fmt = (iso: string) => formatDate(iso, { weekday: 'short', month: 'short', day: 'numeric' });

export function RangeList({
  label,
  ranges,
  onChange,
}: {
  label: string;
  ranges: DateRange[];
  onChange: (r: DateRange[]) => void;
}) {
  // Stable row keys (ranges have no ids), so each calendar keeps its own state when a row is removed.
  const [keys, setKeys] = useState(() => ranges.map(() => newId()));
  if (keys.length !== ranges.length) {
    // The list changed from elsewhere (e.g. a sync): keep existing keys, add or trim the rest.
    setKeys([...keys.slice(0, ranges.length), ...Array.from({ length: Math.max(0, ranges.length - keys.length) }, () => newId())]);
  }
  const remove = (i: number) => {
    setKeys(keys.filter((_, j) => j !== i));
    onChange(ranges.filter((_, j) => j !== i));
  };
  const add = () => {
    setKeys([...keys, newId()]);
    onChange([...ranges, { start: '', end: '' }]);
  };
  return (
    <div className="stack-sm">
      <span className="field-label">{label}</span>
      {ranges.map((r, i) => (
        <div key={keys[i] ?? i} className="range-calendar-row">
          <CalendarPicker
            label={`${label} ${i + 1}`}
            mode="range"
            start={r.start}
            end={r.end}
            onChange={(start, end = '') => onChange(ranges.map((x, j) => (j === i ? { start, end } : x)))}
          />
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => remove(i)}
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-small" onClick={add}>
        + Add
      </button>
    </div>
  );
}

export function AvailabilityCard({ av, cons, setAv, setCons, span, timeZone }: AvailabilityCardProps) {
  const done = span !== null && span > 0;
  const [editing, setEditing] = useState(!done);
  const lengthText =
    cons.minNights || cons.maxNights || cons.preferredNights
      ? [
          cons.minNights || cons.maxNights ? `${cons.minNights ?? 1}–${cons.maxNights ?? 'any'} nights` : '',
          cons.preferredNights ? `ideally ${cons.preferredNights}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : 'any length — ORIVOIR suggests';

  return (
    <section className="card stage">
      <StageHead n={1} title="When you could travel" done={done && !editing}>
        {done && !editing && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </StageHead>
      {done && !editing ? (
        <dl className="summary">
          <div>
            <dt>Leave on or after</dt>
            <dd>{fmt(av.earliestDeparture)}</dd>
          </div>
          <div>
            <dt>Back by</dt>
            <dd>{fmt(av.latestReturn)}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{lengthText}</dd>
          </div>
          {av.idealDuration && (
            <div>
              <dt>Ideal length</dt>
              <dd>{av.idealDuration}</dd>
            </div>
          )}
          {av.optInBy && (
            <div>
              <dt>Opt in by</dt>
              <dd>
                {formatDateTimeLocal(av.optInBy)}
                {av.optInBy.includes('T') && plannerZoneSuffix(timeZone, av.optInBy)}
              </dd>
            </div>
          )}
          <div>
            <dt>Flying from</dt>
            <dd>{cons.departureAirport || '—'}</dd>
          </div>
          <p className="summary-note">
            {span} nights to choose from — ORIVOIR looks for the best dates <em>inside</em> this range.
          </p>
        </dl>
      ) : (
        <div className="stack-sm">
          <CalendarPicker
            label="Possible date window"
            mode="range"
            start={av.earliestDeparture}
            end={av.latestReturn}
            startLabel="Earliest start"
            endLabel="Latest wrap-up"
            onChange={(earliestDeparture, latestReturn = '') => setAv({ earliestDeparture, latestReturn })}
          />
          <Field label="Ideal length (optional)">
            <input
              value={av.idealDuration ?? ''}
              onChange={(e) => setAv({ idealDuration: e.target.value })}
              placeholder="e.g., 3 hours, 1 weekend, or 5 days"
            />
          </Field>
          <Field label="Opt in by">
            <input type="datetime-local" value={av.optInBy ?? ''} onChange={(e) => setAv({ optInBy: e.target.value })} />
            <span className="field-hint">
              Collaborators must submit their availability before this cutoff to join the planning crew.
              {timeZone !== deviceTimeZone() && ` Clock time in ${timeZoneOptionLabel(timeZone)}.`}
            </span>
          </Field>
          {span !== null && span > 0 && (
            <p className="availability-pill">
              {span} nights to choose from — ORIVOIR looks for the best trip <em>inside</em> this range, not a {span}-night trip.
            </p>
          )}
          <Field label="Departing from">
            <input
              value={cons.departureAirport}
              onChange={(e) => setCons({ departureAirport: e.target.value.toUpperCase() })}
              placeholder="LAS"
            />
          </Field>
          <details className="more" open={Boolean(cons.minNights || cons.maxNights || cons.preferredNights)}>
            <summary>Length (optional)</summary>
            <div className="grid-3">
              <Field label="Shortest" hint="nights">
                <NumberInput value={cons.minNights} min={1} onChange={(v) => setCons({ minNights: v })} aria-label="Minimum nights" />
              </Field>
              <Field label="Ideal" hint="nights">
                <NumberInput
                  value={cons.preferredNights}
                  min={1}
                  onChange={(v) => setCons({ preferredNights: v })}
                  aria-label="Preferred nights"
                />
              </Field>
              <Field label="Longest" hint="nights">
                <NumberInput value={cons.maxNights} min={1} onChange={(v) => setCons({ maxNights: v })} aria-label="Maximum nights" />
              </Field>
            </div>
          </details>
          <details className="more" open={av.preferredRanges.length + av.excludedRanges.length > 0}>
            <summary>Preferred or blocked dates (optional)</summary>
            <div className="stack-sm">
              <RangeList label="Preferred dates" ranges={av.preferredRanges} onChange={(r) => setAv({ preferredRanges: r })} />
              <RangeList label="Dates you can't travel" ranges={av.excludedRanges} onChange={(r) => setAv({ excludedRanges: r })} />
            </div>
          </details>
          {done && (
            <div className="actions">
              <button type="button" className="btn btn-primary btn-small" onClick={() => setEditing(false)}>
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
