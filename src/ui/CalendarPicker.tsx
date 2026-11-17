import { useState } from 'react';
import { formatDate, todayISO } from './common';

type CalendarMode = 'single' | 'range';

interface CalendarPickerProps {
  label: string;
  mode: CalendarMode;
  start: string;
  end?: string;
  startLabel?: string;
  endLabel?: string;
  onChange: (start: string, end?: string) => void;
}

function currentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateLabel(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const WEEKDAYS = Array.from({ length: 7 }, (_, index) =>
  new Date(Date.UTC(2023, 0, index + 1)).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
);

export function CalendarPicker({ label, mode, start, end = '', startLabel = 'Start', endLabel = 'End', onChange }: CalendarPickerProps) {
  const now = new Date();
  const today = todayISO();
  const selectedStart = start || today;
  const [month, setMonth] = useState(currentMonth);
  const [activePart, setActivePart] = useState<'start' | 'end'>(() => (mode === 'range' && !end ? 'end' : 'start'));
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const monthTitle = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const atCurrentMonth = year * 12 + monthIndex <= now.getFullYear() * 12 + now.getMonth();
  const cells: (number | null)[] = [
    ...new Array<number | null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function selectDate(value: string) {
    if (value < today) return;
    if (mode === 'single') {
      onChange(value);
    } else if (activePart === 'start') {
      const nextEnd = end && value <= end ? end : '';
      onChange(value, nextEnd);
      setActivePart(nextEnd ? 'start' : 'end');
    } else if (value < selectedStart) {
      onChange(value, '');
      setActivePart('end');
    } else {
      onChange(selectedStart, value);
      setActivePart('start');
    }
  }

  return (
    <div className="calendar-picker" role="group" aria-label={label}>
      <div className="calendar-picker-head">
        <strong className="field-label">{label}</strong>
        <div className="calendar-month-nav">
          <button type="button" className="calendar-nav" aria-label="Previous month" disabled={atCurrentMonth} onClick={() => setMonth(new Date(Date.UTC(year, monthIndex - 1, 1)))}>
            ‹
          </button>
          <span aria-live="polite">{monthTitle}</span>
          <button type="button" className="calendar-nav" aria-label="Next month" onClick={() => setMonth(new Date(Date.UTC(year, monthIndex + 1, 1)))}>
            ›
          </button>
        </div>
      </div>
      <div className="calendar-selection" aria-live="polite">
        {mode === 'single' ? (
          <span>{formatDate(selectedStart, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        ) : (
          <>
            <button type="button" className={`calendar-selection-part ${activePart === 'start' ? 'active' : ''}`} aria-pressed={activePart === 'start'} onClick={() => setActivePart('start')}>
              <b>{startLabel}</b>
              {formatDate(selectedStart, { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            <button type="button" className={`calendar-selection-part ${activePart === 'end' ? 'active' : ''}`} aria-pressed={activePart === 'end'} onClick={() => setActivePart('end')}>
              <b>{endLabel}</b>
              {end ? formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </button>
          </>
        )}
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="calendar-days">
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} aria-hidden="true" />;
          const value = isoDate(year, monthIndex, day);
          const isStart = value === selectedStart && value >= today;
          const isEnd = mode === 'range' && value === end && value >= today;
          const inRange = mode === 'range' && Boolean(selectedStart && end && selectedStart >= today && end >= today && value > selectedStart && value < end);
          const classes = ['calendar-day', isStart || isEnd ? 'selected' : '', inRange ? 'in-range' : '', value === today ? 'today' : ''].filter(Boolean).join(' ');
          return (
            <button key={value} type="button" className={classes} aria-label={`Select ${dateLabel(value)}`} aria-pressed={isStart || isEnd} disabled={value < today} onClick={() => selectDate(value)}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
