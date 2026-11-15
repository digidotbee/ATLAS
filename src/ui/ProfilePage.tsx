import { useState } from 'react';
import { DEFAULT_INTERESTS } from '../domain/factory';
import { useStore } from '../state/store';
import { Field, NumberInput } from './common';

export function ProfilePage() {
  const { data, updateProfile } = useStore();
  const p = data.profile;
  const [newInterest, setNewInterest] = useState('');
  const all = [...new Set([...DEFAULT_INTERESTS, ...p.interests])];
  const toggle = (i: string) =>
    updateProfile((x) => ({ ...x, interests: x.interests.includes(i) ? x.interests.filter((y) => y !== i) : [...x.interests, i] }));

  return (
    <div className="page narrow stack">
      <p className="eyebrow">Family profile</p>
      <h1>How you like to travel</h1>
      <p className="lede">ORIVOIR uses this in every research brief and highlights options that fit. It doesn't limit what you can explore.</p>
      <div className="card stack-sm">
        <div className="grid-2">
          <Field label="Family name" hint="Shown on printed itineraries">
            <input value={p.familyName} onChange={(e) => updateProfile((x) => ({ ...x, familyName: e.target.value }))} />
          </Field>
          <Field label="Home airport">
            <input value={p.homeAirport} onChange={(e) => updateProfile((x) => ({ ...x, homeAirport: e.target.value }))} placeholder="e.g. ATL" />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Usual adults">
            <NumberInput value={p.defaultAdults} min={1} onChange={(v) => updateProfile((x) => ({ ...x, defaultAdults: Math.max(1, v ?? 1) }))} aria-label="Usual adults" />
          </Field>
          <Field label="Usual children">
            <NumberInput value={p.defaultChildren} onChange={(v) => updateProfile((x) => ({ ...x, defaultChildren: v ?? 0 }))} aria-label="Usual children" />
          </Field>
          <Field label="Usual currency">
            <input value={p.defaultCurrency} maxLength={3} onChange={(e) => updateProfile((x) => ({ ...x, defaultCurrency: e.target.value.toUpperCase() }))} />
          </Field>
        </div>
      </div>
      <div className="card stack-sm">
        <h3>What your family loves</h3>
        <div className="chips">
          {all.map((i) => (
            <button type="button" key={i} className={`chip ${p.interests.includes(i) ? 'on' : ''}`} aria-pressed={p.interests.includes(i)} onClick={() => toggle(i)}>
              {i}
            </button>
          ))}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const v = newInterest.trim();
            if (v && !p.interests.includes(v)) updateProfile((x) => ({ ...x, interests: [...x.interests, v] }));
            setNewInterest('');
          }}
        >
          <input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder="Add an interest…" aria-label="New interest" />
          <button className="btn" type="submit">
            Add
          </button>
        </form>
      </div>
      <div className="card">
        <Field label="Anything else ORIVOIR should know" hint="e.g. “We like quiet coastal neighborhoods where we can bike to the beach and surf.”">
          <textarea rows={4} value={p.notes} onChange={(e) => updateProfile((x) => ({ ...x, notes: e.target.value }))} />
        </Field>
      </div>
    </div>
  );
}
