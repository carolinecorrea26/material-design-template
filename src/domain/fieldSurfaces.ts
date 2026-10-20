import { resolveSharedFieldDefinition } from "./fieldDefinitionOwnership";
import type { EffectiveSiteData, resolveEffectiveSite } from './effectiveSite';
import type { FieldDefinition } from './fields';
export type FieldSurfaceDefinition = {
  pageKey: string; label: string; maxItems?: number;
  fields: { fieldKey: string; valueKey: string; grid?: boolean }[];
};

export type ResolvedFieldSurface = Omit<FieldSurfaceDefinition, 'fields'> & {
  mapping: { fields: FieldDefinition[]; fieldToKey: Record<string, string>; gridFields: string[] };
};
const safeKey = (key: unknown): key is string => typeof key === 'string' && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(key) && !['constructor', 'prototype', '__proto__'].includes(key);
const requiredSurfaces = ['beneficiaryIndividual', 'beneficiaryTrust', 'beneficiaryControls', 'healthLiDetails', 'healthSiDetails', ...Array.from({ length: 7 }, (_, i) => `healthDiq${i + 1}Details`), 'needsCalculator', 'quoteInputs', 'paymentControls', 'paymentBank', 'verificationControls', 'verificationQuestions'];
export function resolveStoredFieldSurfaces(data: EffectiveSiteData, site: ReturnType<typeof resolveEffectiveSite>) {
  const rows = site.configuration.configurations.filter(row => data.configurationDefinitions.find(def => def.key === row.key)?.definition.path?.join('.') === 'fieldSurfaces');
  if (rows.length !== 1 || !rows[0].value || typeof rows[0].value !== 'object' || Array.isArray(rows[0].value)) throw new Error('Missing or ambiguous stored field surface configuration');
  const definitions = rows[0].value as unknown as Record<string, FieldSurfaceDefinition>;
  for (const key of requiredSurfaces) if (!Object.hasOwn(definitions, key)) throw new Error(`Missing stored field surface: ${key}`);
  const result: Record<string, ResolvedFieldSurface> = {};
  for (const [name, definition] of Object.entries(definitions)) {
    if (!safeKey(name) || !definition || !data.pages.some(page => page.key === definition.pageKey) || typeof definition.label !== 'string' || !definition.label.trim() || !Array.isArray(definition.fields) || !definition.fields.length || definition.maxItems !== undefined && (!Number.isSafeInteger(definition.maxItems) || definition.maxItems < 1 || definition.maxItems > 100)) throw new Error(`Invalid stored field surface: ${name}`);
    if ((name.startsWith('health') || name === 'beneficiaryIndividual' || name === 'beneficiaryTrust') && definition.maxItems === undefined) throw new Error(`Missing field surface limit: ${name}`);
    const fields: FieldDefinition[] = [], fieldToKey: Record<string, string> = {}, gridFields: string[] = [];
    const seenFields = new Set<string>(), seenBindings = new Set<string>();
    for (const binding of definition.fields) {
      if (!binding || !safeKey(binding.fieldKey) || !safeKey(binding.valueKey) || seenFields.has(binding.fieldKey) || seenBindings.has(binding.valueKey) || binding.grid !== undefined && typeof binding.grid !== 'boolean') throw new Error(`Invalid field surface binding: ${name}`);
      if (['quoteInputs', 'paymentControls', 'paymentBank', 'beneficiaryControls', 'verificationControls'].includes(name) && binding.valueKey !== binding.fieldKey) throw new Error(`Unsupported semantic control binding: ${name}/${binding.fieldKey}`);
      if ((name.startsWith('health') || ['beneficiaryIndividual', 'beneficiaryTrust'].includes(name)) && ['id', 'designation', 'beneficiaryType'].includes(binding.valueKey)) throw new Error(`Reserved field surface binding: ${name}`);
      seenFields.add(binding.fieldKey); seenBindings.add(binding.valueKey);
      const saved = data.fields.find(field => field.key === binding.fieldKey);
      if (!saved || saved.definition.id !== saved.key) throw new Error(`Missing surface field: ${binding.fieldKey}`);
      let field = resolveSharedFieldDefinition(saved, data.validationRules, site.configuration.fieldDefinitionOwnership).definition;
      let included = true;
      const rank = { global: 0, client: 1, site: 2 };
      const overrides = data.siteFieldConfigurations.filter(row => row.pageKey === definition.pageKey && row.fieldKey === saved.key && (row.scope === 'global' || row.scope === 'client' && row.clientKey === site.clientKey || row.scope === 'site' && row.siteKey === site.siteKey)).sort((a, b) => rank[a.scope] - rank[b.scope] || a.position - b.position);
      const written = new Set<string>();
      for (const row of overrides) {
        for (const property of [...Object.keys(row.values), ...(row.hidden !== null ? ['hidden'] : []), ...(row.include !== null ? ['include'] : [])]) {
          const identity = `${row.scope}:${property}`;
          if (written.has(identity)) throw new Error(`Ambiguous surface field override: ${name}/${saved.key}`);
          written.add(identity);
        }
        field = { ...field, ...row.values }; included = row.hidden !== null ? !row.hidden : row.include ?? included;
      }
      if (field.id !== saved.key) throw new Error(`Surface field identity changed: ${saved.key}`);
      const controlTypes: Record<string, string> = { 'quote-selection': 'checkbox', 'quote-amount': 'dropdown', 'quote-monthly-amount': 'dropdown', 'quote-categories': 'checkbox-group', 'quote-rate-frequency': 'radio', 'verification-method': 'radio', beneficiaryType: 'radio' };
      if (controlTypes[saved.key] && field.inputType !== controlTypes[saved.key]) throw new Error(`Unsupported surface control type: ${saved.key}`);
      if (typeof field.label !== 'string' || !field.label.trim() || !['text', 'number', 'date', 'radio', 'dropdown', 'searchable-select', 'checkbox', 'checkbox-group', 'multi-select', 'percent'].includes(field.inputType)) throw new Error(`Invalid surface field definition: ${saved.key}`);
      if (field.options && (!Array.isArray(field.options) || field.options.some(option => !option || typeof option.value !== 'string' || typeof option.label !== 'string') || new Set(field.options.map(option => option.value)).size !== field.options.length)) throw new Error(`Invalid surface options: ${saved.key}`);
      if (field.maxLength !== undefined && (!Number.isSafeInteger(field.maxLength) || field.maxLength < 1 || field.maxLength > 10000)) throw new Error(`Invalid surface field limit: ${saved.key}`);
      const allowedOptions: Record<string, string[]> = {
        'verification-method': ['text', 'voice', 'security-questions', 'skip'], beneficiaryType: ['individual', 'trust'],
        'payment-method': ['bill-me', 'bank-account', 'credit-card'], 'payment-shared-method': ['bill-me', 'bank-account', 'credit-card'],
        'payment-frequency': ['monthly', 'quarterly', 'semiannually', 'annually'], 'payment-shared-frequency': ['monthly', 'quarterly', 'semiannually', 'annually'],
      };
      if (allowedOptions[saved.key] && (!field.options?.length || field.options.some(option => !allowedOptions[saved.key].includes(option.value)))) throw new Error(`Unsupported surface options: ${saved.key}`);
      if (saved.key === 'quote-rate-frequency' && (!field.options || field.options.length !== 2 || !['monthly', 'annual'].every(value => field.options!.some(option => option.value === value)))) throw new Error('Invalid quote rate frequency options');
      if (!included) continue;
      fields.push(field); fieldToKey[field.id] = binding.valueKey;
      if (binding.grid) gridFields.push(field.id);
    }
    if (['beneficiaryControls', 'verificationControls'].includes(name) && !fields.some(field => field.id === (name === 'beneficiaryControls' ? 'beneficiaryType' : 'verification-method'))) throw new Error(`Missing semantic surface control: ${name}`);
    if (name === 'beneficiaryIndividual' && !fields.some(field => field.id === 'beneficiary-share')) throw new Error('Missing semantic surface control: beneficiary share');
    result[name] = { pageKey: definition.pageKey, label: definition.label, maxItems: definition.maxItems, mapping: { fields, fieldToKey, gridFields } };
  }
  return result;
}
