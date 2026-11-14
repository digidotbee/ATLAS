import { describe, expect, it, vi } from 'vitest';
import { emptyData } from '../domain/factory';
import { parseImportedCandidates } from '../domain/research';
import { decideSync, GIST_FILE, readAtlasGist, SyncError, writeAtlasGist } from './gist';
import { loadLocal, saveLocal } from './local';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe('local storage', () => {
  it('starts fresh, round-trips, and refuses corrupt data without overwriting it', () => {
    const s = memoryStorage();
    const first = loadLocal(s);
    expect(first.ok && first.fresh).toBe(true);
    const d = emptyData();
    saveLocal(d, s);
    const again = loadLocal(s);
    expect(again.ok && again.data.updatedAt).toBe(d.updatedAt);
    s.setItem('atlas:data:v1', '{"schemaVersion":99}');
    const bad = loadLocal(s);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.error).toMatch(/schemaVersion 99/);
      expect(bad.raw).toContain('99');
    }
  });
});

describe('sync decision', () => {
  it('pushes, pulls, or flags conflict', () => {
    expect(decideSync('a', 'a', 'x')).toBe('inSync');
    expect(decideSync('b', 'a', 'a')).toBe('push');
    expect(decideSync('a', 'b', 'a')).toBe('pull');
    expect(decideSync('b', 'c', 'a')).toBe('conflict');
  });
});

describe('gist client', () => {
  it('reads and validates gist content', async () => {
    const d = emptyData();
    const f = vi.fn(async () => new Response(JSON.stringify({ id: 'g', html_url: '', files: { [GIST_FILE]: { content: JSON.stringify(d) } } })));
    const got = await readAtlasGist(f as unknown as typeof fetch, 't', 'g');
    expect(got.updatedAt).toBe(d.updatedAt);
  });

  it('turns HTTP failures into actionable errors', async () => {
    const f401 = vi.fn(async () => new Response('nope', { status: 401 }));
    await expect(writeAtlasGist(f401 as unknown as typeof fetch, 't', 'g', emptyData())).rejects.toMatchObject({ kind: 'auth' });
    const fNet = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const err = await readAtlasGist(fNet as unknown as typeof fetch, 't', 'g').catch((e) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect(err.kind).toBe('network');
  });
});

describe('research import', () => {
  it('imports fenced JSON from an AI reply', () => {
    const text = 'Here you go:\n```json\n{"candidates":[{"category":"lodging","name":"La Quebrada Lodge","location":"Potrero","url":"","price":220,"basis":"perNight","priceStatus":"estimated","tags":["Surfing"],"notes":"quiet"}]}\n```';
    const r = parseImportedCandidates(text);
    expect(r.errors).toEqual([]);
    expect(r.candidates[0]).toMatchObject({ name: 'La Quebrada Lodge', basis: 'perNight', status: 'considering' });
  });

  it('rejects everything and lists problems when an item is invalid', () => {
    const r = parseImportedCandidates('{"candidates":[{"category":"spa","name":"X","price":-1,"basis":"weekly","priceStatus":"maybe"}]}');
    expect(r.candidates).toEqual([]);
    expect(r.errors).toHaveLength(4);
  });
});
