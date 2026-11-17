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
    const { container } = render(<CalendarPicker label="Possible date window" mode="range" start="2027-05-20" end="" onChange={onChange} />);

    expect(container.querySelector('.calendar-selection-range')).toBeTruthy();
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

  it('opens on the selected month, disables past days, and stops paging at the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 15, 12));
    const onChange = vi.fn();
    render(<CalendarPicker label="Date" mode="single" start="2027-08-03" onChange={onChange} />);

    expect(screen.getByText('August 2027')).toBeTruthy();
    expect(screen.getByRole('button', { name: selectName('2027-08-03') }).getAttribute('aria-pressed')).toBe('true');
    const prev = () => screen.getByRole('button', { name: 'Previous month' });
    fireEvent.click(prev());
    fireEvent.click(prev());
    fireEvent.click(prev());
    expect(screen.getByText('May 2027')).toBeTruthy();
    expect(prev().hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: selectName('2027-05-14') }).hasAttribute('disabled')).toBe(true);
    const today = screen.getByRole('button', { name: selectName('2027-05-15') });
    expect(today.hasAttribute('disabled')).toBe(false);
    fireEvent.click(today);
    expect(onChange).toHaveBeenCalledWith('2027-05-15');
  });

  it('opens on today when nothing is selected', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 15, 12));
    render(<CalendarPicker label="Date" mode="single" start="" onChange={vi.fn()} />);
    expect(screen.getByText('May 2027')).toBeTruthy();
    expect(screen.getByText('Select a date')).toBeTruthy();
  });

  it('never fills in today as the start: the first pick of an empty range is the start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 10, 12));
    const onChange = vi.fn();
    render(<CalendarPicker label="Range" mode="range" start="" end="" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: selectName('2027-05-27') }));

    expect(onChange).toHaveBeenCalledWith('2027-05-27', '');
  });

  it('shows a past selection on its own month and lets you page back to it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 4, 15, 12));
    render(<CalendarPicker label="Range" mode="range" start="2027-03-10" end="2027-03-20" onChange={vi.fn()} />);

    expect(screen.getByText('March 2027')).toBeTruthy();
    expect(screen.getByRole('button', { name: selectName('2027-03-10') }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: selectName('2027-03-15') }).className).toContain('in-range');
    // Past days stay unpickable, and you can't page earlier than the selection.
    expect(screen.getByRole('button', { name: selectName('2027-03-15') }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(false);
  });
});
