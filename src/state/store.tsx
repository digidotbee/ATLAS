import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptyData, nowIso } from '../domain/factory';
import type { AtlasData, ClimateMonth, FamilyProfile, Trip } from '../domain/types';
import {
  createAtlasGist,
  decideSync,
  findAtlasGist,
  readAtlasGist,
  SyncError,
  verifyToken,
  writeAtlasGist,
} from '../storage/gist';
import {
  clearLocal,
  loadLocal,
  loadSyncSettings,
  saveLocal,
  saveSyncSettings,
  type SyncSettings,
} from '../storage/local';

export type SyncStatus =
  | { state: 'off' }
  | { state: 'idle'; at: string }
  | { state: 'working'; label: string }
  | { state: 'error'; message: string }
  | { state: 'conflict'; remote: AtlasData };

interface Store {
  data: AtlasData;
  loadError: { error: string; raw: string } | null;
  saveError: string | null;
  sync: SyncStatus;
  syncSettings: SyncSettings | null;
  addTrip(trip: Trip): void;
  updateTrip(id: string, fn: (t: Trip) => Trip): void;
  deleteTrip(id: string): void;
  updateProfile(fn: (p: FamilyProfile) => FamilyProfile): void;
  saveClimate(destination: string, climate: Record<string, ClimateMonth>): void;
  replaceAll(data: AtlasData): void;
  resetCorruptLocal(): void;
  connectSync(token: string): Promise<void>;
  disconnectSync(): void;
  syncNow(): Promise<void>;
  resolveConflict(keep: 'local' | 'remote'): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}

const PUSH_DELAY_MS = 2500;

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadLocal(), []);
  const [data, setData] = useState<AtlasData>(initial.ok ? initial.data : emptyData());
  const [loadError, setLoadError] = useState(initial.ok ? null : { error: initial.error, raw: initial.raw });
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialSync = useMemo((): { settings: SyncSettings | null; error: string | null } => {
    try {
      return { settings: loadSyncSettings(), error: null };
    } catch (e) {
      return { settings: null, error: (e as Error).message };
    }
  }, []);
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(initialSync.settings);
  const [sync, setSync] = useState<SyncStatus>(
    initialSync.error
      ? { state: 'error', message: initialSync.error }
      : initialSync.settings
        ? { state: 'idle', at: '' }
        : { state: 'off' },
  );
  const dataRef = useRef(data);
  dataRef.current = data;
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const settingsRef = useRef(syncSettings);
  settingsRef.current = syncSettings;
  const pushTimer = useRef<number | undefined>(undefined);
  const skipPersist = useRef(!initial.ok);

  const storeSettings = useCallback((s: SyncSettings | null) => {
    saveSyncSettings(s);
    settingsRef.current = s;
    setSyncSettings(s);
  }, []);

  /** Full three-way sync with the Gist. Never overwrites a newer remote silently. */
  const runSync = useCallback(async () => {
    const s = settingsRef.current;
    if (!s || skipPersist.current) return;
    setSync({ state: 'working', label: 'Syncing…' });
    try {
      const remote = await readAtlasGist(fetch, s.token, s.gistId);
      const local = dataRef.current;
      const decision = decideSync(local.updatedAt, remote.updatedAt, s.lastSyncedAt);
      if (decision === 'push') {
        await writeAtlasGist(fetch, s.token, s.gistId, local);
        storeSettings({ ...s, lastSyncedAt: local.updatedAt });
      } else if (decision === 'pull') {
        setData(remote);
        storeSettings({ ...s, lastSyncedAt: remote.updatedAt });
      } else if (decision === 'inSync') {
        storeSettings({ ...s, lastSyncedAt: local.updatedAt });
      } else {
        setSync({ state: 'conflict', remote });
        return;
      }
      setSync({ state: 'idle', at: nowIso() });
    } catch (e) {
      setSync({ state: 'error', message: e instanceof SyncError ? e.message : `Sync failed: ${(e as Error).message}` });
    }
  }, [storeSettings]);

  // Persist locally on every change, then schedule a Gist push.
  useEffect(() => {
    if (skipPersist.current) return; // never overwrite unreadable saved data before the user decides
    try {
      saveLocal(data);
      setSaveError(null);
    } catch (e) {
      setSaveError(`Couldn't save in this browser: ${(e as Error).message}. Export a backup from Settings now.`);
    }
    if (settingsRef.current) {
      window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => void runSync(), PUSH_DELAY_MS);
    }
  }, [data, runSync]);

  // Pull on open and when the tab regains focus.
  useEffect(() => {
    void runSync();
    const onFocus = () => document.visibilityState === 'visible' && void runSync();
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [runSync]);

  const mutate = useCallback((fn: (d: AtlasData) => AtlasData) => {
    setData((d) => ({ ...fn(d), updatedAt: nowIso() }));
  }, []);

  const addTrip = useCallback((trip: Trip) => {
    mutate((d) => ({ ...d, trips: [trip, ...d.trips] }));
  }, [mutate]);
  const updateTrip = useCallback((id: string, fn: (t: Trip) => Trip) => {
    mutate((d) => ({
      ...d,
      trips: d.trips.map((t) => (t.id === id ? { ...fn(t), updatedAt: nowIso() } : t)),
    }));
  }, [mutate]);
  const deleteTrip = useCallback((id: string) => {
    mutate((d) => ({ ...d, trips: d.trips.filter((t) => t.id !== id) }));
  }, [mutate]);
  const updateProfile = useCallback((fn: (p: FamilyProfile) => FamilyProfile) => {
    mutate((d) => ({ ...d, profile: fn(d.profile) }));
  }, [mutate]);
  const saveClimate = useCallback((destination: string, climate: Record<string, ClimateMonth>) => {
    mutate((d) => {
      const key = destination.trim().toLowerCase();
      return { ...d, climateCache: { ...(d.climateCache ?? {}), [key]: { ...(d.climateCache?.[key] ?? {}), ...climate } } };
    });
  }, [mutate]);
  const replaceAll = useCallback((next: AtlasData) => {
    skipPersist.current = false;
    setLoadError(null);
    mutate(() => next);
  }, [mutate]);
  const resetCorruptLocal = useCallback(() => {
    clearLocal();
    skipPersist.current = false;
    setLoadError(null);
    setData(emptyData());
  }, []);
  const connectSync = useCallback(async (token: string) => {
    setSync({ state: 'working', label: 'Checking token…' });
    try {
      await verifyToken(fetch, token);
      setSync({ state: 'working', label: 'Looking for your ATLAS Gist…' });
      const existing = await findAtlasGist(fetch, token);
      if (!existing) {
        const created = await createAtlasGist(fetch, token, dataRef.current);
        storeSettings({ token, gistId: created.id, lastSyncedAt: dataRef.current.updatedAt });
        setSync({ state: 'idle', at: nowIso() });
        return;
      }
      const remote = await readAtlasGist(fetch, token, existing.id);
      const local = dataRef.current;
      // A brand-new device (no trips yet) simply adopts the Gist.
      if (local.trips.length === 0 || local.updatedAt === remote.updatedAt) {
        setData(remote);
        storeSettings({ token, gistId: existing.id, lastSyncedAt: remote.updatedAt });
        setSync({ state: 'idle', at: nowIso() });
      } else {
        storeSettings({ token, gistId: existing.id, lastSyncedAt: '' });
        setSync({ state: 'conflict', remote });
      }
    } catch (e) {
      setSync({ state: 'error', message: e instanceof SyncError ? e.message : (e as Error).message });
      throw e;
    }
  }, [storeSettings]);
  const disconnectSync = useCallback(() => {
    window.clearTimeout(pushTimer.current);
    storeSettings(null);
    setSync({ state: 'off' });
  }, [storeSettings]);
  const resolveConflict = useCallback(async (keep: 'local' | 'remote') => {
    const s = settingsRef.current;
    const currentSync = syncRef.current;
    if (!s || currentSync.state !== 'conflict') return;
    const remote = currentSync.remote;
    setSync({ state: 'working', label: 'Resolving…' });
    try {
      if (keep === 'remote') {
        setData(remote);
        storeSettings({ ...s, lastSyncedAt: remote.updatedAt });
      } else {
        const local = { ...dataRef.current, updatedAt: nowIso() };
        await writeAtlasGist(fetch, s.token, s.gistId, local);
        storeSettings({ ...s, lastSyncedAt: local.updatedAt });
        setData(local);
      }
      setSync({ state: 'idle', at: nowIso() });
    } catch (e) {
      setSync({ state: 'error', message: (e as Error).message });
    }
  }, [storeSettings]);

  const store = useMemo<Store>(() => ({
    data,
    loadError,
    saveError,
    sync,
    syncSettings,
    addTrip,
    updateTrip,
    deleteTrip,
    updateProfile,
    saveClimate,
    replaceAll,
    resetCorruptLocal,
    connectSync,
    disconnectSync,
    syncNow: runSync,
    resolveConflict,
  }), [
    data,
    loadError,
    saveError,
    sync,
    syncSettings,
    addTrip,
    updateTrip,
    deleteTrip,
    updateProfile,
    saveClimate,
    replaceAll,
    resetCorruptLocal,
    connectSync,
    disconnectSync,
    runSync,
    resolveConflict,
  ]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
