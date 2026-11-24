import type { CoverageDefinition } from '../domain/coverage';
import { applyingApplicants } from './applicantVisibility';

export type ApplicantsApplyingValues = Record<string, unknown>;

/** Before product selection the member is the owner/default. Established elections
 * use the same participation projection as the forms and summaries.
 */
export function deriveApplicantsApplying(values: ApplicantsApplyingValues, products?: CoverageDefinition[]) {
  return Array.isArray(values.coverageSelections) && values.coverageSelections.length
    ? applyingApplicants(values, products) : ['member'] as const;
}
export const getApplicantsApplying = deriveApplicantsApplying;
export function withApplicantsApplying<T extends ApplicantsApplyingValues>(values: T) {
  return { ...values, applicantsApplying: deriveApplicantsApplying(values) };
}
