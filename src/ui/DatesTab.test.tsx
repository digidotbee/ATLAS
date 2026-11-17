import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DateRange } from '../domain/types';
import { RangeList } from './AvailabilityCard';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ initial }: { initial: DateRange[] }) {
  const [ranges, setRanges] = useState(initial);
  return <RangeList label="Preferred dates" ranges={ranges} onChange={setRanges} />;
}

describe('RangeList', () => {
  it('keeps each row’s calendar with its own range after removing an earlier row', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 10, 12));
    render(
      <Harness
        initial={[
          { start: '2027-06-01', end: '2027-06-05' },
          { start: '2027-09-10', end: '2027-09-14' },
        ]}
      />,
    );
    expect(screen.getByText('June 2027')).toBeTruthy();
    expect(screen.getByText('September 2027')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    expect(screen.getByText('September 2027')).toBeTruthy();
    expect(screen.queryByText('June 2027')).toBeNull();
  });
});
