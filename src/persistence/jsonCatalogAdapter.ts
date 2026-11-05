import type { PersistenceAdapter } from './adapter';
import { normalizedSnapshotTables } from './catalogTables';
import { queryRows, type RowQuery } from './query';
import { readSharedCatalog } from './sharedCatalog';
import { validateSnapshotRequest } from './snapshot';
import type { DatabaseSchema, RowFor, TableName } from './types';

const catalogTables = new Set<TableName>([...normalizedSnapshotTables, 'analyticsTags']);

/** Catalog records come from the shared file; business demo records stay local. */
export class JsonCatalogAdapter implements PersistenceAdapter {
  readonly kind = 'local' as const;
  private readonly base: PersistenceAdapter;
  private readonly read: typeof readSharedCatalog;
  constructor(base: PersistenceAdapter, read = readSharedCatalog) { this.base = base; this.read = read; }

  async list<T extends TableName>(table: T): Promise<RowFor<T>[]> {
    if (!catalogTables.has(table)) return this.base.list(table);
    const catalog = await this.read();
    return structuredClone(table === 'analyticsTags' ? catalog.analyticsTags : catalog.data[table as keyof typeof catalog.data]) as RowFor<T>[];
  }
  async query<T extends TableName>(table: T, query: RowQuery<T> = {}) { return queryRows<T>(await this.list(table), query); }
  async get<T extends TableName>(table: T, id: string) { return (await this.list(table)).find(row => row.id === id) ?? null; }

  private writable(table: TableName) {
    if (catalogTables.has(table)) throw new Error('Update the shared JSON catalog and redeploy to change these records.');
  }
  async insert<T extends TableName>(table: T, row: RowFor<T>) { this.writable(table); return this.base.insert(table, row); }
  async update<T extends TableName>(table: T, id: string, patch: Partial<RowFor<T>>) { this.writable(table); return this.base.update(table, id, patch); }
  async remove<T extends TableName>(table: T, id: string) { this.writable(table); return this.base.remove(table, id); }

  readSnapshot: NonNullable<PersistenceAdapter['readSnapshot']> = async tables => {
    const requested = validateSnapshotRequest(tables);
    const catalog = await this.read();
    const data = structuredClone(Object.fromEntries(requested.map(table => [table, catalog.data[table]]))) as Pick<DatabaseSchema, typeof tables[number]>;
    return { formatVersion: 1, consistency: 'single-read', revision: catalog.revision, data };
  };
}
