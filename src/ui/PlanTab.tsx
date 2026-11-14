import { FOLLOW_UP_QUESTIONS } from '../domain/questions';
import { href } from './router';
import type { TabProps } from './TripView';

export function PlanTab({ trip, update }: TabProps) {
  const answered = FOLLOW_UP_QUESTIONS.filter((q) => trip.answers[q.id]?.trim()).length;
  const setAnswer = (id: string, v: string) => update((t) => ({ ...t, answers: { ...t.answers, [id]: v } }));
  return (
    <div className="stack">
      <div className="intro">
        <h2>Shape the trip</h2>
        <p className="muted">
          A few questions that sharpen the search. Answer what you know now and skip the rest. {answered}/{FOLLOW_UP_QUESTIONS.length} answered.
        </p>
      </div>
      {FOLLOW_UP_QUESTIONS.map((q) => {
        const v = trip.answers[q.id] ?? '';
        return (
          <div key={q.id} className="card question">
            <label htmlFor={`q-${q.id}`} className="question-title">
              {q.question}
            </label>
            {q.options && (
              <div className="chips" role="group" aria-label={q.question}>
                {q.options.map((o) => (
                  <button type="button" key={o} className={`chip ${v === o ? 'on' : ''}`} aria-pressed={v === o} onClick={() => setAnswer(q.id, v === o ? '' : o)}>
                    {o}
                  </button>
                ))}
              </div>
            )}
            <input id={`q-${q.id}`} value={v} placeholder={q.hint} onChange={(e) => setAnswer(q.id, e.target.value)} />
          </div>
        );
      })}
      <div className="card">
        <label className="question-title" htmlFor="trip-notes">
          Notes
        </label>
        <textarea id="trip-notes" rows={4} value={trip.notes} onChange={(e) => update((t) => ({ ...t, notes: e.target.value }))} placeholder="Ideas, links, things a friend recommended…" />
      </div>
      <div className="actions">
        <a className="btn btn-primary" href={href({ page: 'trip', id: trip.id, tab: 'dates' })}>
          Next: when & how long →
        </a>
      </div>
    </div>
  );
}
