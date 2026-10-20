import type { DatabaseSchema } from '../persistence/types';
import { libraryMetadata } from '../domain/provenance';
import { isBenefitPolicy } from '../domain/benefitPolicy';
import type { FieldDefinition } from '../domain/fields';
/** Persist collection points for the reviewed benefit operands. */
export function addPrototypeCutoverFields(db: DatabaseSchema) {
  for (const config of db.configurationValues) {
    const target = db.configurationDefinitions.find(d => d.key === config.configurationKey)?.definition.target;
    if (!target || !('productKey' in target) || !config.siteKey || !config.value || typeof config.value !== 'object' || Array.isArray(config.value)) continue;
    const operand = target.kind === 'product-residency-policy' && config.value.excludeActiveMilitary ? 'activeMilitary' : target.kind === 'product-rate-input-policy' && (config.value.dimensions as Record<string, string> | undefined)?.membership === 'required' ? 'membership' : null;
    if (!operand) continue;
    const membershipMapping = db.configurationValues.find(value => value.siteKey === config.siteKey && db.configurationDefinitions.find(definition => definition.key === value.configurationKey)?.definition.path?.join('.') === `applicantExperience.factMappings.${operand}.field`);
    if (typeof membershipMapping?.value === 'string' && db.siteFieldConfigurations.some(row => row.siteKey === config.siteKey && row.pageKey === 'membership' && row.fieldKey === membershipMapping.value && row.include === true && row.hidden !== true)) continue;
    const fieldKey = `prototype-fact:${target.productKey}:member:${operand}`, key = `${config.siteKey}.${fieldKey}`;
    const definition: FieldDefinition = { id: fieldKey, label: operand === 'activeMilitary' ? 'Are you on active military duty?' : 'Are you a member of the association?', inputType: 'radio', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] };
    if (!db.fields.some(f => f.key === fieldKey)) db.fields.push({ id: fieldKey, key: fieldKey, position: 0, definition, ...libraryMetadata('fields', fieldKey, 'prototype-cutover:reviewed-operands') });
    if (!db.siteFieldConfigurations.some(f => f.key === key)) db.siteFieldConfigurations.push({ id: key, key, position: 40000 + db.siteFieldConfigurations.length, scope: 'site', siteKey: config.siteKey, clientKey: null, pageKey: 'coverage', fieldKey, include: true, hidden: false, values: {}, ...libraryMetadata('siteFieldConfigurations', key, 'prototype-cutover:reviewed-operands') });
  }

  for (const config of db.configurationValues) {
    const target = db.configurationDefinitions.find(d => d.key === config.configurationKey)?.definition.target;
    if (target?.kind !== 'product-benefit-policy' || !config.siteKey || !isBenefitPolicy(config.value)) continue;
    for (const rule of config.value.applicants) {
      const fields: Array<[string, string, 'number' | 'radio' | 'dropdown']> = [];
      if (rule.income?.subtractExisting || config.value.aggregate) fields.push(['existingMonthlyBenefit', 'Existing monthly benefit for this product (enter 0 if none)', 'number']);
      if (rule.retirement) fields.push(['retirement', 'Applying for retirement benefits?', 'radio']);
      if (rule.loanPaymentCap) fields.push(['monthlyLoanPayment', 'Monthly loan payment', 'number']);
      if (rule.expenseCap) fields.push(['eligibleExpenseFraction', 'Eligible business expense fraction (0–1)', 'number']);
      if (rule.applicantClass) fields.push(['applicantClass', 'Applicant class', 'dropdown']);
      for (const [name, label, inputType] of fields) {
        const fieldKey = `prototype-fact:${target.productKey}:${rule.applicantKey}:${name}`;
        const key = `${config.siteKey}.${fieldKey}`;
        if (db.siteFieldConfigurations.some(f => f.key === key)) continue;
        const definition: FieldDefinition = { id: fieldKey, label, inputType, required: true, ...(inputType === 'radio' ? { options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] } : inputType === 'dropdown' ? { options: config.value.applicants.filter(r => r.applicantKey === rule.applicantKey && r.applicantClass).map(r => ({ value: r.applicantClass!, label: r.applicantClass! })) } : {}) };
        if (name === 'eligibleExpenseFraction') { definition.allowDecimal = true; definition.inputMode = 'decimal'; }
        if (!db.fields.some(f => f.key === fieldKey)) db.fields.push({ id: fieldKey, key: fieldKey, position: 0, definition, ...libraryMetadata('fields', fieldKey, 'prototype-cutover:reviewed-benefit-operands') });
        db.siteFieldConfigurations.push({ id: key, key, position: 40000 + db.siteFieldConfigurations.length, scope: 'site', siteKey: config.siteKey, clientKey: null, pageKey: 'coverage', fieldKey, include: true, hidden: false, values: {}, ...libraryMetadata('siteFieldConfigurations', key, 'prototype-cutover:reviewed-benefit-operands') });
      }
    }
  }  for (const config of db.configurationValues) {
    const path = db.configurationDefinitions.find(d => d.key === config.configurationKey)?.definition.path;
    if (!config.siteKey || path?.join('.') !== 'applicantExperience' || !config.value || typeof config.value !== 'object' || Array.isArray(config.value)) continue;
    const mappings = config.value.factMappings;
    if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings)) continue;
    for (const row of db.siteFieldConfigurations) if (row.siteKey === config.siteKey && row.fieldKey.startsWith('prototype-fact:') && row.fieldKey.split(':').at(-1)! in mappings) row.hidden = true;
  }

}
