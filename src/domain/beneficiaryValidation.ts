import type { ResolvedFieldSurface } from './fieldSurfaces';
import { fieldValidationChecks } from '../utils/fieldValidation';

/** Validate saved/restored records against the same fields used by the modal. */
export function validateBeneficiaryRecords(rows: unknown[], individual: ResolvedFieldSurface, trust: ResolvedFieldSurface): string | undefined {
  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return 'Update beneficiary information.';
    const item = row as Record<string, unknown>;
    if (!['individual', 'trust'].includes(String(item.beneficiaryType)) || !['primary', 'contingent'].includes(String(item.designation))) return 'Update beneficiary type and designation.';
    const surface = item.beneficiaryType === 'trust' ? trust : individual;
    for (const field of surface.mapping.fields) {
      const value = item[surface.mapping.fieldToKey[field.id]];
      const invalid = fieldValidationChecks(field).find(check => !check.validate(value));
      if (invalid) return invalid.message;
      if (field.options && value && !field.options.some(option => option.value === value)) return `Choose an available ${field.label}.`;
    }
    records.push(item);
  }
  for (const designation of ['primary', 'contingent']) {
    const group = records.filter(item => item.designation === designation);
    const maxItems = group.some(item => item.beneficiaryType === "individual") ? individual.maxItems! : trust.maxItems!;
    if (group.length > maxItems) return `Use at most ${maxItems} ${designation} beneficiaries.`;
    const trusts = group.filter(item => item.beneficiaryType === 'trust');
    if (trusts.length > 1 || trusts.length && group.length > 1) return `Use individuals or one trust for ${designation} beneficiaries.`;
    const shares = group.filter(item => item.beneficiaryType === 'individual').map(item => Number(item[individual.mapping.fieldToKey['beneficiary-share']]));
    if (shares.some(share => !Number.isFinite(share) || share <= 0) || shares.reduce((sum, share) => sum + share, 0) > 100) return `Enter valid shares totaling at most 100% for ${designation} beneficiaries.`;
  }
}
