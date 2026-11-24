import { freshStartLibraryData } from '../domain/freshStartLibraryData';
import { canonicalSiteKey, normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { portalLibraryData } from "../domain/portalLibraryScope";
import { readSharedCatalog, type CatalogScope } from '../persistence/sharedCatalog';
import { normalizedSnapshotTables, validateSnapshotData, type SnapshotTable } from "../persistence/snapshot";
import type { DatabaseSchema } from "../persistence/types";
import type { AnalyticsTag } from "../domain/analytics";
import { mockRequest } from "../mock/client";

export type LibraryCatalog = CatalogScope & { revision: string; data: Pick<DatabaseSchema, SnapshotTable>; analyticsTags: AnalyticsTag[] };
/** Read the shared catalog, then apply the authoritative fresh-start projection. Read failures remain failures. */
export async function readLibraryCatalog(siteKey: string): Promise<LibraryCatalog> {
  const tables = [...new Set(normalizedSnapshotTables)];
  if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    const result = await mockRequest<LibraryCatalog>("/library/catalog", { siteKey, tables });
    validateSnapshotData(result.data, tables);
    if (!result.revision || !Array.isArray(result.analyticsTags)) throw new Error("Invalid Library catalog response");
    return projectLibraryCatalog(result, result.siteScope ?? result.data.sites.map(site => site.key));
  }
  return projectLibraryCatalog(await readSharedCatalog());
}

export function projectLibraryCatalog(catalog: LibraryCatalog, siteScope: readonly string[] | undefined = catalog.siteScope): LibraryCatalog {
  catalog = normalizeSiteReferences(catalog);
  const data = portalLibraryData(freshStartLibraryData(catalog.data, undefined, siteScope?.map(canonicalSiteKey)));
  const pages = new Set(data.pages.map(page => page.key));
  return { ...catalog, siteScope: siteScope?.map(canonicalSiteKey), data, analyticsTags: catalog.analyticsTags.filter(tag => tag.pageId === "app-shell" || pages.has(tag.pageId)) };
}
