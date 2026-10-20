import { mockRequest, type MockAuthStatus } from '../mock/client';
import { LOCAL_DATABASE_KEY } from './localAdapter';
import type { PersistenceAdapter } from './adapter';
import type { RowFor, TableName } from './types';
import { queryRows, type RowQuery } from './query';
import { localSnapshotRevision, validateSnapshotData, validateSnapshotRequest } from './snapshot';
const tables = new Set<TableName>(['sites', 'applications', 'applicationParticipants', 'applicationEvents', 'changeRequests', 'changeItems', 'releases', 'releaseChanges', 'siteBuilderDrafts', 'auditEvents', 'migrationSchedules']);
const identityTables = new Set<TableName>(['organizations', 'organizationProfiles', 'clients', 'associations', 'siteAssociations', 'sitePolicies', 'associationEntities', 'associationAliases', 'associationAffiliations', 'siteAssociationContexts', 'supportProfiles', 'brandingProfiles']);
/** Operational edits live on the mock server, which enforces the current account. */
export class MockOperationsAdapter implements PersistenceAdapter {
  readonly kind = 'local' as const;
  private readonly base: PersistenceAdapter;
  private migration: Promise<void> | null = null;
  private async migrateExistingEdits() {
    if (typeof window === 'undefined' || !window.localStorage.getItem(LOCAL_DATABASE_KEY)) return;
    this.migration ??= (async () => {
      const status = await mockRequest<MockAuthStatus>('/auth/status');
      if (!status.authenticated || !status.canEdit) { this.migration = null; return; }
      const entries = await Promise.all([...tables].map(async table => [table, await this.base.list(table)] as const));
      await mockRequest('/operations/import', { data: Object.fromEntries(entries) });
    })().catch(error => { this.migration = null; throw error; });
    await this.migration;
  }
  constructor(base: PersistenceAdapter) { this.base = base; }
  async list<T extends TableName>(table: T): Promise<RowFor<T>[]> {
    if (identityTables.has(table)) {
      const result = await mockRequest<{ data: Pick<import('./types').DatabaseSchema, T> }>('/library/catalog', { siteKey: 'all', tables: [table] });
      if (!Array.isArray(result.data?.[table])) throw new Error(`Missing stored identity table: ${table}`);
      return structuredClone(result.data[table]);
    }
    if (tables.has(table)) await this.migrateExistingEdits();
    return tables.has(table) ? mockRequest<RowFor<T>[]>('/operations/read', { table }) : this.base.list(table);
  }
  async query<T extends TableName>(table: T, query: RowQuery<T> = {}) { return queryRows<T>(await this.list(table), query); }
  async get<T extends TableName>(table: T, id: string): Promise<RowFor<T> | null> { return (await this.list(table)).find(row => row.id === id) ?? null; }
  async insert<T extends TableName>(table: T, row: RowFor<T>): Promise<RowFor<T>> {
    if (identityTables.has(table)) throw new Error('Identity records are owned by the stored Library. Browser-only identity edits are unavailable.');
    if (!tables.has(table)) return this.base.insert(table, row);
    await this.migrateExistingEdits();
    return mockRequest<RowFor<T>>('/operations/write', { table, action: 'insert', row });
  }
  async update<T extends TableName>(table: T, id: string, patch: Partial<RowFor<T>>): Promise<RowFor<T>> {
    if (identityTables.has(table)) throw new Error('Identity records are owned by the stored Library. Browser-only identity edits are unavailable.');
    if (!tables.has(table)) return this.base.update(table, id, patch);
    await this.migrateExistingEdits();
    return mockRequest<RowFor<T>>('/operations/write', { table, action: 'update', id, patch });
  }
  async remove<T extends TableName>(table: T, id: string): Promise<void> {
    if (identityTables.has(table)) throw new Error('Identity records are owned by the stored Library. Browser-only identity edits are unavailable.');
    if (!tables.has(table)) return this.base.remove(table, id);
    await mockRequest('/operations/write', { table, action: 'remove', id });
  }
  async reset(): Promise<void> { throw new Error('Reset is unavailable in the account-protected mock platform.'); }
  readSnapshot: PersistenceAdapter['readSnapshot'] = async tables => {
    const requested = validateSnapshotRequest(tables);
    const result = await mockRequest<{ data: Pick<import('./types').DatabaseSchema, typeof tables[number]> }>('/library/catalog', { siteKey: 'all', tables: requested });
    validateSnapshotData(result.data, requested);
    const data = structuredClone(result.data);
    return { formatVersion: 1, consistency: 'single-read', revision: await localSnapshotRevision(data), data };
  };
}
