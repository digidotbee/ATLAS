import { useState } from 'react';
import { candidateCost, multiplier, tripShape } from '../domain/budget';
import { blankCandidate } from '../domain/factory';
import { buildResearchPrompt, matchedInterests, parseImportedCandidates } from '../domain/research';
import { CATEGORIES, PRICE_BASES, type Candidate, type CandidateStatus, type Category, type Move } from '../domain/types';
import { useStore } from '../state/store';
import { Banner, Field, Money, NumberInput, PriceBadge } from './common';
import { href } from './router';
import type { TabProps } from './TripView';

type View = 'active' | 'selected' | 'rejected';

export function ExploreTab({ trip, update }: TabProps) {
  const { data } = useStore();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [view, setView] = useState<View>('active');
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [showResearch, setShowResearch] = useState(false);
  const [base, setBase] = useState<string>('all');
  const bases = [...new Set(trip.candidates.map((c) => c.base?.trim() ?? '').filter(Boolean))].sort();
  const shape = tripShape(trip);

  const save = (c: Candidate) =>
    update((t) => {
      const exists = t.candidates.some((x) => x.id === c.id);
      return { ...t, candidates: exists ? t.candidates.map((x) => (x.id === c.id ? c : x)) : [c, ...t.candidates] };
    });
  const patch = (id: string, p: Partial<Candidate>) =>
    update((t) => ({ ...t, candidates: t.candidates.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const remove = (id: string) => update((t) => ({ ...t, candidates: t.candidates.filter((x) => x.id !== id) }));

  const inCat = trip.candidates.filter(
    (c) => (cat === 'all' || c.category === cat) && (base === 'all' || (c.base?.trim() ?? '') === base),
  );
  const shown = inCat
    .filter((c) => (view === 'active' ? c.status !== 'rejected' : c.status === view))
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.category.localeCompare(b.category) || candidateCost(a, shape) - candidateCost(b, shape));
  const count = (s: View) => inCat.filter((c) => (s === 'active' ? c.status !== 'rejected' : c.status === s)).length;

  return (
    <div className="stack">
      <div className="intro">
        <h2>Explore & choose</h2>
        <p className="muted">
          Collect options, compare them side by side, then choose or set aside. Only chosen items count toward the budget.
        </p>
      </div>

      <div className="chips" role="tablist" aria-label="Category">
        <button type="button" className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>
          All <span className="count">{trip.candidates.length}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button type="button" key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
            {c.icon} {c.label} <span className="count">{trip.candidates.filter((x) => x.category === c.id).length}</span>
          </button>
        ))}
      </div>

      {bases.length > 0 && (
        <div className="chips" role="group" aria-label="Base">
          <span className="chips-label">Base:</span>
          {['all', ...bases].map((b) => (
            <button type="button" key={b} className={`chip chip-base ${base === b ? 'on' : ''}`} onClick={() => setBase(b)}>
              {b === 'all' ? 'All bases' : `⌖ ${b}`}
            </button>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Show">
          {(['active', 'selected', 'rejected'] as View[]).map((v) => (
            <button type="button" key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v === 'active' ? 'Shortlist' : v === 'selected' ? 'Chosen' : 'Set aside'} ({count(v)})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn" onClick={() => setShowResearch((s) => !s)} aria-expanded={showResearch}>
            ✦ Research helper
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing(blankCandidate(cat === 'all' ? 'lodging' : cat))}>
            + Add option
          </button>
        </div>
      </div>

      {showResearch && (
        <ResearchHelper
          prompt={(focus) => buildResearchPrompt(trip, data.profile, focus)}
          initialFocus={cat}
          onImport={(cs, moves) => {
            update((t) => ({ ...t, candidates: [...cs, ...t.candidates], moves: { ...(t.moves ?? {}), ...moves } }));
            setView('active');
          }}
        />
      )}

      {editing && (
        <CandidateEditor
          key={editing.id}
          candidate={editing}
          currency={trip.currency}
          knownBases={bases}
          onCancel={() => setEditing(null)}
          onSave={(c) => {
            save(c);
            setEditing(null);
          }}
        />
      )}

      {shown.length === 0 ? (
        <div className="empty small">
          {view === 'active'
            ? 'Nothing here yet. Add an option you found, or use the Research helper to gather a batch at once.'
            : view === 'selected'
              ? 'Nothing chosen yet.'
              : 'Nothing set aside.'}
        </div>
      ) : (
        <div className="cand-list">
          {shown.map((c) => (
            <CandidateCard
              key={c.id}
              c={c}
              currency={trip.currency}
              cost={candidateCost(c, shape)}
              mult={multiplier(c, shape)}
              fits={matchedInterests(c, data.profile.interests)}
              onStatus={(s) => patch(c.id, { status: s })}
              onTogglePrice={() => patch(c.id, { priceStatus: c.priceStatus === 'verified' ? 'estimated' : 'verified' })}
              onEdit={() => setEditing(c)}
              onDelete={() => {
                if (confirm(`Delete “${c.name}” permanently?`)) remove(c.id);
              }}
            />
          ))}
        </div>
      )}
      <div className="actions">
        <a className="btn btn-primary" href={href({ page: 'trip', id: trip.id, tab: 'itinerary' })}>
          Next: build the itinerary →
        </a>
      </div>
    </div>
  );
}

function statusRank(s: CandidateStatus): number {
  return s === 'selected' ? 0 : s === 'considering' ? 1 : 2;
}

function basisLabel(b: Candidate['basis']): string {
  return PRICE_BASES.find((x) => x.id === b)!.label;
}

function CandidateCard(props: {
  c: Candidate;
  currency: string;
  cost: number;
  mult: number;
  fits: string[];
  onStatus: (s: CandidateStatus) => void;
  onTogglePrice: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { c, currency, cost, mult, fits } = props;
  const catMeta = CATEGORIES.find((x) => x.id === c.category)!;
  return (
    <article className={`cand card status-${c.status}`}>
      <div className="cand-head">
        <span className="cand-cat" title={catMeta.label}>
          {catMeta.icon}
        </span>
        <div className="cand-title">
          <h3>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer noopener">
                {c.name} ↗
              </a>
            ) : (
              c.name
            )}
          </h3>
          {(c.location || c.base) && (
            <p className="muted small">
              {c.base && <span className="base-label">⌖ {c.base}</span>}
              {c.base && c.location && ' · '}
              {c.location}
            </p>
          )}
        </div>
        <div className="cand-price">
          <Money amount={cost} currency={currency} />
          <span className="muted small">
            <Money amount={c.price} currency={currency} /> {basisLabel(c.basis)}
            {c.basis !== 'total' && ` × ${mult}`}
          </span>
          <PriceBadge status={c.priceStatus} onToggle={props.onTogglePrice} />
        </div>
      </div>
      {c.notes && <p className="cand-notes">{c.notes}</p>}
      {(c.tags.length > 0 || fits.length > 0) && (
        <div className="tags">
          {fits.length > 0 && <span className="tag tag-good">♥ Fits: {fits.slice(0, 3).join(', ')}</span>}
          {c.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="cand-actions">
        {c.status !== 'selected' && (
          <button type="button" className="btn btn-small btn-choose" onClick={() => props.onStatus('selected')}>
            ✓ Choose
          </button>
        )}
        {c.status !== 'considering' && (
          <button type="button" className="btn btn-small" onClick={() => props.onStatus('considering')}>
            ↺ Back to shortlist
          </button>
        )}
        {c.status !== 'rejected' && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => props.onStatus('rejected')}>
            ✕ Not for us
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn-small btn-ghost" onClick={props.onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn-small btn-ghost danger" onClick={props.onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}

function CandidateEditor({
  candidate,
  currency,
  knownBases,
  onSave,
  onCancel,
}: {
  candidate: Candidate;
  currency: string;
  knownBases: string[];
  onSave: (c: Candidate) => void;
  onCancel: () => void;
}) {
  const [c, setC] = useState(candidate);
  const [tags, setTags] = useState(candidate.tags.join(', '));
  const [error, setError] = useState('');
  const set = (p: Partial<Candidate>) => setC((x) => ({ ...x, ...p }));
  return (
    <form
      className="card editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (!c.name.trim()) return setError('Give it a name.');
        if (!(c.price >= 0)) return setError('Price must be zero or more.');
        onSave({ ...c, name: c.name.trim(), base: (c.base ?? '').trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean) });
      }}
    >
      <h3>{candidate.name ? 'Edit option' : 'Add an option'}</h3>
      <div className="grid-2">
        <Field label="Name">
          <input value={c.name} onChange={(e) => set({ name: e.target.value })} autoFocus placeholder="e.g. La Quebrada Lodge" />
        </Field>
        <Field label="Category">
          <select value={c.category} onChange={(e) => set({ category: e.target.value as Category })}>
            {CATEGORIES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <datalist id="atlas-bases">
        {knownBases.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <div className="grid-3">
        <Field label="Where">
          <input value={c.location} onChange={(e) => set({ location: e.target.value })} placeholder="Neighborhood / town" />
        </Field>
        <Field label="Base" hint="The town you stay in for this — keeps day trips with the right place to stay">
          <input value={c.base ?? ''} onChange={(e) => set({ base: e.target.value })} placeholder="e.g. Kyoto" list="atlas-bases" />
        </Field>
        <Field label="Link">
          <input type="url" value={c.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" />
        </Field>
      </div>
      <div className="grid-4">
        <Field label={`Price (${currency})`}>
          <NumberInput value={c.price} onChange={(v) => set({ price: v ?? 0 })} step={5} aria-label="Price" />
        </Field>
        <Field label="Charged">
          <select value={c.basis} onChange={(e) => set({ basis: e.target.value as Candidate['basis'] })}>
            {PRICE_BASES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={c.category === 'lodging' ? 'Nights here' : 'How many'}
          hint={c.basis === 'total' ? 'Not needed for a total price' : c.category === 'lodging' ? 'Blank = the whole trip' : 'Blank = whole trip / everyone'}
        >
          <NumberInput value={c.units} onChange={(v) => set({ units: v })} placeholder="auto" aria-label="Units" />
        </Field>
        <Field label="Price is">
          <select value={c.priceStatus} onChange={(e) => set({ priceStatus: e.target.value as Candidate['priceStatus'] })}>
            <option value="estimated">Estimated</option>
            <option value="verified">Verified quote</option>
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea rows={3} value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Why it fits, what to book, caveats" />
      </Field>
      <Field label="Tags" hint="Comma-separated, e.g. UNESCO, Surfing, Walkable">
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </Field>
      {error && <Banner tone="error">{error}</Banner>}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save option
        </button>
      </div>
    </form>
  );
}

function ResearchHelper({ prompt, initialFocus, onImport }: { prompt: (f: Category | 'all') => string; initialFocus: Category | 'all'; onImport: (cs: Candidate[], moves: Record<string, Move>) => void }) {
  const [focus, setFocus] = useState<Category | 'all'>(initialFocus);
  const [pasted, setPasted] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const text = prompt(focus);
  return (
    <section className="card research">
      <h3>Research helper</h3>
      <p className="muted small">
        ATLAS writes a research brief from this trip and your family's preferences. Paste it into Claude or any assistant, then paste
        the reply back here — options import straight into your shortlist, with prices marked estimated or verified.
      </p>
      <div className="grid-2">
        <div className="stack-sm">
          <Field label="Research focus">
            <select value={focus} onChange={(e) => setFocus(e.target.value as Category | 'all')}>
              <option value="all">Everything</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <textarea className="mono" rows={10} readOnly value={text} aria-label="Research brief" />
          <button
            type="button"
            className="btn"
            onClick={() =>
              navigator.clipboard.writeText(text).then(
                () => setCopyMsg('Copied.'),
                (e: Error) => setCopyMsg(`Copy failed (${e.message}). Select the text and copy it manually.`),
              )
            }
          >
            Copy brief
          </button>
          {copyMsg && <span className="small muted">{copyMsg}</span>}
        </div>
        <div className="stack-sm">
          <Field label="Paste the reply">
            <textarea className="mono" rows={12} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "candidates": [ … ] }' />
          </Field>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pasted.trim()}
            onClick={() => {
              const r = parseImportedCandidates(pasted);
              setErrors(r.errors);
              const moveCount = Object.keys(r.moves).length;
              if (r.errors.length === 0) {
                onImport(r.candidates, r.moves);
                setDone(
                  `Imported ${r.candidates.length} options into your shortlist${moveCount ? ` and ${moveCount} travel legs (see Itinerary)` : ''}.`,
                );
                setPasted('');
              } else setDone('');
            }}
          >
            Import options
          </button>
          {done && <Banner tone="info">{done}</Banner>}
          {errors.length > 0 && (
            <Banner tone="error">
              Nothing was imported. Fix these and try again:
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Banner>
          )}
        </div>
      </div>
    </section>
  );
}
