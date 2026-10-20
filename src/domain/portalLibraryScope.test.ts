import type { FieldId } from "./fields";
import { beforeAll, describe, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { portalLibraryData } from './portalLibraryScope';
import { normalizedSnapshotTables } from '../persistence/snapshot';
import type { DatabaseSchema } from '../persistence/types';
import { LocalStorageAdapter } from '../persistence/localAdapter';
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); vi.stubGlobal('crypto', webcrypto); });
const catalog = (data: DatabaseSchema) => Object.fromEntries(normalizedSnapshotTables.map(table => [table, data[table]])) as Parameters<typeof portalLibraryData>[0];
describe('portal catalog scope', () => {
  it('excludes internal page placements and keeps operational storage unchanged', () => {
    const result = portalLibraryData(catalog(db));
    expect(result.pages.every(page => page.definition.flow !== 'internal')).toBe(true);
    const keys = new Set(result.pages.map(page => page.key));
    expect(result.pageFields.every(field => keys.has(field.pageKey))).toBe(true);
    expect(db.pages.some(page => page.definition.flow === 'internal')).toBe(true);
  });
  it('removes fields, conditions, and rules owned only by internal pages while retaining shared fields', () => {
    const copy = structuredClone(db);
    const internal = copy.pages.find(page => page.definition.flow === 'internal')!;
    const field = copy.fields[0];
    const owned = { ...field, id: 'admin-only', key: 'admin-only', definition: { ...field.definition, id: 'admin-only' } } as typeof field;
    copy.fields.push(owned);
    copy.pageFields.push({ id: 'admin-placement', key: 'admin-placement', pageKey: internal.key, fieldKey: owned.key, position: 0 });
    copy.pageFields.push({ id: 'admin-shared', key: 'admin-shared', pageKey: internal.key, fieldKey: field.key, position: 1 });
    copy.conditions.push({ ...copy.conditions[0], key: 'condition-admin-only', definition: { id: 'condition-admin-only', match: 'all', conditions: [{ fieldId: owned.definition.id as FieldId, operator: 'equals', value: 'yes' }] } });
    copy.rules.push({ ...copy.rules[0], key: 'rule-admin-only', definition: { ...copy.rules[0].definition, id: 'rule-admin-only', ref: 'src/pages/admin/AccountSettings.tsx' } });
    const result = portalLibraryData(catalog(copy));
    expect(result.fields.some(row => row.key === owned.key)).toBe(false);
    expect(result.fields.some(row => row.key === field.key)).toBe(true);
    expect(result.conditions.some(row => row.key === 'condition-admin-only')).toBe(false);
    expect(result.rules.some(row => row.key === 'rule-admin-only')).toBe(false);
  });
  it('stores every portal Storybook component in the snapshot and returns detached rows', async () => {
    const snapshot = await new LocalStorageAdapter(db).readSnapshot(['components']);
    expect(snapshot.data.components).toHaveLength(67);
    expect(snapshot.data.components.every(row => row.definition.name && row.definition.description && row.definition.storybookPath.startsWith('?path=/story/'))).toBe(true);
    expect(snapshot.data.components.some(row => /\/(admin|docs)\//.test(row.definition.source))).toBe(false);
    snapshot.data.components[0].definition.name = 'Changed copy';
    expect(db.components[0].definition.name).not.toBe('Changed copy');
  });
  it('persists classification and places authored dependencies before their dependents', () => {
    const rules = new Map(db.rules.map(row => [row.key, row.definition]));
    for (const row of db.rules) {
      expect(row.definition.categories?.length).toBeGreaterThan(0);
      expect(row.definition.sequence).toBeGreaterThan(0);
      for (const dependency of row.definition.dependsOn ?? []) expect(rules.get(dependency)?.sequence).toBeLessThan(row.definition.sequence!);
    }
  });
});
