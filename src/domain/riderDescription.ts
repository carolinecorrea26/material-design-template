import type { CoverageApplicantId, RiderDefinition } from './coverage';

/** Applicant election controls use authored scoped copy; overviews retain generic copy. */
export function riderDescription(rider: Pick<RiderDefinition, 'description' | 'applicantDescriptions' | 'dependentApplicant'>, applicant: CoverageApplicantId): string {
  return rider.applicantDescriptions?.[rider.dependentApplicant ?? applicant] ?? rider.description;
}
