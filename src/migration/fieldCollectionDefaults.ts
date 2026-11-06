import { requirementAnswerKey } from '../domain/requirementFields';
import { migrateFieldSurfaceData } from './fieldSurfaceDefaults';
import { childMapping } from '../config/fields/eligibilityListFields';
import { disabilityCompanyMapping } from '../config/fields/profileListFields';
import type { EffectiveSiteData } from '../domain/effectiveSite';
import type { FieldCollectionDefinition } from '../domain/fieldCollections';
import type { Json } from '../persistence/types';
import { libraryMetadata } from '../domain/provenance';

/** Authored defaults enter stored data only through export or explicit upgrade. */
export function migrateFieldCollectionData(data: EffectiveSiteData) {
  const changes: string[] = migrateFieldSurfaceData(data);
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, 'Stored field collection upgrade') });
  for (const field of disabilityCompanyMapping.fields) if (!data.fields.some(row => row.key === field.id)) {
    data.fields.push({ ...meta('fields', field.id), position: data.fields.length, definition: structuredClone(field) }); changes.push(`fields:${field.id}`);
  }
  const definitions: Record<string, FieldCollectionDefinition> = {
    children: { pageKey: 'eligibility', sectionId: 'childSection', storageName: 'children', label: 'Child', maxItems: 10,
      fields: [...childMapping.fields.map(field => ({ fieldKey: field.id, valueKey: childMapping.fieldToKey[field.id as keyof typeof childMapping.fieldToKey], grid: childMapping.gridFields.includes(field.id) })),
        { fieldKey: 'child-full-time-student', valueKey: requirementAnswerKey('full-time-student', 'child') }] },
  };
  for (const applicant of ['self', 'spouse'] as const) definitions[`${applicant}DisabilityCompanies`] = {
    pageKey: 'profile', sectionId: applicant === 'self' ? 'profileFinancialSelf' : 'profileFinancialSpouse', storageName: `${applicant}DisabilityCompanies`, label: 'Company', maxItems: 10,
    fields: disabilityCompanyMapping.fields.map(field => ({ fieldKey: field.id, valueKey: disabilityCompanyMapping.fieldToKey[field.id as keyof typeof disabilityCompanyMapping.fieldToKey] })),
  };
  const key = 'field-collections';
  const existing = data.configurationDefinitions.filter(row => row.definition.path?.join('.') === 'fieldCollections');
  if (existing.length) return changes;
  data.configurationDefinitions.push({ ...meta('configurationDefinitions', key), position: data.configurationDefinitions.length, definition: { path: ['fieldCollections'], metadata: null } });
  data.configurationValues.push({ ...meta('configurationValues', `global.${key}`), position: 0, configurationKey: key, scope: 'global', clientKey: null, siteKey: null, value: definitions as unknown as Json });
  changes.push(`configurationDefinitions:${key}`, `configurationValues:global.${key}`);
  return changes;
}
