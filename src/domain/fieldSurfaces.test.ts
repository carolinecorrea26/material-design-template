import { migratePageCatalogSnapshot } from './pageCatalogMigration';
import { effectiveSiteSnapshotTables } from '../repositories/portalDataRepository';
import type { LibraryDraft } from './libraryDraft';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { migrateFieldSurfaceData, type FieldSurfaceDefinition } from '../migration/fieldSurfaceDefaults';
import { getFieldSurface, getSurfaceFields, paymentControlField, surfaceSemanticValues } from '../config/fields/storedSurfaces';
import { validateHealthFollowUps } from './healthQuestionnaire';
import { libraryMetadata } from './provenance';
import { freshStartSource } from './freshStartCatalog';
import type { FieldDefinition } from './fields';
import type { DatabaseSchema } from '../persistence/types';

let baseline: DatabaseSchema;
beforeAll(() => { baseline = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const policies = (data: DatabaseSchema) => data.configurationValues.find(row => row.configurationKey === 'field-surfaces')!.value as unknown as Record<string, FieldSurfaceDefinition>;

it('uses saved definitions, bindings, order and limits across all converted surfaces with Site isolation', () => {
  const data = structuredClone(baseline);
  const source = structuredClone(freshStartSource());
  const definitions = Object.fromEntries(Object.values(source.pages).flatMap(page => Object.entries(page.surfaces ?? {}).map(([name, surface]) => [name, surface.definition!])));
  definitions.beneficiaryIndividual.fields.reverse();
  definitions.beneficiaryIndividual.maxItems = 3;
  definitions.healthSiDetails.fields[1].valueKey = 'medicalHistory';
  definitions.healthSiDetails.maxItems = 1;
  definitions.needsCalculator.fields[0].valueKey = 'householdIncome';
  definitions.needsCalculator.fields.reverse();
  (source.fields.sites.asce as { fields: Record<string, unknown> }).fields['first-name'] = { label: { beneficiary: 'Saved given name' } };
  const asce = resolvePrototypeLibrary(data, 'asce', 'test', source);
  installPrototypeLibrary(asce);
  expect(getSurfaceFields('beneficiaryIndividual').map(field => field.id)).toEqual(['share', 'relationship', 'lastName', 'firstName']);
  expect(getSurfaceFields('beneficiaryIndividual')[3].label).toBe('Saved given name');
  expect(getFieldSurface('beneficiaryIndividual').maxItems).toBe(3);
  expect(getSurfaceFields('needsCalculator').at(-1)?.id).toBe('householdIncome');
  expect(surfaceSemanticValues('healthSiDetails', { medicalHistory: 'Stored history' }).conditionsDetails).toBe('Stored history');
  const ama = resolvePrototypeLibrary(data, 'ama', 'test', source);
  expect(ama.fieldSurfaces.beneficiaryIndividual.mapping.fields.at(-1)?.label).toBe('First Name');
});

it('narrows stored payment choices to product policy while retaining authored labels and order', () => {
  const data = structuredClone(baseline);
  const source = structuredClone(freshStartSource());
  (source.fields.fieldDetails as { fields: FieldDefinition[] }).fields.find(field => field.id === 'payment-method')!.options = [{ value: 'bank-account', label: 'Saved EFT' }, { value: 'credit-card', label: 'Saved card' }];
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test', source));
  expect(paymentControlField('payment-method', 'payment-method:li-term', [{ value: 'bank-account', label: 'Bank' }, { value: 'bill-me', label: 'Bill' }])).toMatchObject({ id: 'payment-method:li-term', options: [{ value: 'bank-account', label: 'Saved EFT' }] });
});

it('enforces stored health requirements and limits on restored records with custom bindings', () => {
  const data = structuredClone(baseline);
  const source = structuredClone(freshStartSource());
  source.pages['health-si'].surfaces!.healthSiDetails.definition!.fields[1].valueKey = 'history';
  source.pages['health-si'].surfaces!.healthSiDetails.definition!.maxItems = 1;
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test', source));
  const surface = getFieldSurface('healthSiDetails');
  const question = { answer: { id: 'answer', label: 'Health', required: true }, collection: 'details', ...surface.mapping, maxItems: surface.maxItems };
  const record = { onset: '01/2020', history: 'Medication', physicianAddress: 'Physician' };
  expect(validateHealthFollowUps([question], { answer: 'yes', details: [record] })).toBeUndefined();
  expect(validateHealthFollowUps([question], { answer: 'yes', details: [record, record] })).toContain('at most 1');
  expect(validateHealthFollowUps([question], { answer: 'yes', details: [{ ...record, history: '' }] })).toContain('required');
});

it('fails closed for missing, unsafe, conflicting and unexecutable surface definitions', () => {
  const absent = structuredClone(freshStartSource());
  delete absent.pages['health-si'].surfaces!.healthSiDetails;
  expect(() => resolvePrototypeLibrary(baseline, 'asce', 'test', absent)).toThrow();
  for (const valueKey of ['__proto__', 'constructor', 'onset']) {
    const invalid = structuredClone(freshStartSource());
    invalid.pages['health-si'].surfaces!.healthSiDetails.definition!.fields[1].valueKey = valueKey;
    expect(() => resolvePrototypeLibrary(baseline, 'asce', 'test', invalid)).toThrow();
  }
  const invalid = structuredClone(freshStartSource());
  (invalid.fields.fieldDetails as { fields: FieldDefinition[] }).fields.find(field => field.id === 'verification-method')!.options = [{ value: 'unknown', label: 'Unknown' }];
  expect(() => resolvePrototypeLibrary(baseline, 'asce', 'test', invalid)).toThrow('Unsupported surface options');
  const conflict = structuredClone(freshStartSource());
  conflict.pages['health-si'].surfaces!.healthSiDetails.definition!.fields.push(structuredClone(conflict.pages['health-si'].surfaces!.healthSiDetails.definition!.fields[0]));
  expect(() => resolvePrototypeLibrary(baseline, 'asce', 'test', conflict)).toThrow();
});

it('converts a first-batch snapshot into a detached draft and preserves its original', () => {
  const data = structuredClone(baseline);
  data.configurationDefinitions = data.configurationDefinitions.filter(row => row.key !== 'field-surfaces');
  data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== 'field-surfaces');
  data.fields = data.fields.filter(row => !row.key.startsWith('health-si-detail-'));
  const original = { formatVersion: 1, siteKey: 'asce', editVersion: 1, baseRevision: `local:v1:sha256:${'a'.repeat(64)}`, mockTransport: { id: 'old', version: 1, baseReleaseId: null }, data: Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, data[table]])) } as unknown as LibraryDraft;
  const before = structuredClone(original);
  const { draft, changes } = migratePageCatalogSnapshot(original);
  expect(original).toEqual(before);
  expect(draft.mockTransport).toBeUndefined();
  expect(changes.some(change => change.key === 'field-surfaces')).toBe(true);
  expect(resolvePrototypeLibrary(draft.data, draft.siteKey, 'converted').fieldSurfaces.healthSiDetails.maxItems).toBe(10);
  expect(migrateFieldSurfaceData(draft.data)).toEqual([]);
});

it('preserves authored metadata during repeated upgrades', () => {
  const data = structuredClone(baseline);
  policies(data).healthSiDetails.maxItems = 2;
  data.fields.find(row => row.key === 'sq-1')!.definition.label = 'Authored question';
  expect(migrateFieldSurfaceData(data)).toEqual([]);
  expect(policies(data).healthSiDetails.maxItems).toBe(2);
  expect(data.fields.find(row => row.key === 'sq-1')!.definition.label).toBe('Authored question');
});

it.skipIf(!process.env.FIELD_SURFACE_SQL)('exports an insert-only SQL upgrade from the same surface defaults', () => {
  const data = structuredClone(baseline);
  const surfaceKeys = new Set(Object.values(policies(data)).flatMap(surface => surface.fields.map(field => field.fieldKey)));
  const quote = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
  const lines = ['-- Stored beneficiary, health follow-up, calculator, payment and verification definitions.', '-- Authored rows are preserved. Apply to drafts through explicit snapshot conversion.'];
  for (const field of data.fields.filter(field => surfaceKeys.has(field.key))) lines.push(`insert into public.fields(id,key,position,definition,display_id,provided_by,source_reference) values (${quote(field.key)},${quote(field.key)},(select coalesce(max(position),-1)+1 from public.fields),${quote(JSON.stringify(field.definition))}::jsonb,${libraryMetadata('fields', field.key).displayId},null,'Stored field surface upgrade') on conflict(key) do nothing;`);
  const key = 'field-surfaces';
  lines.push(`insert into public.configuration_definitions(id,key,position,definition,display_id,provided_by,source_reference) select '${key}','${key}',(select coalesce(max(position),-1)+1 from public.configuration_definitions),'{"path":["fieldSurfaces"],"metadata":null}'::jsonb,${libraryMetadata('configurationDefinitions', key).displayId},null,'Stored field surface upgrade' where not exists(select 1 from public.configuration_definitions where definition->'path' = '["fieldSurfaces"]'::jsonb) on conflict(key) do nothing;`);
  lines.push(`insert into public.configuration_values(id,key,position,configuration_key,scope,client_key,site_key,value,display_id,provided_by,source_reference) select 'global.${key}','global.${key}',(select coalesce(max(position),-1)+1 from public.configuration_values),'${key}','global',null,null,${quote(JSON.stringify(policies(data)))}::jsonb,${libraryMetadata('configurationValues', `global.${key}`).displayId},null,'Stored field surface upgrade' where exists(select 1 from public.configuration_definitions where key = '${key}' and definition->'path' = '["fieldSurfaces"]'::jsonb) and not exists(select 1 from public.configuration_values where configuration_key = '${key}') on conflict(key) do nothing;`);
  writeFileSync(process.env.FIELD_SURFACE_SQL!, lines.join('\n\n') + '\n');
});
