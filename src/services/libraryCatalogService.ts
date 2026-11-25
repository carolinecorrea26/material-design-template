import { freshStartLibraryData } from '../domain/freshStartLibraryData';
import { freshStartSource, withFreshStartCatalog } from '../domain/freshStartCatalog';
import { compileApplicationSiteIdentities } from '../domain/requirementApplicationCatalog.mjs';
import { canonicalSiteKey, normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { portalLibraryData } from "../domain/portalLibraryScope";
import { readSharedCatalog, type CatalogScope } from '../persistence/sharedCatalog';
import { normalizedSnapshotTables, validateSnapshotData, type SnapshotTable } from "../persistence/snapshot";
import type { DatabaseSchema } from "../persistence/types";
import type { AnalyticsTag } from "../domain/analytics";
import { mockRequest } from "../mock/client";
import { portalDatabaseEnabled } from './portalClient';

export type LibraryCatalog = CatalogScope & { revision: string; data: Pick<DatabaseSchema, SnapshotTable>; analyticsTags: AnalyticsTag[] };
const catalogTables = [...new Set(normalizedSnapshotTables)];
const identityTables = ['sites', 'associationEntities'] as const;
const publishedProjections = new WeakMap<LibraryCatalog, LibraryCatalog>();
const projectedCatalogs = new WeakSet<LibraryCatalog>();
const pendingMockProjections = new Map<string, Promise<LibraryCatalog>>();
let pendingIdentities: Promise<Pick<DatabaseSchema, typeof identityTables[number]>> | undefined;

async function readMockLibraryCatalog(siteKey: string): Promise<LibraryCatalog> {
  const result = await mockRequest<LibraryCatalog>('/library/catalog', { siteKey, tables: catalogTables });
  validateSnapshotData(result.data, catalogTables);
  if (!result.revision || !Array.isArray(result.analyticsTags)) throw new Error('Invalid Library catalog response');
  return projectLibraryCatalog(result, result.siteScope ?? result.data.sites.map(site => site.key));
}

/** Read the shared catalog, then apply the authoritative fresh-start projection. Read failures remain failures. */
export async function readLibraryCatalog(siteKey: string): Promise<LibraryCatalog> {
  if (!portalDatabaseEnabled && import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    const pending = pendingMockProjections.get(siteKey);
    if (pending) return pending;
    const read = readMockLibraryCatalog(siteKey).finally(() => pendingMockProjections.delete(siteKey));
    pendingMockProjections.set(siteKey, read);
    return read;
  }
  const catalog = await readSharedCatalog();
  const projected = publishedProjections.get(catalog) ?? projectLibraryCatalog(catalog);
  publishedProjections.set(catalog, projected);
  return projected;
}

/** Identity controls only need enrolled Sites and their hosting Associations. */
export function readLibraryIdentities() {
  return pendingIdentities ??= (async () => {
    const { data, siteScope } = !portalDatabaseEnabled && import.meta.env.VITE_MOCK_PLATFORM_ENABLED
      ? await mockRequest<CatalogScope & { data: Pick<DatabaseSchema, typeof identityTables[number]> }>('/library/catalog', { siteKey: 'all', tables: identityTables, includeAnalytics: false })
      : await readSharedCatalog();
    const identity = { sites: data.sites, associationEntities: data.associationEntities };
    validateSnapshotData(identity, identityTables);
    const source = freshStartSource();
    const enrolled = compileApplicationSiteIdentities(identity, source, undefined, siteScope?.map(canonicalSiteKey) ?? identity.sites.map(site => site.key));
    return { ...enrolled, sites: enrolled.sites.filter(site => Object.hasOwn(source.fields.sites, site.key)) };
  })().finally(() => { pendingIdentities = undefined; });
}

export function projectLibraryCatalog(catalog: LibraryCatalog, siteScope: readonly string[] | undefined = catalog.siteScope): LibraryCatalog {
  catalog = normalizeSiteReferences(catalog);
  const data = portalLibraryData(freshStartLibraryData(catalog.data, undefined, siteScope?.map(canonicalSiteKey)));
  const pages = new Set(data.pages.map(page => page.key));
  const projected = { ...catalog, siteScope: siteScope?.map(canonicalSiteKey), data, analyticsTags: catalog.analyticsTags.filter(tag => tag.pageId === "app-shell" || pages.has(tag.pageId)) };
  projectedCatalogs.add(projected);
  return projected;
}

/** Captured Library revisions already include the compiled shared and Site records. */
export function compileLibraryCatalog(catalog: LibraryCatalog, siteKey: string): LibraryCatalog {
  if (projectedCatalogs.has(catalog)) return catalog;
  return { ...catalog, data: withFreshStartCatalog(catalog.data, siteKey === 'all' ? undefined : siteKey, catalog.siteScope) };
}

export function isProjectedLibraryCatalog(catalog: LibraryCatalog): boolean {
  return projectedCatalogs.has(catalog);
}
