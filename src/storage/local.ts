import { emptyData } from '../domain/factory';
import type { AtlasData } from '../domain/types';
import { parseAtlasData } from '../domain/validate';

const DATA_KEY = 'atlas:data:v1';
const SYNC_KEY = 'atlas:sync:v1';

export type LoadResult =
  | { ok: true; data: AtlasData; fresh: boolean }
  | { ok: false; error: string; raw: string };

export function loadLocal(storage: Storage = localStorage): LoadResult {
  const raw = storage.getItem(DATA_KEY);
  if (raw === null) return { ok: true, data: emptyData(), fresh: true };
  try {
    return { ok: true, data: parseAtlasData(JSON.parse(raw), 'Saved browser data'), fresh: false };
  } catch (e) {
    return { ok: false, error: (e as Error).message, raw };
  }
}

export function saveLocal(data: AtlasData, storage: Storage = localStorage): void {
  // Let quota / privacy-mode errors propagate: the caller shows them.
  storage.setItem(DATA_KEY, JSON.stringify(data));
}

export function clearLocal(storage: Storage = localStorage): void {
  storage.removeItem(DATA_KEY);
}

export interface SyncSettings {
  token: string;
  gistId: string;
  /** updatedAt of the data last known to be identical locally and in the Gist. */
  lastSyncedAt: string;
}

/** The token stays on this device only — it is never written into the Gist itself. */
export function loadSyncSettings(storage: Storage = localStorage): SyncSettings | null {
  const raw = storage.getItem(SYNC_KEY);
  if (!raw) return null;
  const s = JSON.parse(raw) as SyncSettings;
  if (typeof s.token !== 'string' || typeof s.gistId !== 'string') {
    throw new Error('Saved sync settings are damaged. Disconnect and reconnect sync in Settings.');
  }
  return s;
}

export function saveSyncSettings(s: SyncSettings | null, storage: Storage = localStorage): void {
  if (s === null) storage.removeItem(SYNC_KEY);
  else storage.setItem(SYNC_KEY, JSON.stringify(s));
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
