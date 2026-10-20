import type { PersistenceAdapter } from "../persistence/adapter";
import type { TableName } from "../persistence/types";
import type { RowQuery } from "../persistence/query";

/** Adapter-backed reads share the same contract for local storage and Supabase.
 * Failures propagate; a failed remote read never silently falls back to demo data.
 */
export function createReadRepository<T extends TableName>(adapter: PersistenceAdapter, table: T) {
  return {
    list: () => adapter.list(table),
    query: (options?: RowQuery<T>) => {
      if (!adapter.query) throw new Error("This adapter does not support scoped queries.");
      return adapter.query(table, options);
    },
    get: (id: string) => adapter.get(table, id),
  };
}
export function createFoundationRepositories(adapter: PersistenceAdapter) {
  return {
    sites: createReadRepository(adapter, "sites"),
    clients: createReadRepository(adapter, "clients"),
    organizations: createReadRepository(adapter, "organizations"),
    associations: createReadRepository(adapter, "associations"),
    siteAssociations: createReadRepository(adapter, "siteAssociations"),
    siteEnvironmentLinks: createReadRepository(adapter, "siteEnvironmentLinks"),
  };
}
