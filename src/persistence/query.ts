import type { RowFor, TableName } from "./types";

export type RowQuery<T extends TableName> = {
  filters?: Partial<{ [K in keyof RowFor<T>]: Extract<RowFor<T>[K], string | number | boolean | null> }>;
  orderBy?: Extract<keyof RowFor<T>, string>;
  ascending?: boolean;
  offset?: number;
  limit?: number;
};
export type RowPage<T extends TableName> = { rows: RowFor<T>[]; total: number; offset: number; limit: number };

export function normalizeQuery<T extends TableName>(query: RowQuery<T> = {}) {
  const { filters = {}, orderBy = "id", ascending = true, offset = 0, limit = 500 } = query;
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid query range: offset must be nonnegative and limit must be 1–1000.");
  if (typeof ascending !== "boolean" || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(orderBy)) throw new Error("Invalid query order.");
  for (const [key, value] of Object.entries(filters)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) || value !== null && !["string", "number", "boolean"].includes(typeof value) || typeof value === "number" && !Number.isFinite(value)) throw new Error(`Invalid query filter: ${key}`);
  }
  return { filters, orderBy, ascending, offset, limit };
}

/** Filtering and slicing a captured dataset; never performs fresh persistence reads. */
export function queryRows<T extends TableName>(rows: readonly RowFor<T>[], query: RowQuery<T> = {}): RowPage<T> {
  const options = normalizeQuery(query);
  const value = (row: RowFor<T>, key: string): unknown => (row as unknown as Record<string, unknown>)[key];
  const compare = (left: unknown, right: unknown): number => {
    if (left === right) return 0;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    if (!["string", "number", "boolean"].includes(typeof left) || typeof left !== typeof right) throw new Error("Query ordering requires scalar columns of the same type.");
    const result = left < right ? -1 : 1;
    return options.ascending ? result : -result;
  };
  const filtered = rows.filter(row => Object.entries(options.filters).every(([key, expected]) => value(row, key) === expected));
  const ordered = [...filtered].sort((a, b) => compare(value(a, options.orderBy), value(b, options.orderBy)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { rows: structuredClone(ordered.slice(options.offset, options.offset + options.limit)), total: ordered.length, offset: options.offset, limit: options.limit };
}
