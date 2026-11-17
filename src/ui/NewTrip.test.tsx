import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoreProvider } from '../state/store';
import { NewTrip } from './NewTrip';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('new-trip budget step', () => {
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
});
