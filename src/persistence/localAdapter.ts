import { normalizeSiteReferences } from '../domain/siteIdentity.mjs';
import { emptyLibrary } from "./emptyLibrary";
import { synchronizeAssociationStructure } from './associationStructure';
import type { PersistenceAdapter } from "./adapter";
import type { DatabaseSchema, RowFor, TableName } from "./types";
import { queryRows, type RowQuery } from "./query";
import { localSnapshotRevision, validateSnapshotData, validateSnapshotRequest, type RevisionSnapshot, type SnapshotTable } from "./snapshot";

export const LOCAL_DATABASE_KEY = "portal-prototype-database-v2";

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }

const clone = <T,>(value: T): T => structuredClone(value);

export class LocalStorageAdapter implements PersistenceAdapter {
  readonly kind = "local" as const;
  private memory: DatabaseSchema;
  private readonly seed: DatabaseSchema;
  private readonly storage?: StorageLike;

  constructor(seed: DatabaseSchema, storage?: StorageLike) {
    this.seed = seed;
    this.storage = storage;
    this.memory = clone(seed);
  }

  private read(cloneMemory = true, strict = false): DatabaseSchema {
    const value = this.storage?.getItem(LOCAL_DATABASE_KEY);
    if (!value) return cloneMemory ? clone(this.memory) : this.memory;
    let parsed: Partial<DatabaseSchema>;
    try {
      parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid local database.");
    } catch { if (strict) throw new Error("Invalid local database. Snapshot read refused."); return clone(this.seed); }
    // Identity conflicts must surface; do not substitute the seed for saved data.
    parsed = normalizeSiteReferences(parsed);
    if (parsed.associationEntities === undefined && parsed.clients && parsed.sites && parsed.associations && parsed.siteAssociations && parsed.sitePolicies) {
      parsed = synchronizeAssociationStructure({ ...emptyLibrary(), ...parsed } as DatabaseSchema);
    }
    for (const table of ['portalActors','applicationCoverages','applicationRiders','applicationAnswers','applicationSnapshots','schemaReconciliationIssues','portalReferenceTypes','portalEntityReferences'] as const) parsed[table] ??= [];
    if (strict) return parsed as DatabaseSchema;
    return { ...emptyLibrary(), applicants: [], applicationApplicants: [], applicationAssociations: [], migrationSchedules: [], siteEnvironmentLinks: clone(this.seed.siteEnvironmentLinks), ...parsed } as DatabaseSchema;
  }

  private write(database: DatabaseSchema) {
    this.memory = clone(database);
    this.storage?.setItem(LOCAL_DATABASE_KEY, JSON.stringify(database));
  }

  async list<T extends TableName>(table: T): Promise<RowFor<T>[]> { return clone(this.read(false)[table]) as RowFor<T>[]; }
  async query<T extends TableName>(table: T, query: RowQuery<T> = {}) { return queryRows<T>(this.read(false)[table] as RowFor<T>[], query); }

  async readSnapshot<T extends SnapshotTable>(tables: readonly T[]): Promise<RevisionSnapshot<T>> {
    const requested = validateSnapshotRequest(tables);
    // Capture all rows in one synchronous storage read, before hashing or any await.
    const database = this.read(false, true);
    const data = Object.fromEntries(requested.map(table => [table, clone(table === 'flagAssignments' ? database.flagAssignments.filter(row => row.applicationId == null) : database[table])])) as Pick<DatabaseSchema, T>;
    validateSnapshotData(data, requested);
    return { formatVersion: 1, consistency: "single-read", revision: await localSnapshotRevision(data), data };
  }
  async get<T extends TableName>(table: T, id: string): Promise<RowFor<T> | null> {
    return clone((this.read(false)[table] as RowFor<T>[]).find((row) => row.id === id) ?? null);
  }
  async insert<T extends TableName>(table: T, row: RowFor<T>): Promise<RowFor<T>> {
    const database = this.read();
    const rows = database[table] as RowFor<T>[];
    if (rows.some((existing) => existing.id === row.id)) throw new Error(`${table} record ${row.id} already exists.`);
    rows.push(clone(row)); this.write(database); return clone(row);
  }
  async update<T extends TableName>(table: T, id: string, patch: Partial<RowFor<T>>): Promise<RowFor<T>> {
    const database = this.read(); const rows = database[table] as RowFor<T>[];
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) throw new Error(`${table} record ${id} was not found.`);
    rows[index] = { ...rows[index], ...clone(patch), id };
    this.write(database); return clone(rows[index]);
  }
  async remove<T extends TableName>(table: T, id: string): Promise<void> {
    const database = this.read();
    (database[table] as RowFor<T>[]) = (database[table] as RowFor<T>[]).filter((row) => row.id !== id);
    this.write(database);
  }
  async reset(seed = this.seed): Promise<void> { this.storage?.removeItem(LOCAL_DATABASE_KEY); this.write(seed); }
}
