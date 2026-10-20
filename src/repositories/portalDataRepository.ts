import type { PersistenceAdapter } from "../persistence/adapter";
import { normalizedSnapshotTables, validateSnapshotData, validateSnapshotRequest, type SnapshotReader, type SnapshotTable } from "../persistence/snapshot";
import { queryRows, type RowQuery } from "../persistence/query";
import type { DatabaseSchema, RowFor } from "../persistence/types";
import { effectiveConfigurationTables } from "../domain/effectiveConfiguration";
import { resolveEffectiveSite, type EffectiveSiteData } from "../domain/effectiveSite";

export const effectiveSiteSnapshotTables = [...effectiveConfigurationTables, "sites", "clients", "organizations", "organizationProfiles", "siteProducts", "siteProductApplicants", "eligibilityConstraints", "semanticRequirements", "associations", "siteAssociations", "sitePolicies"] as const;
function freeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

/** One immutable handle for Library inspection and candidate Site consumers.
 * Browse pages and Site resolution use the captured rows, never fresh per-table reads.
 */
export function createPortalDataRepository(reader: SnapshotReader | Pick<PersistenceAdapter, "readSnapshot">) {
  return {
    async open(tables: readonly SnapshotTable[] = [...new Set(normalizedSnapshotTables)]) {
      validateSnapshotRequest(tables);
      if (!reader.readSnapshot) throw new Error("This adapter does not support consistent normalized snapshots.");
      const captured = await reader.readSnapshot(tables);
      if (captured.formatVersion !== 1 || captured.consistency !== "single-read" || !/^(local|postgres):v1:sha256:[a-f0-9]{64}$/.test(captured.revision)) throw new Error("Invalid snapshot envelope.");
      validateSnapshotData(captured.data, tables);
      const snapshot = freeze(structuredClone(captured));
      const requireTable = <T extends SnapshotTable>(table: T): RowFor<T>[] => {
        if (!Object.hasOwn(snapshot.data, table)) throw new Error(`Table not captured in this revision: ${table}`);
        return snapshot.data[table] as RowFor<T>[];
      };
      return Object.freeze({
        revision: snapshot.revision,
        consistency: snapshot.consistency,
        tables: Object.freeze([...tables]),
        query<T extends SnapshotTable>(table: T, options: RowQuery<T> = {}) {
          return { revision: snapshot.revision, ...queryRows<T>(requireTable(table), options) };
        },
        get<T extends SnapshotTable>(table: T, id: string): RowFor<T> | null {
          return structuredClone(requireTable(table).find(row => row.id === id) ?? null);
        },
        resolveSite(siteKey: string) {
          for (const table of effectiveSiteSnapshotTables) requireTable(table);
          const site = resolveEffectiveSite(snapshot.data as Pick<DatabaseSchema, typeof effectiveSiteSnapshotTables[number]> as EffectiveSiteData, siteKey);
          return { revision: snapshot.revision, site };
        },
      });
    },
  };
}
export type PortalDataRepository = ReturnType<typeof createPortalDataRepository>;
export type PortalRevision = Awaited<ReturnType<PortalDataRepository["open"]>>;
