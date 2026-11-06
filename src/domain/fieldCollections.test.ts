import { beforeAll, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { migrateFieldCollectionData } from '../migration/fieldCollectionDefaults';
import { migratePageCatalogSnapshot } from './pageCatalogMigration';
import { effectiveSiteSnapshotTables } from '../repositories/portalDataRepository';
import type { DatabaseSchema } from '../persistence/types';
import type { FieldCollectionDefinition } from './fieldCollections';
import type { LibraryDraft } from './libraryDraft';

let baseline: DatabaseSchema;
beforeAll(() => { baseline = createReviewedMigrationDatabase(); }, 120000);
const policies = (data: DatabaseSchema) => data.configurationValues.find(row => row.configurationKey === 'field-collections')!.value as unknown as Record<string, FieldCollectionDefinition>;

it('resolves saved collection labels, bindings, order, limits and per-Site field overrides', () => {
  const data = structuredClone(baseline);
  data.fields.find(row => row.key === 'child-first-name')!.definition.label = 'Stored given name';
  data.fields.find(row => row.key === 'di-company-name')!.definition.label = 'Stored carrier name';
  policies(data).children.label = 'Dependent'; policies(data).children.maxItems = 3;
  policies(data).children.fields.find(row => row.fieldKey === 'child-first-name')!.valueKey = 'givenName';
  policies(data).selfDisabilityCompanies.fields.reverse();
  data.siteFieldConfigurations.push({ id: 'collection-override', key: 'collection-override', fieldKey: 'di-company-name', pageKey: 'profile', position: 0, scope: 'site', clientKey: null, siteKey: 'asce', include: null, hidden: null, values: { label: 'ASCE carrier' } });
  const collection = resolvePrototypeLibrary(data, 'asce', 'test').fieldCollections;
  expect(collection.children).toMatchObject({ name: 'children', label: 'Dependent', maxItems: 3 });
  expect(collection.children.mapping.fields[0].label).toBe('First Name');
  expect(collection.children.mapping.fieldToKey['child-first-name']).toBe('child-first-name');
  expect(collection.selfDisabilityCompanies.mapping.fields.map(field => field.id)).toEqual([...policies(data).selfDisabilityCompanies.fields].map(row => row.fieldKey));
  expect(collection.selfDisabilityCompanies.mapping.fields.find(field => field.id === 'di-company-name')!.label).toBe('ASCE carrier');
  expect(resolvePrototypeLibrary(data, 'ama', 'test').fieldCollections.selfDisabilityCompanies.mapping.fields.find(field => field.id === 'di-company-name')!.label).toBe('Stored carrier name');
});

it('honors relational child order and removals and a hidden collection field', () => {
  const data = structuredClone(baseline);
  const section = data.pageSections.find(row => row.definition.collectionName === 'children')!;
  const first = data.pageSectionFields.find(row => row.sectionKey === section.key && row.fieldKey === 'child-first-name')!;
  const last = data.pageSectionFields.find(row => row.sectionKey === section.key && row.fieldKey === 'child-last-name')!;
  [first.position, last.position] = [last.position, first.position];
  data.pageSectionFields = data.pageSectionFields.filter(row => !(row.sectionKey === section.key && row.fieldKey === 'child-gender'));
  data.siteFieldConfigurations.push({ id: 'collection-hidden', key: 'collection-hidden', fieldKey: 'di-company-waiting-period', pageKey: 'profile', position: 0, scope: 'site', clientKey: null, siteKey: 'asce', include: null, hidden: true, values: {} });
  const collections = resolvePrototypeLibrary(data, 'asce', 'test').fieldCollections;
  expect(collections.children.mapping.fields.slice(0, 2).map(field => field.id)).toEqual(['child-first-name', 'child-last-name']);
  expect(collections.children.mapping.fields.some(field => field.id === 'child-gender')).toBe(true);
  expect(collections.selfDisabilityCompanies.mapping.fields.some(field => field.id === 'di-company-waiting-period')).toBe(false);
});

it('refuses missing configuration, unsafe or duplicate bindings and conflicting overrides', () => {
  const data = structuredClone(baseline);
  data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== 'field-collections');
  expect(() => resolvePrototypeLibrary(data, 'asce', 'test')).toThrow('Missing or ambiguous');
  for (const valueKey of ['constructor', '__proto__', 'child-first-name']) {
    const invalid = structuredClone(baseline);
    policies(invalid).children.fields[1].valueKey = valueKey;
    expect(() => resolvePrototypeLibrary(invalid, 'asce', 'test')).toThrow('Invalid collection binding');
  }
  const conflicting = structuredClone(baseline);
  for (const id of ['first', 'second']) conflicting.siteFieldConfigurations.push({ id, key: id, fieldKey: 'di-company-name', pageKey: 'profile', position: 0, scope: 'site', siteKey: 'asce', clientKey: null, hidden: null, include: null, values: { label: id } });
  expect(() => resolvePrototypeLibrary(conflicting, 'asce', 'test')).toThrow(/Ambiguous (collection )?field override/);
});

it('explicitly upgrades an older snapshot into a detached draft while preserving its original', () => {
  const data = structuredClone(baseline);
  data.configurationDefinitions = data.configurationDefinitions.filter(row => row.key !== 'field-collections');
  data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== 'field-collections');
  data.fields = data.fields.filter(row => !row.key.startsWith('di-company-'));
  const original = { formatVersion: 1, siteKey: 'asce', editVersion: 1, baseRevision: `local:v1:sha256:${'a'.repeat(64)}`, mockTransport: { id: 'old', version: 1, baseReleaseId: null }, data: Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, data[table]])) } as unknown as LibraryDraft;
  const before = structuredClone(original);
  const { draft, changes } = migratePageCatalogSnapshot(original);
  expect(original).toEqual(before); expect(draft.mockTransport).toBeUndefined();
  expect(changes.filter(row => row.property === 'insert')).toHaveLength(6);
  expect(resolvePrototypeLibrary(draft.data, draft.siteKey, 'test').fieldCollections.children.mapping.fields.length).toBeGreaterThanOrEqual(4);
  expect(migrateFieldCollectionData(draft.data)).toEqual([]);
});
