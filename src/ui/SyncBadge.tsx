import { useStore } from '../state/store';
import { href } from './router';

export function SyncBadge() {
  const { sync } = useStore();
  const map = {
    off: { cls: 'off', text: 'Saved in this browser' },
    idle: { cls: 'ok', text: 'Synced' },
    working: { cls: 'busy', text: 'Syncing…' },
    error: { cls: 'err', text: 'Sync problem' },
    conflict: { cls: 'err', text: 'Needs your choice' },
  } as const;
  const m = map[sync.state];
  return (
    <a className={`sync-badge sync-${m.cls}`} href={href({ page: 'settings' })} title={sync.state === 'error' ? sync.message : m.text}>
      <i /> {m.text}
    </a>
  );
}
