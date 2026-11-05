import { resolveSharedFieldDefinition } from "./fieldDefinitionOwnership";
import type { EffectiveSiteData } from './effectiveSite';
import type { resolveEffectiveSite } from './effectiveSite';
import type { FieldDefinition } from './fields';

export type FieldCollectionDefinition = {
  pageKey: string; sectionId: string; storageName: string; label: string; maxItems: number;
  libraryGroup?: { label: string; applicant?: "self" | "spouse"; afterFieldKey?: string };
  fields: { fieldKey: string; valueKey: string; grid?: boolean; childConstraint?: 'unmarried' | 'studentMaximumAgeYears' }[];
};
export type ResolvedFieldCollection = { name: string; label: string; maxItems: number; pageKey: string; sectionId: string;
  libraryGroup?: FieldCollectionDefinition['libraryGroup'];
  mapping: { fields: FieldDefinition[]; fieldToKey: Record<string, string>; gridFields: string[] } };
const safeKey = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9]*$/.test(value) && !['constructor', 'prototype', '__proto__'].includes(value);

/** Saved configuration owns collection membership, order, bindings and layout.
 * Field values use the same global/Client/Site precedence as ordinary inputs. */
export function resolveStoredFieldCollections(data: EffectiveSiteData, site: ReturnType<typeof resolveEffectiveSite>) {
  const values = site.configuration.configurations.filter(row => data.configurationDefinitions.find(def => def.key === row.key)?.definition.path?.join('.') === 'fieldCollections');
  if (values.length !== 1 || !values[0].value || typeof values[0].value !== 'object' || Array.isArray(values[0].value)) throw new Error('Missing or ambiguous stored field collection configuration');
  const definitions = values[0].value as unknown as Record<string, FieldCollectionDefinition>;
  for (const key of ['children', 'selfDisabilityCompanies', 'spouseDisabilityCompanies']) if (!Object.hasOwn(definitions, key)) throw new Error(`Missing stored field collection: ${key}`);
  const result: Record<string, ResolvedFieldCollection> = {};
  for (const [key, definition] of Object.entries(definitions)) {
    if (!safeKey(key) || !definition || !safeKey(definition.storageName) || typeof definition.label !== 'string' || !definition.label.trim() || !Number.isSafeInteger(definition.maxItems) || definition.maxItems < 1 || definition.maxItems > 100 || !Array.isArray(definition.fields) || !definition.fields.length) throw new Error(`Invalid stored collection: ${key}`);
    const group = definition.libraryGroup;
    if (group && (typeof group.label !== 'string' || !group.label.trim() || group.applicant !== undefined && !['self', 'spouse'].includes(group.applicant)
      || group.afterFieldKey !== undefined && !data.fields.some(field => field.key === group.afterFieldKey))) throw new Error(`Invalid collection Library group: ${key}`);
    const page = site.configuration.pages.find(page => page.key === definition.pageKey);
    const storedSection = !page ? data.pageSections.find(section => section.pageKey === definition.pageKey && section.definition.id === definition.sectionId) : undefined;
    const section = page?.sections.find(section => section.definition.value.id === definition.sectionId) ?? (storedSection ? { definition: { value: storedSection.definition }, fields: data.pageSectionFields.filter(field => field.sectionKey === storedSection.key).sort((a, b) => a.position - b.position).map(field => ({ value: field })) } : undefined);
    if (!data.pages.some(page => page.key === definition.pageKey) || !section) throw new Error(`Missing collection section: ${key}`);
    const fields: FieldDefinition[] = [], fieldToKey: Record<string, string> = {}, gridFields: string[] = [];
    const fieldKeys = new Set<string>(), valueKeys = new Set<string>();
    for (const binding of definition.fields) {
      if (!binding || typeof binding.fieldKey !== 'string' || !safeKey(binding.valueKey) || fieldKeys.has(binding.fieldKey) || valueKeys.has(binding.valueKey) || binding.grid !== undefined && typeof binding.grid !== 'boolean' || binding.childConstraint !== undefined && !['unmarried', 'studentMaximumAgeYears'].includes(binding.childConstraint)) throw new Error(`Invalid collection binding: ${key}`);
      fieldKeys.add(binding.fieldKey); valueKeys.add(binding.valueKey);
      const saved = data.fields.find(field => field.key === binding.fieldKey);
      if (!saved || saved.definition.id !== binding.fieldKey) throw new Error(`Missing collection field: ${binding.fieldKey}`);
      // Children also own relational section placements. Removal there removes
      // the repeated input, even if an old binding remains in configuration.
      if (section.definition.value.collectionName && !section.fields.some(field => field.value.fieldKey === binding.fieldKey)) continue;
      if (binding.childConstraint && !data.eligibilityConstraints.some(rule => rule.siteKey === site.siteKey && rule.applicantTypeKey === 'child' && (binding.childConstraint === 'unmarried' ? rule.unmarried === true : rule.studentMaximumAgeYears !== null))) continue;
      let field = resolveSharedFieldDefinition(saved, data.validationRules, site.configuration.fieldDefinitionOwnership).definition;
      let included = true;
      const rank = { global: 0, client: 1, site: 2 };
      const overrides = data.siteFieldConfigurations.filter(row => row.pageKey === definition.pageKey && row.fieldKey === binding.fieldKey && (row.scope === 'global' || row.scope === 'client' && row.clientKey === site.clientKey || row.scope === 'site' && row.siteKey === site.siteKey)).sort((a, b) => rank[a.scope] - rank[b.scope] || a.position - b.position);
      const written = new Set<string>();
      for (const row of overrides) {
        for (const property of [...Object.keys(row.values), ...(row.hidden !== null ? ['hidden'] : []), ...(row.include !== null ? ['include'] : [])]) {
          const identity = `${row.scope}:${property}`;
          if (written.has(identity)) throw new Error(`Ambiguous collection field override: ${key}/${binding.fieldKey}`);
          written.add(identity);
        }
        field = { ...field, ...row.values }; included = row.hidden !== null ? !row.hidden : row.include ?? included;
      }
      if (!included) continue;
      fields.push(field); fieldToKey[field.id] = binding.valueKey;
      if (binding.grid) gridFields.push(field.id);
    }
    if (section.definition.value.collectionName) fields.sort((a, b) => section.fields.findIndex(field => field.value.fieldKey === a.id) - section.fields.findIndex(field => field.value.fieldKey === b.id));
    result[key] = { name: definition.storageName, label: definition.label, maxItems: definition.maxItems, pageKey: definition.pageKey, sectionId: definition.sectionId, libraryGroup: definition.libraryGroup, mapping: { fields, fieldToKey, gridFields } };
  }
  return result;
}
