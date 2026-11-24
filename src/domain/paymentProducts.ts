import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import type { CoverageDefinition, CoverageCategoryId } from '../config/coverages/types';
import { buildSelectedCoverageEntries, getCoverageAmountRequested } from '../utils/coverageDecisions';
export type AppliedPaymentProduct = { coverageId: string; categoryId: CoverageCategoryId; coverageName: string; quickDecision: boolean; applicants: Array<{ key: string; applicant: string; amount: number }> };

/** Use current product/applicant elections and shared configured order; stale amounts do not apply. */
export function paymentProducts(values: ApplicationFormValues, coverages: CoverageDefinition[]): AppliedPaymentProduct[] {
  const rank = new Map(coverages.map((coverage, index) => [coverage.id, index]));
  const grouped = new Map<string, AppliedPaymentProduct>();
  for (const entry of buildSelectedCoverageEntries(values as ApplicationFormValues, coverages)) {
    const amount = getCoverageAmountRequested(values as ApplicationFormValues, entry.coverageId, entry.applicant);
    if (!amount) continue;
    const applicant = { key: `${entry.coverageId}:${entry.applicant}`, applicant: entry.applicant, amount };
    const product = grouped.get(entry.coverageId);
    if (product) {
      product.applicants.push(applicant);
      product.quickDecision ||= entry.underwriting.underwritingType === 'QD';
    } else {
      grouped.set(entry.coverageId, { coverageId: entry.coverageId, categoryId: entry.coverage.categoryId,
        coverageName: entry.coverage.name, quickDecision: entry.underwriting.underwritingType === 'QD', applicants: [applicant] });
    }
  }
  return [...grouped.values()].sort((a, b) => rank.get(a.coverageId)! - rank.get(b.coverageId)!);
}

