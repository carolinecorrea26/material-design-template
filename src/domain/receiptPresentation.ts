import { getCoverageAmountRequested, getDecisionStatus, readQdDecisionResult, type SelectedCoverageEntry } from '../utils/coverageDecisions';
import type { ReceiptContent } from '../content/types';
import { reviewUnderwritingFlag, type ReviewPolicy } from './reviewPolicy';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';

export function receiptUnderwritingType(entry: SelectedCoverageEntry) {
  return entry.underwriting.status === 'resolved' ? entry.underwriting.underwritingType ?? 'UNRESOLVED' : 'UNRESOLVED';
}

/** Receipt and its email resolve the same explicit outcome and display tone. */
export function receiptDecisionPresentation(entry: SelectedCoverageEntry, values: ApplicationFormValues, content?: ReceiptContent) {
  const underwritingType = receiptUnderwritingType(entry);
  const decisionResult = readQdDecisionResult(values, entry.coverageId, entry.applicant);
  const requestedAmount = getCoverageAmountRequested(values, entry.coverageId, entry.applicant);
  const quickDecision = underwritingType === 'QD';
  const tone: 'success' | 'primary' | 'warning' = quickDecision
    ? decisionResult === 'conditionally-approved' ? 'success' : decisionResult === 'soft-declined' ? 'warning' : 'primary'
    : 'primary';
  return { requestedAmount, quickDecision, tone, status: getDecisionStatus({ underwritingType, decisionResult, content }) };
}

/** Medical next steps belong only to applicable coverage actually sent for review. */
export function receiptNeedsUnderwritingNote(entries: SelectedCoverageEntry[], values: ApplicationFormValues, policy: ReviewPolicy): boolean {
  return entries.some(entry => {
    if (!reviewUnderwritingFlag(policy, [{ productKey: entry.coverageId, category: entry.coverage.categoryId, applicants: [entry.applicant] }])) return false;
    const type = receiptUnderwritingType(entry);
    if (type === 'QD') {
      const result = readQdDecisionResult(values, entry.coverageId, entry.applicant);
      return result === 'referred' || result === 'database-unavailable';
    }
    return type === 'FUW' || type === 'SI' || type === 'TELE';
  });
}

/** Missing technical data cannot become an underwriting outcome. */
export function receiptHasTechnicalIssue(entries: SelectedCoverageEntry[], values: ApplicationFormValues): boolean {
  return entries.some(entry => receiptUnderwritingType(entry) === 'UNRESOLVED' || receiptUnderwritingType(entry) === 'QD' && !readQdDecisionResult(values, entry.coverageId, entry.applicant));
}
