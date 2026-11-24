import type { PageId } from '../types';
import samples from '../../requirements/global/prototype-fixtures/application-scenarios.json';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { getActiveClientCoverages } from '../config/client/getActiveClientCoverages';
import { buildSelectedCoverageEntries, isQdDecisionResult } from '../utils/coverageDecisions';
import type { CoverageDefinition } from './coverage';

/** Explicit global prototype simulation, recorded on completing QD. Receipt
 * continues to treat genuinely absent or invalid results as technical failures. */
export function completePrototypeQdOutcomes(values: ApplicationFormValues, products?: CoverageDefinition[], completedPage?: PageId): ApplicationFormValues {
  if (completedPage !== undefined && !completedPage.startsWith('health-')) return values;
  const result = samples.quickDecisionDefaultResult;
  if (!isQdDecisionResult(result)) throw new Error('Invalid global prototype QD result');
  const existing = values.qdDecisions;
  if (existing !== undefined && (!existing || typeof existing !== 'object' || Array.isArray(existing))) return values;
  const decisions = { ...existing as Record<string, string> | undefined };
  for (const entry of buildSelectedCoverageEntries(values, products ?? getActiveClientCoverages())) {
    const key = `${entry.coverageId}:${entry.applicant}`;
    if (entry.underwriting.status === 'resolved' && entry.underwriting.underwritingType === 'QD' && (completedPage === undefined || entry.underwriting.healthPage === completedPage) && !Object.hasOwn(decisions, key)) decisions[key] = result;
  }
  return { ...values, qdDecisions: decisions };
}
