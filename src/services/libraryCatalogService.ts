import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { portalLibraryData } from "../domain/portalLibraryScope";
import { readSharedCatalog } from '../persistence/sharedCatalog';
import { normalizedSnapshotTables, validateSnapshotData, type SnapshotTable } from "../persistence/snapshot";
import type { DatabaseSchema } from "../persistence/types";
import type { AnalyticsTag } from "../domain/analytics";
import { mockRequest } from "../mock/client";

export type LibraryCatalog = { revision: string; data: Pick<DatabaseSchema, SnapshotTable>; analyticsTags: AnalyticsTag[] };
/** Stored catalog only: never substitute generated inspection rows after a read failure. */
export async function readLibraryCatalog(siteKey: string): Promise<LibraryCatalog> {
  const tables = [...new Set(normalizedSnapshotTables)];
  if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    const result = await mockRequest<LibraryCatalog>("/library/catalog", { siteKey, tables });
    validateSnapshotData(result.data, tables);
    if (!result.revision || !Array.isArray(result.analyticsTags)) throw new Error("Invalid Library catalog response");
    return scopedCatalog(result);
  }
  return scopedCatalog(await readSharedCatalog());
}

function scopedCatalog(catalog: LibraryCatalog): LibraryCatalog {
  catalog = normalizeSiteReferences(catalog);
  const data = portalLibraryData(catalog.data);
  const pages = new Set(data.pages.map(page => page.key));
  return { ...catalog, data, analyticsTags: catalog.analyticsTags.filter(tag => tag.pageId === "app-shell" || pages.has(tag.pageId)) };
}
