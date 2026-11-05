import { validatePhoneFieldBindings } from "../domain/phoneFields";
import type { AnalyticsTag } from '../domain/analytics';
import { effectiveSiteSnapshotTables, normalizedSnapshotTables } from './catalogTables';
import { localSnapshotRevision, validateSnapshotData, type SnapshotTable } from './snapshot';
import type { DatabaseSchema } from './types';
import { validateIdentityCatalog } from './identityCatalog';
import { validateComponentStructure } from '../domain/componentCatalog';

export type SharedCatalog = {
  formatVersion: 1;
  data: Pick<DatabaseSchema, SnapshotTable>;
  analyticsTags: AnalyticsTag[];
};
export const sharedCatalogPath = 'catalog/portal.json';

/** A public configuration catalog, with no operational or account tables. */
export function validateSharedCatalog(value: unknown): SharedCatalog {
  const catalog = value as SharedCatalog;
  if (!catalog || catalog.formatVersion !== 1 || Object.keys(catalog).some(key => !['formatVersion', 'data', 'analyticsTags'].includes(key)) || !Array.isArray(catalog.analyticsTags)) throw new Error('Invalid shared JSON catalog.');
  validateSnapshotData(catalog.data, [...new Set(normalizedSnapshotTables)]);
  validateIdentityCatalog(catalog.data);
  validateComponentStructure(catalog.data.components);
  for (const row of [...catalog.data.pages, ...catalog.data.fields]) {
    if (typeof row.definition.displayName !== 'string' || !row.definition.displayName.trim()) throw new Error(`Missing catalog display name: ${row.key}`);
  }
  const fieldIds = catalog.data.fields.map(row => row.definition.id);
  if (new Set(fieldIds).size !== fieldIds.length) throw new Error("Duplicate field binding ID");
  validatePhoneFieldBindings(catalog.data.fields.map(row => row.definition));
  for (const { key, definition } of catalog.data.fields) {
    const value = definition.defaultValue;
    if (value !== undefined && typeof value !== 'string' && typeof value !== 'boolean' && !(Array.isArray(value) && value.every(item => typeof item === 'string'))) throw new Error(`Invalid field default: ${key}`);
    if (value !== undefined && definition.options && (Array.isArray(value) ? value : [String(value)]).some(item => !definition.options!.some(option => option.value === item))) throw new Error(`Unknown field default option: ${key}`);
  }
  for (const { key, definition } of catalog.data.pages) {
    const keys = definition.inlineFieldKeys;
    if (keys !== undefined && (!Array.isArray(keys) || new Set(keys).size !== keys.length || keys.some(key => !catalog.data.fields.some(field => field.key === key)))) throw new Error(`Invalid inline page fields: ${key}`);
  }
  return catalog;
}

export function prototypeCatalogData(catalog: SharedCatalog) {
  return Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, catalog.data[table]])) as Pick<DatabaseSchema, typeof effectiveSiteSnapshotTables[number]>;
}

/** One fetch per document load keeps the prototype and Library on one revision. */
export function createSharedCatalogReader(fetcher: typeof fetch, baseUrl: string) {
  let pending: Promise<SharedCatalog & { revision: string }> | undefined;
  return () => pending ??= (async () => {
    const response = await fetcher(`${baseUrl}${sharedCatalogPath}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Shared JSON catalog unavailable (${response.status}).`);
    const catalog = validateSharedCatalog(await response.json());
    return { ...catalog, revision: await localSnapshotRevision({ ...catalog.data, analyticsTags: catalog.analyticsTags }) };
  })();
}

const embeddedCatalog = typeof document === 'undefined' ? null : document.getElementById('standalone-catalog');
export const readSharedCatalog = createSharedCatalogReader(
  embeddedCatalog
    ? async () => new Response(embeddedCatalog.textContent, { headers: { 'Content-Type': 'application/json' } })
    : (...args) => fetch(...args),
  import.meta.env.BASE_URL,
);
