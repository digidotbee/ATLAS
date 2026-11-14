import type { ReactNode } from 'react';
import { formatMoney } from '../domain/budget';
import type { PriceStatus } from '../domain/types';

export function Money({ amount, currency }: { amount: number; currency: string }) {
  return <span className="money">{formatMoney(amount, currency)}</span>;
}

export function PriceBadge({ status, onToggle }: { status: PriceStatus; onToggle?: () => void }) {
  const label = status === 'verified' ? 'Verified' : 'Estimate';
  const title =
    status === 'verified'
      ? 'You confirmed this price from a real quote. Click to mark as an estimate.'
      : 'A guess or typical price. Click once you have confirmed the real price.';
  return onToggle ? (
    <button type="button" className={`badge badge-${status}`} title={title} onClick={onToggle}>
      {status === 'verified' ? '✓ ' : '≈ '}
      {label}
    </button>
  ) : (
    <span className={`badge badge-${status}`} title={title}>
      {status === 'verified' ? '✓ ' : '≈ '}
      {label}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  step = 1,
  ...rest
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  'aria-label'?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      {...rest}
    />
  );
}

export function Banner({ tone, children }: { tone: 'error' | 'warn' | 'info'; children: ReactNode }) {
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
}
