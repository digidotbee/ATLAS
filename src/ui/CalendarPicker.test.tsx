import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarPicker } from './CalendarPicker';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function selectName(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  return `Select ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`;
}

describe('CalendarPicker', () => {
  it('completes a date range from its selected start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 10, 12));
    const onChange = vi.fn();
    render(<CalendarPicker label="Possible date window" mode="range" start="2027-05-20" end="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: selectName('2027-05-27') }));

    expect(onChange).toHaveBeenCalledWith('2027-05-20', '2027-05-27');
  });

  it('adjusts a range start without discarding its later end date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 10, 12));
    const onChange = vi.fn();
    render(<CalendarPicker label="Possible date window" mode="range" start="2027-05-20" end="2027-05-27" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: selectName('2027-05-18') }));

    expect(onChange).toHaveBeenCalledWith('2027-05-18', '2027-05-27');
  });

  it('opens on today, disables past days, and cannot navigate to a past month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 15, 12));
    const onChange = vi.fn();
    render(<CalendarPicker label="Date" mode="single" start="2027-08-03" onChange={onChange} />);

    expect(screen.getByText('May 2027')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: selectName('2027-05-14') }).hasAttribute('disabled')).toBe(true);
    const today = screen.getByRole('button', { name: selectName('2027-05-15') });
    expect(today.hasAttribute('disabled')).toBe(false);
    fireEvent.click(today);
    expect(onChange).toHaveBeenCalledWith('2027-05-15');

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('June 2027')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(true);
  });
});
