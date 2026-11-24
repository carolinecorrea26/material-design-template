import { requirementText } from "./requirementContent";
import type { ResolvedFieldSurface } from './fieldSurfaces';
import { fieldValidationChecks } from '../utils/fieldValidation';
import { requirementValidationMessage } from './requirementValidations';

/** Next requires a primary beneficiary and complete individual allocations; draft edits may remain incomplete. */
export function validateBeneficiaryRecords(rows: unknown[], individual: ResolvedFieldSurface, trust: ResolvedFieldSurface, stage: 'draft' | 'next' = 'draft'): string | undefined {
  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return requirementText("beneficiary.error.record");
    const item = row as Record<string, unknown>;
    if (!['individual', 'trust'].includes(String(item.beneficiaryType)) || !['primary', 'contingent'].includes(String(item.designation))) return requirementText("beneficiary.error.record-type");
    const surface = item.beneficiaryType === 'trust' ? trust : individual;
    for (const field of surface.mapping.fields) {
      const value = item[surface.mapping.fieldToKey[field.id]];
      const invalid = fieldValidationChecks(field).find(check => !check.validate(value));
      if (invalid) return invalid.message;
      if (field.options && value && !field.options.some(option => option.value === value)) return requirementText("beneficiary.error.available-option", { label: field.label });
    }
    records.push(item);
  }
  if (stage === 'next' && !records.some(item => item.designation === 'primary')) return requirementText('beneficiary.error.primary-required');
  for (const designation of ['primary', 'contingent']) {
    const group = records.filter(item => item.designation === designation);
    const maxItems = group.some(item => item.beneficiaryType === "individual") ? individual.maxItems! : trust.maxItems!;
    if (group.length > maxItems) return requirementText("beneficiary.error.maximum", { maximum: String(maxItems), designation: requirementText(`beneficiary.designation.${designation}`) });
    const trusts = group.filter(item => item.beneficiaryType === 'trust');
    if (trusts.length > 1 || trusts.length && group.length > 1) return requirementText("beneficiary.error.mixed-types", { designation: requirementText(`beneficiary.designation.${designation}`) });
    const allocations = group.filter(item => item.beneficiaryType === 'individual').map(item => item[individual.mapping.fieldToKey['beneficiary-share']]);
    if (allocations.some(value => !/^\d{1,3}$/.test(String(value)))) return requirementValidationMessage('field-percent');
    const shares = allocations.map(Number);
    const total = shares.reduce((sum, share) => sum + share, 0);
    if (shares.some(share => !Number.isFinite(share) || share <= 0) || total > 100) return requirementText("beneficiary.error.shares", { designation: requirementText(`beneficiary.designation.${designation}`) });
    if (stage === 'next' && shares.length > 0 && total !== 100) return requirementText("beneficiary.error.allocation-total", { designation: requirementText(`beneficiary.designation.${designation}`) });
  }
}
