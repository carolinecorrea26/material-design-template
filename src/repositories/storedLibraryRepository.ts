import { readLibraryCatalog } from "../services/libraryCatalogService";
import { localSnapshotRevision, validateSnapshotRequest, type SnapshotReader, type SnapshotTable } from "../persistence/snapshot";
import type { DatabaseSchema } from "../persistence/types";
import { createPortalDataRepository } from "./portalDataRepository";

/** Read the same persisted catalog as Library tables; never compile source fixtures in the browser. */
export function createStoredLibraryRepository(siteKey: string) {
  const reader: SnapshotReader = {
    async readSnapshot<T extends SnapshotTable>(tables: readonly T[]) {
      validateSnapshotRequest(tables);
      const catalog = await readLibraryCatalog(siteKey);
      const data = Object.fromEntries(tables.map(table => [table, catalog.data[table]])) as Pick<DatabaseSchema, T>;
      return { formatVersion: 1, consistency: "single-read", revision: await localSnapshotRevision(data), data };
    },
  };
  return createPortalDataRepository(reader);
}
