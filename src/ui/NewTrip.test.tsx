import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoreProvider, useStore } from '../state/store';
import { NewTrip } from './NewTrip';

function TripState() {
  const { data } = useStore();
  return <output data-testid="saved-trips">{JSON.stringify(data.trips)}</output>;
}

function startWizardAtWhen(destination: string) {
  render(
    <StoreProvider>
      <NewTrip />
      <TripState />
    </StoreProvider>,
  );
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: destination } });
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
  fireEvent.click(screen.getByRole('button', { name: "Skip for now — we'll figure it out as we go" }));
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
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
});

describe('new-trip wizard', () => {
  it('shows the venture location only once', () => {
    localStorage.clear();
    render(
      <StoreProvider>
        <NewTrip />
      </StoreProvider>,
    );

    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Thanksgiving' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));

    expect(screen.getAllByText(/Thanksgiving/)).toHaveLength(1);
    expect(screen.getByText('WHERE • Thanksgiving')).toBeTruthy();
  });

  it('shows the adaptive date modes, context pills, and local-event fields', () => {
    startWizardAtWhen("Mom's House");

    expect(screen.getByRole('heading', { name: 'When is this happening?' })).toBeTruthy();
    expect(screen.getAllByText('WHERE • Mom\'s House')).toHaveLength(1);
    expect(screen.getByText('BUDGET • No target set')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next →' }).classList.contains('wizard-next')).toBe(true);
    expect(screen.getByRole('button', { name: calendarDate(0).buttonName }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'SET FOR DATE DECISION' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    expect(screen.getByRole('heading', { name: 'What’s the possible window?' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Possible date window' })).toBeTruthy();
    expect(screen.getByText('Earliest start')).toBeTruthy();
    expect(screen.getByText('Latest wrap-up')).toBeTruthy();
    expect(screen.getByLabelText(/Ideal length \(optional\)/)).toBeTruthy();
    expect(screen.getByLabelText(/Opt in by/)).toBeTruthy();
    expect(screen.getByText('+ Add departure city / flight info (optional)').closest('details')?.open).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'SET A DATE' }));
    expect(screen.getByRole('group', { name: 'Venture dates' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Single day / evening' })).toHaveProperty('checked', true);
    expect(screen.queryByRole('button', { name: /End date/ })).toBeNull();
    expect(screen.getByLabelText('Start time (optional)').closest('.when-time-row')).toBeTruthy();
    expect(screen.getByLabelText('End time (optional)').closest('.when-time-row')).toBeTruthy();
    expect(screen.getByText('Invitees will go straight into the shared itinerary once created.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Decide dates later' })).toBeNull();
  });

  it('creates a fixed single-day event with optional times as its chosen date', () => {
    startWizardAtWhen('Mom’s House');
    const date = calendarDate(4);
    selectCalendarDate(date);
    fireEvent.change(screen.getByLabelText('Start time (optional)'), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText('End time (optional)'), { target: { value: '21:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByRole('button', { name: 'Create trip →' }).classList.contains('wizard-next')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Create trip →' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.budgetTotal).toBeNull();
    expect(trip.availability).toBeUndefined();
    expect(trip.dateOptions).toHaveLength(1);
    expect(trip.dateOptions[0]).toMatchObject({ start: date.iso, end: date.iso, startTime: '18:00', endTime: '21:00' });
    expect(trip.chosenDateId).toBe(trip.dateOptions[0].id);
  });

  it('creates a multi-day fixed event from the calendar range', () => {
    startWizardAtWhen('Family weekend');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Single day / evening' }));
    expect(screen.getByRole('group', { name: 'Venture dates' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /End date/ })).toBeTruthy();
    const start = calendarDate(4);
    const end = calendarDate(7);
    selectCalendarDate(start, 'Start date');
    selectCalendarDate(end);
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create trip →' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.dateOptions[0]).toMatchObject({ start: start.iso, end: end.iso });
  });

  it('persists a date-decision cutoff and ideal duration for downstream planning', () => {
    startWizardAtWhen('Thanksgiving');
    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    const earliest = calendarDate(4);
    const latest = calendarDate(11);
    selectCalendarDate(earliest, 'Earliest start');
    selectCalendarDate(latest);
    fireEvent.change(screen.getByLabelText(/Ideal length/), { target: { value: '1 weekend' } });
    fireEvent.change(screen.getByLabelText(/Opt in by/), { target: { value: '2027-10-31T18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    const preview = screen.getByRole('region', { name: 'Invite card preview' });
    expect(preview).toBeTruthy();
    expect(screen.getByText('Opt in by:')).toBeTruthy();
    expect(preview.textContent).toContain('Budget: No target set');
    fireEvent.click(screen.getByRole('button', { name: 'Create trip →' }));

    const [trip] = JSON.parse(screen.getByTestId('saved-trips').textContent ?? '[]');
    expect(trip.dateOptions).toEqual([]);
    expect(trip.availability).toMatchObject({
      earliestDeparture: earliest.iso,
      latestReturn: latest.iso,
      optInBy: '2027-10-31T18:00',
      idealDuration: '1 weekend',
    });
    expect(trip.constraints.preferredNights).toBe(2);
  });

  it('requires date details before continuing without a skip action', () => {
    startWizardAtWhen('Thanksgiving');
    fireEvent.click(screen.getByRole('button', { name: 'SET FOR DATE DECISION' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByText('Add both possible window dates.')).toBeTruthy();
    expect(screen.getByText('Set an opt-in deadline.')).toBeTruthy();
  });
});
