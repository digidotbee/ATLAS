import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { memo, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTrip } from '../domain/factory';
import { StoreProvider, useStore } from './store';

const stores: ReturnType<typeof useStore>[] = [];
let consumerRenders = 0;

const StoreConsumer = memo(function StoreConsumer() {
  stores.push(useStore());
  consumerRenders += 1;
  return null;
});

function ProviderHarness() {
  const [count, setCount] = useState(0);
  return (
    <StoreProvider>
      <button onClick={() => setCount((value) => value + 1)}>{count}</button>
      <StoreConsumer />
    </StoreProvider>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  stores.length = 0;
  consumerRenders = 0;
});

describe('store context', () => {
  it('keeps its value stable when the provider rerenders without store changes', () => {
    localStorage.clear();
    render(<ProviderHarness />);
    const initialStore = stores[0];

    fireEvent.click(screen.getByRole('button', { name: '0' }));

    expect(consumerRenders).toBe(1);
    expect(stores[0]).toBe(initialStore);
  });
});

describe('saving Ventures', () => {
  it('re-derives a per-person group total whenever a Venture is saved', () => {
    render(
      <StoreProvider>
        <StoreConsumer />
      </StoreProvider>,
    );
    const latest = () => stores[stores.length - 1];
    const trip = createTrip({
      name: 'Tapas night',
      destination: 'Arts District',
      region: '',
      currency: 'USD',
      budgetTotal: null,
      budgetBasis: 'perPerson',
      budgetPerPerson: 40,
      adults: 2,
      children: 0,
      childAges: '',
      flexibility: '',
      dateOptions: [],
    });

    act(() => latest().addTrip({ ...trip, budgetTotal: 1 }));
    expect(latest().data.trips[0].budgetTotal).toBe(80);

    act(() => latest().updateTrip(trip.id, (t) => ({ ...t, travelers: { ...t.travelers, adults: 5, children: 1 } })));
    expect(latest().data.trips[0]).toMatchObject({ budgetBasis: 'perPerson', budgetPerPerson: 40, budgetTotal: 240 });
  });
});
