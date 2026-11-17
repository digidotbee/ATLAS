import type { ReactNode } from 'react';

export function StageHead({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="stage-head">
      <span className={`stage-num ${done ? 'done' : ''}`} aria-hidden="true">
        {done ? '✓' : n}
      </span>
      <h3>{title}</h3>
      <span className="stage-actions">{children}</span>
    </div>
  );
}
