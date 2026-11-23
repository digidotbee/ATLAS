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
    fail(`unsupported schemaVersion ${String(d.schemaVersion)} (this version of ORIVOIR reads version ${SCHEMA_VERSION}).`);
  }
  if (typeof d.updatedAt !== 'string') fail('missing updatedAt.');
  if (typeof d.profile !== 'object' || d.profile === null) fail('missing profile.');
  const p = d.profile as Record<string, unknown>;
  if (!Array.isArray(p.interests)) fail('profile.interests must be a list.');
  if (!Array.isArray(d.trips)) fail('trips must be a list.');
  (d.trips as unknown[]).forEach((t, i) => {
    if (typeof t !== 'object' || t === null) fail(`Venture ${i + 1} is not an object.`);
    const tr = t as Record<string, unknown>;
    for (const key of ['id', 'name', 'destination', 'currency']) {
      if (typeof tr[key] !== 'string') fail(`Venture ${i + 1} is missing "${key}".`);
    }
    if (tr.timeZone !== undefined && typeof tr.timeZone !== 'string') fail(`Venture "${String(tr.name)}" has a time zone that isn't text.`);
    if (tr.budgetTotal !== null && typeof tr.budgetTotal !== 'number') fail(`Venture "${String(tr.name)}" has no numeric budgetTotal or null budget target.`);
    if (tr.budgetBasis !== undefined && tr.budgetBasis !== 'total' && tr.budgetBasis !== 'perPerson') {
      fail(`Venture "${String(tr.name)}" has an unknown budget basis "${String(tr.budgetBasis)}".`);
    }
    if (tr.budgetBasis === 'perPerson' && tr.budgetPerPerson !== null && typeof tr.budgetPerPerson !== 'number') {
      fail(`Venture "${String(tr.name)}" has a per-person budget basis but no numeric per-person amount or null.`);
    }
    for (const key of ['dateOptions', 'candidates']) {
      if (!Array.isArray(tr[key])) fail(`Venture "${String(tr.name)}" has no ${key} list.`);
    }
    if (typeof tr.travelers !== 'object' || tr.travelers === null) fail(`Venture "${String(tr.name)}" has no travelers.`);
  });
  return migrateData(raw as AtlasData);
}
