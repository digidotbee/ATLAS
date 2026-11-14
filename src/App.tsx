import { useStore } from './state/store';
import { downloadJson } from './storage/local';
import { Banner } from './ui/common';
import { NewTrip } from './ui/NewTrip';
import { PrintView } from './ui/PrintView';
import { ProfilePage } from './ui/ProfilePage';
import { href, useRoute } from './ui/router';
import { SettingsPage } from './ui/SettingsPage';
import { TripList } from './ui/TripList';
import { TripView } from './ui/TripView';

function SyncBadge() {
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

export function App() {
  const route = useRoute();
  const store = useStore();
  const { sync } = store;
  const isPrint = route.page === 'print';

  return (
    <>
      {!isPrint && (
        <header className="app-header no-print">
          <a className="logo" href={href({ page: 'trips' })}>
            <span className="logo-mark" aria-hidden>
              ◎
            </span>
            ATLAS
          </a>
          <nav className="app-nav">
            <a href={href({ page: 'trips' })} className={route.page === 'trips' ? 'active' : ''}>
              Trips
            </a>
            <a href={href({ page: 'profile' })} className={route.page === 'profile' ? 'active' : ''}>
              Family
            </a>
            <a href={href({ page: 'settings' })} className={route.page === 'settings' ? 'active' : ''}>
              Settings
            </a>
          </nav>
          <SyncBadge />
        </header>
      )}

      <div className="banners no-print">
        {store.loadError && (
          <Banner tone="error">
            <p>
              <strong>Saved data in this browser couldn't be read.</strong> {store.loadError.error} Nothing has been overwritten.
            </p>
            <div className="actions">
              <button type="button" className="btn btn-small" onClick={() => downloadJson({ raw: store.loadError!.raw }, 'atlas-unreadable-data.json')}>
                Download the unreadable data
              </button>
              <button
                type="button"
                className="btn btn-small danger"
                onClick={() => confirm('Discard the unreadable data in this browser and start fresh?') && store.resetCorruptLocal()}
              >
                Discard and start fresh
              </button>
            </div>
          </Banner>
        )}
        {store.saveError && <Banner tone="error">{store.saveError}</Banner>}
        {sync.state === 'error' && route.page !== 'settings' && !isPrint && (
          <Banner tone="error">
            {sync.message} <a href={href({ page: 'settings' })}>Open settings</a>
          </Banner>
        )}
        {sync.state === 'conflict' && (
          <Banner tone="warn">
            <p>
              <strong>Your trips changed on another device and here.</strong> This device: {store.data.trips.length} trips, last edited{' '}
              {new Date(store.data.updatedAt).toLocaleString()}. Gist: {sync.remote.trips.length} trips, last edited{' '}
              {new Date(sync.remote.updatedAt).toLocaleString()}.
            </p>
            <div className="actions">
              <button type="button" className="btn btn-small" onClick={() => void store.resolveConflict('remote')}>
                Use the Gist version
              </button>
              <button type="button" className="btn btn-small" onClick={() => void store.resolveConflict('local')}>
                Keep this device's version
              </button>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => downloadJson(store.data, 'atlas-this-device.json')}>
                Download this device's copy first
              </button>
            </div>
          </Banner>
        )}
      </div>

      {route.page === 'trips' && <TripList />}
      {route.page === 'new' && <NewTrip />}
      {route.page === 'profile' && <ProfilePage />}
      {route.page === 'settings' && <SettingsPage />}
      {route.page === 'trip' && <TripView id={route.id} tab={route.tab} />}
      {route.page === 'print' && <PrintView id={route.id} />}
      {route.page === 'notFound' && (
        <div className="page narrow">
          <h1>Page not found</h1>
          <a href={href({ page: 'trips' })}>Back to trips</a>
        </div>
      )}
    </>
  );
}
