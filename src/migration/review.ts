import type { DatabaseSchema } from '../persistence/types';
import { tableNames } from '../persistence/supabaseAdapter';
import { expandedTableSpecs } from './canonical';
export type CanonicalRelation = { field: string; table: keyof DatabaseSchema; key: string; exists: boolean };
/** Resolve relationship values, never the junction's own key. Shared with review tests. */
export function canonicalRelations(db: DatabaseSchema, table: keyof DatabaseSchema, row: Record<string, unknown>): CanonicalRelation[] {
  const relations: Array<{ field: string; table: keyof DatabaseSchema; key: string }> = [];
  const names = new Map(Object.entries(tableNames).map(([key, name]) => [name, key as keyof DatabaseSchema]));
  const spec = expandedTableSpecs[tableNames[table]];
  for (const [column, type] of Object.entries(spec?.columns ?? {})) {
    const target = /references public\.(\w+)\(key\)/.exec(type)?.[1];
    const field = column.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    const key = row[field];
    if (target && typeof key === 'string' && names.has(target)) relations.push({ field, table: names.get(target)!, key });
  }
  if (table === 'requirementTargets' && typeof row.targetTable === 'string' && row.targetTable in db && typeof row.targetKey === 'string') relations.push({ field: 'target', table: row.targetTable as keyof DatabaseSchema, key: row.targetKey });
  if (table === 'semanticRequirements' && typeof row.subjectTable === 'string' && row.subjectTable in db && typeof row.subjectKey === 'string') relations.push({ field: 'subject', table: row.subjectTable as keyof DatabaseSchema, key: row.subjectKey });
  return relations.map(r => ({ ...r, exists: (db[r.table] as unknown as Array<{key?: string}>).some(row => row.key === r.key) }));
}
