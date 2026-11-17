import { migrateData } from './migrate';
import { SCHEMA_VERSION, type AtlasData } from './types';

/**
 * Structural validation for data loaded from the browser or a Gist.
 * Throws a descriptive error instead of silently repairing data — a corrupt file must be noticed.
 */
export function parseAtlasData(raw: unknown, source: string): AtlasData {
  const fail = (msg: string): never => {
    throw new Error(`${source}: ${msg}`);
  };
  if (typeof raw !== 'object' || raw === null) fail('data is not an object.');
  const d = raw as Record<string, unknown>;
  if (d.schemaVersion !== SCHEMA_VERSION) {
    fail(`unsupported schemaVersion ${String(d.schemaVersion)} (this ATLAS reads version ${SCHEMA_VERSION}).`);
  }
  if (typeof d.updatedAt !== 'string') fail('missing updatedAt.');
  if (typeof d.profile !== 'object' || d.profile === null) fail('missing profile.');
  const p = d.profile as Record<string, unknown>;
  if (!Array.isArray(p.interests)) fail('profile.interests must be a list.');
  if (!Array.isArray(d.trips)) fail('trips must be a list.');
  (d.trips as unknown[]).forEach((t, i) => {
    if (typeof t !== 'object' || t === null) fail(`trip ${i + 1} is not an object.`);
    const tr = t as Record<string, unknown>;
    for (const key of ['id', 'name', 'destination', 'currency']) {
      if (typeof tr[key] !== 'string') fail(`trip ${i + 1} is missing "${key}".`);
    }
    if (tr.budgetTotal !== null && typeof tr.budgetTotal !== 'number') fail(`trip "${String(tr.name)}" has no numeric budgetTotal or null budget target.`);
    for (const key of ['dateOptions', 'candidates']) {
      if (!Array.isArray(tr[key])) fail(`trip "${String(tr.name)}" has no ${key} list.`);
    }
    if (typeof tr.travelers !== 'object' || tr.travelers === null) fail(`trip "${String(tr.name)}" has no travelers.`);
  });
  return migrateData(raw as AtlasData);
}
