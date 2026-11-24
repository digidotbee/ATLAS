import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTrip } from '../domain/factory';
import * as timeZone from '../domain/timeZone';
import type { Trip } from '../domain/types';
import { StoreProvider } from '../state/store';
import { NewTrip } from './NewTrip';
import { SetupTab } from './SetupTab';

vi.mock('../domain/timeZone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/timeZone')>();
  return { ...actual, timeZoneOptions: vi.fn(actual.timeZoneOptions) };
});

const optionsBuilt = () => vi.mocked(timeZone.timeZoneOptions).mock.calls.length;

function typeInto(label: string, text: string) {
  const input = screen.getByLabelText(label);
  for (let i = 1; i <= text.length; i++) fireEvent.change(input, { target: { value: text.slice(0, i) } });
}

function SettingsHarness() {
  const [trip, setTrip] = useState<Trip>(() =>
    createTrip({
      name: 'Dinner',
      destination: 'Tokyo',
      region: '',
      timeZone: 'Asia/Tokyo',
      currency: 'USD',
      budgetTotal: null,
      adults: 2,
      children: 0,
      flexibility: '',
      dateOptions: [],
    }),
  );
  return <SetupTab trip={trip} update={(fn) => setTrip(fn)} />;
}

afterEach(() => {
  cleanup();
  vi.mocked(timeZone.timeZoneOptions).mockClear();
});

describe('D10 time-zone picker cost', () => {
  it('D10 builds the zone list once while the Planner types in Set the Scene', () => {
    render(
      <StoreProvider>
        <NewTrip />
      </StoreProvider>,
    );
    const afterMount = optionsBuilt();
    expect(afterMount).toBeGreaterThan(0);
    typeInto('Destination', 'Lisbon riverside');
    expect(optionsBuilt()).toBe(afterMount);
  });

  it('D10 builds the zone list once while the Planner types in Venture settings', () => {
    render(
      <StoreProvider>
        <SettingsHarness />
      </StoreProvider>,
    );
    const afterMount = optionsBuilt();
    expect(afterMount).toBeGreaterThan(0);
    typeInto('Venture name', 'Dinner at eight');
    expect(optionsBuilt()).toBe(afterMount);
    fireEvent.change(screen.getByRole('combobox', { name: /Time zone/ }), { target: { value: 'Europe/Berlin' } });
    expect(optionsBuilt()).toBeGreaterThan(afterMount);
  });
});
