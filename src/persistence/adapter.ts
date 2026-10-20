import type { DatabaseSchema, RowFor, TableName } from "./types";
import type { RowPage, RowQuery } from "./query";
import type { SnapshotReader } from "./snapshot";

export interface PersistenceAdapter extends Partial<SnapshotReader> {
  readonly kind: "local" | "supabase";
  list<T extends TableName>(table: T): Promise<RowFor<T>[]>;
  query?<T extends TableName>(table: T, query?: RowQuery<T>): Promise<RowPage<T>>;
  get<T extends TableName>(table: T, id: string): Promise<RowFor<T> | null>;
  insert<T extends TableName>(table: T, row: RowFor<T>): Promise<RowFor<T>>;
  update<T extends TableName>(table: T, id: string, patch: Partial<RowFor<T>>): Promise<RowFor<T>>;
  remove<T extends TableName>(table: T, id: string): Promise<void>;
  reset?(seed: DatabaseSchema): Promise<void>;
}
