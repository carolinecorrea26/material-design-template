import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersistenceAdapter } from "./adapter";
import type { RowFor, TableName } from "./types";
import { normalizeQuery, type RowPage, type RowQuery } from "./query";
import { validateSnapshotData, validateSnapshotRequest, type RevisionSnapshot, type SnapshotTable } from "./snapshot";

import { tableNames } from "./tableNames";
export { tableNames } from "./tableNames";

const snake = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const mapKeys = (value: Record<string, unknown>, mapper: (key: string) => string) => Object.fromEntries(Object.entries(value).map(([key, item]) => [mapper(key), item]));

export class SupabaseAdapter implements PersistenceAdapter {
  readonly kind = "supabase" as const;
  private readonly client: SupabaseClient;
  constructor(client: SupabaseClient) { this.client = client; }
  async list<T extends TableName>(table: T): Promise<RowFor<T>[]> {
    const rows: RowFor<T>[] = [];
    let total: number | undefined;
    do {
      const page = await this.query(table, { offset: rows.length });
      if (total !== undefined && total !== page.total) throw new Error("Row count changed while listing. Refresh the query; use a snapshot for consistent domain reads.");
      total = page.total;
      if (!page.rows.length && rows.length < total) throw new Error("Incomplete paginated response.");
      rows.push(...page.rows);
    } while (rows.length < total);
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error("Duplicate rows while listing. Refresh the query; use a snapshot for consistent domain reads.");
    return rows;
  }
  async query<T extends TableName>(table: T, query: RowQuery<T> = {}): Promise<RowPage<T>> {
    const options = normalizeQuery(query);
    let request = this.client.from(tableNames[table]).select("*", { count: "exact" });
    for (const [key, value] of Object.entries(options.filters)) request = value === null ? request.is(snake(key), null) : request.eq(snake(key), value);
    request = request.order(snake(options.orderBy), { ascending: options.ascending, nullsFirst: false });
    if (options.orderBy !== "id") request = request.order("id", { ascending: true });
    const { data, error, count } = await request.range(options.offset, options.offset + options.limit - 1);
    if (error) throw error;
    if (!Number.isSafeInteger(count) || count === null || count < 0 || !Array.isArray(data) || data.length > options.limit || data.length > count || count < options.offset + data.length && data.length > 0) throw new Error("Incomplete or malformed query response.");
    return { rows: data.map(row => mapKeys(row, camel) as unknown as RowFor<T>), total: count, offset: options.offset, limit: options.limit };
  }
  async readSnapshot<T extends SnapshotTable>(tables: readonly T[]): Promise<RevisionSnapshot<T>> {
    const requested = validateSnapshotRequest(tables);
    const { data: response, error } = await this.client.rpc("portal_read_snapshot", { requested_tables: requested.map(table => tableNames[table]) });
    if (error) throw error;
    if (!response || response.formatVersion !== 1 || response.consistency !== "single-read" || typeof response.revision !== "string" || !/^postgres:v1:sha256:[a-f0-9]{64}$/.test(response.revision)) throw new Error("Invalid snapshot envelope.");
    const raw = response.data;
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).sort().join("|") !== requested.map(table => tableNames[table]).sort().join("|")) throw new Error("Incomplete or unexpected snapshot tables.");
    const data = Object.fromEntries(requested.map(table => {
      const rows = raw[tableNames[table]];
      if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new Error(`Malformed snapshot rows: ${table}`);
      return [table, rows.map(row => mapKeys(row, camel))];
    }));
    validateSnapshotData(data, requested);
    // Installed SQL contracts and key mapping supply the adapter's row type.
    // Structural validation above does not claim domain-property validation.
    return { formatVersion: 1, consistency: "single-read", revision: response.revision, data: structuredClone(data) as RevisionSnapshot<T>["data"] };
  }
  async get<T extends TableName>(table: T, id: string): Promise<RowFor<T> | null> {
    const { data, error } = await this.client.from(tableNames[table]).select("*").eq("id", id).maybeSingle(); if (error) throw error;
    return data ? mapKeys(data, camel) as unknown as RowFor<T> : null;
  }
  async insert<T extends TableName>(table: T, row: RowFor<T>): Promise<RowFor<T>> {
    const { data, error } = await this.client.from(tableNames[table]).insert(mapKeys(row as unknown as Record<string, unknown>, snake)).select().single(); if (error) throw error;
    return mapKeys(data, camel) as unknown as RowFor<T>;
  }
  async update<T extends TableName>(table: T, id: string, patch: Partial<RowFor<T>>): Promise<RowFor<T>> {
    const { data, error } = await this.client.from(tableNames[table]).update(mapKeys(patch as Record<string, unknown>, snake)).eq("id", id).select().single(); if (error) throw error;
    return mapKeys(data, camel) as unknown as RowFor<T>;
  }
  async remove<T extends TableName>(table: T, id: string): Promise<void> {
    const { error } = await this.client.from(tableNames[table]).delete().eq("id", id); if (error) throw error;
  }
}
