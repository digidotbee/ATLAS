import { useRef, useState } from 'react';
import { parseAtlasData } from '../domain/validate';
import { useStore } from '../state/store';
import { downloadJson } from '../storage/local';
import { Banner, Field } from './common';
import { useThemePref, type ThemePref } from './theme';

export function SettingsPage() {
  const store = useStore();
  const { sync, syncSettings } = store;
  const [token, setToken] = useState('');
  const [importMsg, setImportMsg] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [themePref, setThemePref] = useThemePref();

  return (
    <div className="page narrow stack">
      <p className="eyebrow">Settings</p>
      <h1>Saving & sync</h1>

      <section className="card stack-sm">
        <h2>Appearance</h2>
        <p className="muted small">Storm is the dark mode, Daylight the light one. Auto follows this device's setting. Saved on this device only.</p>
        <div className="segmented" role="group" aria-label="Theme">
          {(['auto', 'storm', 'daylight'] as ThemePref[]).map((t) => (
            <button type="button" key={t} className={themePref === t ? 'on' : ''} aria-pressed={themePref === t} onClick={() => setThemePref(t)}>
              {t === 'auto' ? 'Auto' : t === 'storm' ? 'Storm' : 'Daylight'}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack-sm">
        <h2>Sync across devices</h2>
        <p className="muted small">
          ORIVOIR always saves in this browser. To use it on your phone and laptop, connect a private GitHub Gist — ORIVOIR keeps all your trips
          in one private file there. The token stays on this device and is never stored in the Gist.
        </p>
        {syncSettings ? (
          <>
            <p>
              <strong>Connected.</strong>{' '}
              <a href={`https://gist.github.com/${syncSettings.gistId}`} target="_blank" rel="noreferrer noopener">
                View your ORIVOIR Gist ↗
              </a>
            </p>
            <div className="actions">
              <button type="button" className="btn" onClick={() => void store.syncNow()} disabled={sync.state === 'working'}>
                Sync now
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (confirm('Disconnect sync on this device? Your trips stay in this browser and in the Gist.')) store.disconnectSync();
                }}
              >
                Disconnect this device
              </button>
            </div>
          </>
        ) : (
          <form
            className="stack-sm"
            onSubmit={(e) => {
              e.preventDefault();
              store.connectSync(token.trim()).then(
                () => setToken(''),
                () => undefined, // error is shown in the sync status banner below
              );
            }}
          >
            <ol className="small steps">
              <li>
                Open{' '}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer noopener">
                  GitHub → new fine-grained token ↗
                </a>
                .
              </li>
              <li>Name it “ORIVOIR”, pick an expiration, and under <em>Account permissions</em> set <strong>Gists: Read and write</strong>. Nothing else is needed.</li>
              <li>Generate the token, then paste it below.</li>
            </ol>
            <Field label="GitHub token">
              <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" />
            </Field>
            <button className="btn btn-primary" type="submit" disabled={!token.trim() || sync.state === 'working'}>
              Connect sync
            </button>
          </form>
        )}
        {sync.state === 'working' && <Banner tone="info">{sync.label}</Banner>}
        {sync.state === 'error' && <Banner tone="error">{sync.message}</Banner>}
      </section>

      <section className="card stack-sm">
        <h2>Backup file</h2>
        <p className="muted small">Download everything (trips, research, profile) as one file, or restore from one.</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => downloadJson(store.data, `atlas-backup-${new Date().toISOString().slice(0, 10)}.json`)}>
            Download backup
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Restore from backup…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                const parsed = parseAtlasData(JSON.parse(await f.text()), f.name);
                if (!confirm(`Replace everything in ORIVOIR with “${f.name}” (${parsed.trips.length} trips)?`)) return;
                store.replaceAll(parsed);
                setImportMsg({ tone: 'info', text: `Restored ${parsed.trips.length} trips.` });
              } catch (err) {
                setImportMsg({ tone: 'error', text: `Couldn't restore: ${(err as Error).message}` });
              }
            }}
          />
        </div>
        {importMsg && <Banner tone={importMsg.tone}>{importMsg.text}</Banner>}
      </section>
    </div>
  );
}
