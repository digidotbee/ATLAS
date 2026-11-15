import type { AtlasData } from '../domain/types';
import { parseAtlasData } from '../domain/validate';

export const GIST_FILE = 'atlas-data.json';
const API = 'https://api.github.com';

type Fetch = typeof fetch;

export class SyncError extends Error {
  constructor(
    message: string,
    readonly kind: 'auth' | 'permission' | 'notFound' | 'network' | 'server' | 'data',
  ) {
    super(message);
  }
}

async function call(f: Fetch, token: string, path: string, init: RequestInit = {}): Promise<unknown> {
  let res: Response;
  try {
    res = await f(`${API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch (e) {
    throw new SyncError(`Couldn't reach GitHub (${(e as Error).message}). Check your connection; changes are still saved in this browser.`, 'network');
  }
  if (res.ok) return res.json();
  const detail = await res.text().catch(() => '');
  if (res.status === 401) {
    throw new SyncError('GitHub rejected the token (expired or revoked). Create a new token with Gist access in Settings.', 'auth');
  }
  if (res.status === 403) {
    throw new SyncError('The token does not have Gist permission. For a fine-grained token enable "Gists: Read and write"; for a classic token tick the "gist" scope.', 'permission');
  }
  if (res.status === 404) {
    throw new SyncError('The ORIVOIR Gist was not found — it may have been deleted, or the token cannot see it. Reconnect sync in Settings.', 'notFound');
  }
  throw new SyncError(`GitHub returned ${res.status}. ${detail.slice(0, 200)}`, 'server');
}

interface GistFile {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}
interface Gist {
  id: string;
  html_url: string;
  files: Record<string, GistFile | null>;
}

export async function verifyToken(f: Fetch, token: string): Promise<string> {
  const user = (await call(f, token, '/user')) as { login: string };
  return user.login;
}

/** Finds the user's existing ATLAS gist (most recently updated first). */
export async function findAtlasGist(f: Fetch, token: string): Promise<Gist | null> {
  for (let page = 1; page <= 10; page++) {
    const gists = (await call(f, token, `/gists?per_page=100&page=${page}`)) as Gist[];
    const hit = gists.find((g) => g.files && GIST_FILE in g.files);
    if (hit) return hit;
    if (gists.length < 100) return null;
  }
  return null;
}

export async function createAtlasGist(f: Fetch, token: string, data: AtlasData): Promise<Gist> {
  return (await call(f, token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: 'ORIVOIR travel planner data (private)',
      public: false,
      files: { [GIST_FILE]: { content: JSON.stringify(data, null, 1) } },
    }),
  })) as Gist;
}

export async function readAtlasGist(f: Fetch, token: string, gistId: string): Promise<AtlasData> {
  const gist = (await call(f, token, `/gists/${gistId}`)) as Gist;
  const file = gist.files[GIST_FILE];
  if (!file) throw new SyncError(`The Gist exists but has no ${GIST_FILE} file.`, 'data');
  let content = file.content ?? '';
  if (file.truncated) {
    if (!file.raw_url) throw new SyncError('The Gist file is too large and GitHub gave no download link.', 'data');
    let res: Response;
    try {
      res = await f(file.raw_url);
    } catch (e) {
      throw new SyncError(`Couldn't download the full Gist file (${(e as Error).message}).`, 'network');
    }
    if (!res.ok) throw new SyncError(`Downloading the full Gist file failed (${res.status}).`, 'server');
    content = await res.text();
  }
  try {
    return parseAtlasData(JSON.parse(content), 'Gist data');
  } catch (e) {
    throw new SyncError((e as Error).message, 'data');
  }
}

export async function writeAtlasGist(f: Fetch, token: string, gistId: string, data: AtlasData): Promise<void> {
  await call(f, token, `/gists/${gistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(data, null, 1) } } }),
  });
}

export type SyncDecision = 'inSync' | 'push' | 'pull' | 'conflict';

/**
 * Three-way decision using the last version both sides agreed on.
 * - only local changed → push; only remote changed → pull; both changed → conflict (user decides).
 */
export function decideSync(localUpdatedAt: string, remoteUpdatedAt: string, lastSyncedAt: string): SyncDecision {
  if (localUpdatedAt === remoteUpdatedAt) return 'inSync';
  const localChanged = localUpdatedAt !== lastSyncedAt;
  const remoteChanged = remoteUpdatedAt !== lastSyncedAt;
  if (localChanged && !remoteChanged) return 'push';
  if (!localChanged && remoteChanged) return 'pull';
  return 'conflict';
}
