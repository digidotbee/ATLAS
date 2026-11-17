import { useState } from 'react';
import { nightsBetween } from '../domain/budget';
import { blankDateOption } from '../domain/factory';
import { Field, NumberInput } from './common';
import { CalendarPicker } from './CalendarPicker';
import type { TabProps } from './TripView';

export function ManualDates({ update }: TabProps) {
  const [d, setD] = useState(blankDateOption());
  const n = nightsBetween(d.start, d.end);
  return (
    <div className="stack-sm">
      <p className="small muted">Arrival at your destination to the day you leave it.</p>
      <div className="grid-2">
        <CalendarPicker
          label="Trip dates"
          mode="range"
          start={d.start}
          end={d.end}
          startLabel="Arrive"
          endLabel="Leave"
          onChange={(start, end = '') => setD({ ...d, start, end })}
        />
        <Field label="Airfare per person">
          <NumberInput value={d.flightPerPerson} onChange={(v) => setD({ ...d, flightPerPerson: v })} aria-label="Manual airfare per person" />
        </Field>
      </div>
      {n !== null && <p className="small muted">{n} nights</p>}
      <button
        type="button"
        className="btn btn-small"
        disabled={n === null || n < 1}
        onClick={() => {
          const opt = { ...d, label: d.label || `${n} nights` };
          update((t) => ({ ...t, dateOptions: [...t.dateOptions, opt], chosenDateId: opt.id }));
          setD(blankDateOption());
        }}
      >
        Use these dates
      </button>
    </div>
  );
}
