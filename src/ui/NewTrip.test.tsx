import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deviceTimeZone, timeZoneOptionLabel, zoneAbbreviation } from '../domain/timeZone';
import { StoreProvider, useStore } from '../state/store';
import { formatDateTimeLocal, formatLocalTime } from './common';
import { NewTrip } from './NewTrip';

function TripState() {
  const { data } = useStore();
  return <output data-testid="saved-trips">{JSON.stringify(data.trips)}</output>;
}

function startAtSchedule(destination: string) {
  render(
    <StoreProvider>
      <NewTrip />
      <TripState />
    </StoreProvider>,
  );
  expect(screen.getByRole('heading', { name: 'Set the Scene' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: destination } });
  next();
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
}

function continueToBudget() {
  next();
  expect(screen.getByRole('heading', { name: 'Crew' })).toBeTruthy();
  next();
  expect(screen.getByRole('heading', { name: 'Budget & Launch' })).toBeTruthy();
}

function preview() {
  return screen.getByRole('region', { name: 'Invite card preview' });
}

function calendarDate(daysAhead: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysAhead);
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  const label = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const month = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { iso, buttonName: `Select ${label}`, month };
}

function selectCalendarDate(date: ReturnType<typeof calendarDate>, endpoint?: string) {
  if (endpoint) fireEvent.click(screen.getByRole('button', { name: new RegExp(endpoint) }));
  while (!screen.queryByText(date.month)) {
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  }
  fireEvent.click(screen.getByRole('button', { name: date.buttonName }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Venture creation wizard', () => {
  it('shows the location once on Schedule and once in the final invite preview', () => {
    startAtSchedule('Thanksgiving');
    expect(screen.getAllByText(/Thanksgiving/)).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Budget type' })).toBeNull();
    expect(screen.queryByText(/No target set|\$0/)).toBeNull();
    continueToBudget();
    expect(screen.getAllByText(/Thanksgiving/)).toHaveLength(1);
    expect(preview().textContent).toContain('Thanksgiving');
  });

  it('shows the adaptive date modes, context pills, and local-event fields', () => {
    startAtSchedule("Mom's House");

    expect(screen.getByRole('heading', { name: 'Schedule' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit Set the Scene' }).textContent).toContain("Mom's House");
    expect(screen.getByRole('button', { name: 'Next →' }).classList.contains('wizard-next')).toBe(true);
    expect(screen.getByRole('button', { name: calendarDate(0).buttonName }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'SET FOR DATE DECISION' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    expect(screen.getByRole('heading', { name: 'What’s the possible window?' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Possible date window' })).toBeTruthy();
    expect(screen.queryByText('Possible date window')).toBeNull();
    expect(screen.getByText('Earliest start')).toBeTruthy();
    expect(screen.getByText('Latest wrap-up')).toBeTruthy();
    expect(screen.getByLabelText(/Ideal length \(optional\)/)).toBeTruthy();
    expect(screen.getByLabelText(/Opt in by/)).toBeTruthy();
    expect(screen.getByText('+ Add departure city / flight info (optional)').closest('details')?.open).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'SET A DATE' }));
    expect(screen.getByRole('group', { name: 'Venture dates' })).toBeTruthy();
    expect(screen.queryByText('Venture dates')).toBeNull();
    expect(document.querySelector('.calendar-month-nav-centered')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Single day / evening' })).toHaveProperty('checked', true);
    expect(screen.queryByRole('button', { name: /End date/ })).toBeNull();
    expect(screen.getByLabelText('Start time (optional)').closest('.when-time-row')).toBeTruthy();
    expect(screen.getByLabelText('End time (optional)').closest('.when-time-row')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Decide dates later' })).toBeNull();
  });

  it('previews a fixed evening and launches into planning after the Planner skips budget', () => {
    startAtSchedule('Mom’s House');
    const date = calendarDate(4);
    selectCalendarDate(date);
    fireEvent.change(screen.getByLabelText('Start time (optional)'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('End time (optional)'), { target: { value: '21:00' } });
    continueToBudget();
    expect(preview().textContent).toContain(formatDateTimeLocal(date.iso));
    expect(preview().textContent).toContain(formatLocalTime('18:00'));
    expect(preview().textContent).toContain(formatLocalTime('21:00'));
    expect(preview().textContent).not.toContain('Opt in by');
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(screen.getByText('Step 4 of 4')).toBeTruthy();
    expect(screen.getByTestId('saved-trips').textContent).toBe('[]');
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip).toMatchObject({ budgetTotal: null, currency: 'USD' });
    expect(trip.availability).toBeUndefined();
    expect(trip.dateOptions).toHaveLength(1);
    expect(trip.dateOptions[0]).toMatchObject({ start: date.iso, end: date.iso, startTime: '18:00', endTime: '21:00' });
    expect(trip.chosenDateId).toBe(trip.dateOptions[0].id);
    expect(window.location.hash).toBe(`#/trip/${trip.id}/plan`);
  });

  it('LAUNCH-02 previews and saves a single evening that runs past midnight', () => {
    startAtSchedule('Rooftop countdown');
    const date = calendarDate(4);
    selectCalendarDate(date);
    fireEvent.change(screen.getByLabelText('Start time (optional)'), { target: { value: '21:00' } });
    expect(screen.queryByText(/the next day/)).toBeNull();
    fireEvent.change(screen.getByLabelText('End time (optional)'), { target: { value: '01:00' } });
    expect(screen.getByText(`Ends ${formatLocalTime('01:00')} the next day.`)).toBeTruthy();
    continueToBudget();
    expect(preview().textContent).toContain(`${formatLocalTime('01:00')}`);
    expect(preview().textContent).toMatch(/\(next\sday\)/);
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.dateOptions[0]).toMatchObject({ start: date.iso, end: date.iso, startTime: '21:00', endTime: '01:00' });
  });

  it('previews and saves a fixed multi-day Venture with a total budget', () => {
    startAtSchedule('Family weekend');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Single day / evening' }));
    expect(screen.getByRole('group', { name: 'Venture dates' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /End date/ })).toBeTruthy();
    const start = calendarDate(4);
    const end = calendarDate(7);
    selectCalendarDate(start, 'Start date');
    selectCalendarDate(end);
    continueToBudget();
    fireEvent.change(screen.getByLabelText('Total budget'), { target: { value: '600' } });
    expect(preview().textContent).toContain(formatDateTimeLocal(start.iso));
    expect(preview().textContent).toContain(formatDateTimeLocal(end.iso));
    expect(preview().textContent).toContain('$600 total');
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.dateOptions[0]).toMatchObject({ start: start.iso, end: end.iso });
    expect(trip).toMatchObject({ budgetTotal: 600, budgetBasis: 'total' });
    expect(trip.budgetPerPerson).toBeUndefined();
  });

  it('updates the Date Decision preview and saves the revised cutoff on launch', () => {
    startAtSchedule('Thanksgiving');
    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    const earliest = calendarDate(4);
    const latest = calendarDate(11);
    selectCalendarDate(earliest, 'Earliest start');
    selectCalendarDate(latest);
    fireEvent.change(screen.getByLabelText(/Ideal length/), { target: { value: '1 weekend' } });
    const initialCutoff = `${calendarDate(1).iso}T18:00`;
    const revisedCutoff = `${calendarDate(2).iso}T19:30`;
    fireEvent.change(screen.getByLabelText('Opt in by'), { target: { value: initialCutoff } });
    next();
    expect(screen.queryByRole('region', { name: 'Invite card preview' })).toBeNull();
    next();
    expect(preview().textContent).toContain(formatDateTimeLocal(initialCutoff));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    fireEvent.change(screen.getByLabelText('Opt in by'), { target: { value: revisedCutoff } });
    continueToBudget();
    expect(preview().textContent).toContain(formatDateTimeLocal(revisedCutoff));
    expect(preview().textContent).not.toContain(formatDateTimeLocal(initialCutoff));
    expect(preview().textContent).toContain('1 weekend');
    expect(preview().textContent).toContain('No target set');
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.dateOptions).toEqual([]);
    expect(trip.availability).toMatchObject({
      earliestDeparture: earliest.iso,
      latestReturn: latest.iso,
      optInBy: revisedCutoff,
      idealDuration: '1 weekend',
    });
    expect(trip.constraints.preferredNights).toBe(2);
    expect(window.location.hash).toBe(`#/trip/${trip.id}/dates`);
  });

  it('keeps the per-person entry when the Planner edits Crew and navigates back', () => {
    startAtSchedule('Cabin weekend');
    continueToBudget();
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Per person' }));
    fireEvent.change(screen.getByLabelText('Budget per person'), { target: { value: '150.25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Edit Crew' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Crew' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Adults'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(screen.getByRole('heading', { name: 'Schedule' })).toBeTruthy();
    continueToBudget();
    expect(preview().textContent).toContain('6 people');
    expect(preview().textContent).toContain('$150.25 per person');
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));
    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip).toMatchObject({ travelers: { adults: 4, children: 2 }, budgetTotal: 901.50, budgetBasis: 'perPerson', budgetPerPerson: 150.25 });
  });

  it('D10 defaults to the device time zone and names it on the invite card only', () => {
    render(
      <StoreProvider>
        <NewTrip />
        <TripState />
      </StoreProvider>,
    );
    const zone = screen.getByLabelText(/^Time zone/) as HTMLSelectElement;
    expect(zone.value).toBe(deviceTimeZone());
    expect(zone.closest('details')?.open).toBe(false);
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Mom’s House' } });
    next();
    expect(screen.queryByText(/^Times are in/)).toBeNull();
    const date = calendarDate(4);
    selectCalendarDate(date);
    fireEvent.change(screen.getByLabelText('Start time (optional)'), { target: { value: '18:00' } });
    next();
    const abbreviation = zoneAbbreviation(deviceTimeZone(), `${date.iso}T18:00`);
    expect(screen.getByRole('button', { name: 'Edit Schedule' }).textContent).not.toContain(abbreviation);
    next();
    expect(preview().textContent).toContain(`${formatLocalTime('18:00')} ${abbreviation}`);
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));
    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.timeZone).toBe(deviceTimeZone());
  });

  it('D10 saves another time zone and sets the deadline shortcut in it', () => {
    const other = deviceTimeZone() === 'Asia/Tokyo' ? 'America/Los_Angeles' : 'Asia/Tokyo';
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 22, 12, 0));
    render(
      <StoreProvider>
        <NewTrip />
        <TripState />
      </StoreProvider>,
    );
    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Thanksgiving' } });
    fireEvent.change(screen.getByLabelText(/^Time zone/), { target: { value: other } });
    expect(screen.getByLabelText(/^Time zone/).closest('details')?.open).toBe(true);
    next();
    expect(screen.getByText(`Times are in ${timeZoneOptionLabel(other)}.`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    selectCalendarDate(calendarDate(4), 'Earliest start');
    selectCalendarDate(calendarDate(11));
    fireEvent.click(screen.getByRole('button', { name: 'In 24 hours' }));
    const cutoff = other === 'Asia/Tokyo' ? '2026-11-23T21:00' : '2026-11-23T04:00';
    expect((screen.getByLabelText('Opt in by') as HTMLInputElement).value).toBe(cutoff);
    continueToBudget();
    expect(preview().textContent).toContain(`${formatDateTimeLocal(cutoff)} ${zoneAbbreviation(other, cutoff)}`);
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Venture' }));
    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.timeZone).toBe(other);
    expect(trip.availability.optInBy).toBe(cutoff);
  });

  it('requires date details before continuing without a skip action', () => {
    startAtSchedule('Thanksgiving');
    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByText('Add both possible window dates.')).toBeTruthy();
    expect(screen.getByText('Set an opt-in deadline.')).toBeTruthy();
  });
});
