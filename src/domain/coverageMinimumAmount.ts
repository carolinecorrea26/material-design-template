import type { CoverageAssignment } from './requirementCoverageValidation.mjs';

/** Shared amount dimension. A positive verified matching-product amount comes
 * from the TPA boundary, never from an applicant's new/increase answer. */
export function coverageMinimumAmount(assignments: readonly CoverageAssignment[] | undefined, productKey: string, applicant: string, verifiedExistingAmount = 0): number | undefined {
  const value = (configuration: string) => assignments?.find(row => row.product === productKey && row.applicants.some(person => person === applicant) && row.configuration === configuration)?.value;
  const existingMinimum = value('coverage-verified-existing-minimum-amount');
  if (Number.isFinite(verifiedExistingAmount) && verifiedExistingAmount > 0 && typeof existingMinimum === 'number' && existingMinimum > 0) return existingMinimum;
  const newMinimum = value('coverage-new-application-minimum-amount');
  return typeof newMinimum === 'number' ? newMinimum : undefined;
}
