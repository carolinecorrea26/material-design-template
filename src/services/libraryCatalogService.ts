import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { portalLibraryData } from "../domain/portalLibraryScope";
import { persistence } from "../persistence/client";
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
  if (import.meta.env.DEV && persistence.kind === "local") {
    const response = await fetch("/api/local-library/catalog", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Stored Library catalog is unavailable");
    validateSnapshotData(result.data, tables);
    if (!Array.isArray(result.analyticsTags)) throw new Error("Invalid stored tracking records");
    return scopedCatalog(result as LibraryCatalog);
  }
  const [snapshot, analyticsTags] = await Promise.all([persistence.readSnapshot!(tables), persistence.list("analyticsTags")]);
  return scopedCatalog({ revision: snapshot.revision, data: snapshot.data, analyticsTags });
}

function scopedCatalog(catalog: LibraryCatalog): LibraryCatalog {
  catalog = normalizeSiteReferences(catalog);
  const data = portalLibraryData(catalog.data);
  const pages = new Set(data.pages.map(page => page.key));
  return { ...catalog, data, analyticsTags: catalog.analyticsTags.filter(tag => tag.pageId === "app-shell" || pages.has(tag.pageId)) };
}
