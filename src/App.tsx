import { useStore } from './state/store';
import { downloadJson } from './storage/local';
import { Banner } from './ui/common';
import { NewTrip } from './ui/NewTrip';
import { PrintView } from './ui/PrintView';
import { ProfilePage } from './ui/ProfilePage';
import { href, useRoute } from './ui/router';
import { SettingsPage } from './ui/SettingsPage';
import { AllTrips, TripList } from './ui/TripList';
import { TripView } from './ui/TripView';
import { useThemePref } from './ui/theme';

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
  const [, setTheme, effectiveTheme] = useThemePref();
  // "Planner" opens the most recently edited trip, or starts a new one.
  const latest = [...store.data.trips].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const plannerHref = latest ? href({ page: 'trip', id: latest.id, tab: 'dates' }) : href({ page: 'new' });

  return (
    <>
      {!isPrint && (
        <header className="app-header no-print">
          <a className="logo" href={href({ page: 'trips' })}>
            <span className="logo-word">
              ATLAS<span className="logo-dot">.</span>
            </span>
            <span className="logo-sub">Family travel planner</span>
          </a>
          <nav className="app-nav">
            <a href={href({ page: 'trips' })} className={route.page === 'trips' ? 'active' : ''}>
              Home
            </a>
            <a href={href({ page: 'all' })} className={route.page === 'all' ? 'active' : ''}>
              Trips
            </a>
            <a href={plannerHref} className={route.page === 'trip' || route.page === 'new' ? 'active' : ''}>
              Planner
            </a>
          </nav>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(effectiveTheme === 'storm' ? 'daylight' : 'storm')}
            aria-label={effectiveTheme === 'storm' ? 'Switch to Daylight' : 'Switch to Storm'}
            title={effectiveTheme === 'storm' ? 'Daylight' : 'Storm'}
          >
            {effectiveTheme === 'storm' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.6 9.1 4.5 4.5 0 0 0 7 18z" />
                <path d="m11.5 13-1.5 3h3l-1.5 3" />
              </svg>
            )}
          </button>
          <a className="icon-btn" href={href({ page: 'profile' })} aria-label="Family profile" title="Family profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
              <circle cx="16.5" cy="7.5" r="2.6" />
              <path d="M16 12.6c2.6 0 4.5 1.5 5 4.4" />
            </svg>
          </a>
          <a className="icon-btn" href={href({ page: 'settings' })} aria-label="Settings" title="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </a>
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
      {route.page === 'all' && <AllTrips />}
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
      {!isPrint && (
        <footer className="app-footer no-print">
          <div>
            <div>
              <p className="footer-name">ATLAS · Family travel planner</p>
              <p className="footer-sub">Wild by nature. Engineered with intention.</p>
            </div>
            <span className="tag tag-lock">{effectiveTheme === 'storm' ? 'Storm' : 'Daylight'}</span>
          </div>
        </footer>
      )}
      {!isPrint && (
        <nav className="bottom-nav no-print" aria-label="Main">
          <a href={href({ page: 'trips' })} className={route.page === 'trips' ? 'active' : ''}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v10h13V10" />
              <path d="M10 20v-5.5h4V20" />
            </svg>
            Home
          </a>
          <a href={href({ page: 'all' })} className={route.page === 'all' ? 'active' : ''}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="7" width="18" height="13" rx="2.5" />
              <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M8.5 7v13M15.5 7v13" />
            </svg>
            Trips
          </a>
          <a href={plannerHref} className={route.page === 'trip' || route.page === 'new' ? 'active' : ''}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
              <path d="M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01M16.5 17.5h.01" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            Planner
          </a>
        </nav>
      )}
    </>
  );
}
