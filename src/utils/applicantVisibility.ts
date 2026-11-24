import type { ApplicantSectionId } from '../config/formSectionTitle';
import type { CoverageApplicantId, CoverageDefinition } from '../config/coverages/types';
import { getActiveClientCoverages } from '../config/client/getActiveClientCoverages';
import { selectedProductApplicants } from '../domain/applicantParticipation';
import { reconcileApplicationRiders } from '../domain/applicationRiders';

export type FormValuesLike = Record<string, unknown>;
export type ApplicantLike = ApplicantSectionId | 'member';

/** Heading context is application-wide; section applicability is evaluated separately. */
export function applyingApplicants(values: FormValuesLike, products: CoverageDefinition[] = getActiveClientCoverages()): CoverageApplicantId[] {
  const applicants = new Set<CoverageApplicantId>();
  const riders = reconcileApplicationRiders(products, values).coverageRiders;
  for (const product of products) for (const owner of selectedProductApplicants(values, product)) {
    applicants.add(owner);
    for (const rider of product.riders ?? []) if (rider.dependentApplicant && riders[`${product.id}:${rider.id}:${owner}`]) applicants.add(rider.dependentApplicant);
  }
  return [...applicants];
}

export function hasDependentsSelected(values: FormValuesLike, products?: CoverageDefinition[]): boolean {
  return applyingApplicants(values, products).some(applicant => applicant !== 'member');
}

export function isApplicantApplying(applicant: ApplicantLike, values: FormValuesLike, products?: CoverageDefinition[]): boolean {
  return applyingApplicants(values, products).includes(applicant === 'self' ? 'member' : applicant);
}

export function shouldShowApplicantLabel(applicant: ApplicantLike, values: FormValuesLike, products?: CoverageDefinition[]): boolean {
  return applicant === 'self' || applicant === 'member' ? hasDependentsSelected(values, products) : isApplicantApplying(applicant, values, products);
}

/** Coverage questions precede product election and use eligible applicant intent. */
export function hasProspectiveDependents(values: FormValuesLike, products: CoverageDefinition[]): boolean {
  const dependents = Array.isArray(values.dependents) ? values.dependents : [];
  return products.some(product => product.applicants.some(applicant => applicant !== 'member' && dependents.includes(applicant)));
}
