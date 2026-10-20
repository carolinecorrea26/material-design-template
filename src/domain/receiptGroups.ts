import type { SelectedCoverageEntry } from '../utils/coverageDecisions';
import { reconcileApplicationRiders } from './applicationRiders';
/** Independent applicants keep individual decisions; attached benefits inherit the owner's. */
export function groupReceiptDecisions(entries: SelectedCoverageEntry[], values: Record<string, unknown>) {
  const groups = [...new Set(entries.map(e => e.coverageId))].map(id => ({ coverage: entries.find(e => e.coverageId === id)!.coverage, entries: entries.filter(e => e.coverageId === id) }));
  const elections = reconcileApplicationRiders(groups.map(g => g.coverage), values);
  return groups.map(group => ({ ...group, attachedBenefits: group.entries.flatMap(entry => (group.coverage.riders ?? []).filter(r => elections.coverageRiders[`${entry.coverageId}:${r.id}:${entry.applicant}`]).map(rider => ({ rider, owner: entry.applicant, applicant: rider.dependentApplicant ?? entry.applicant, amount: elections.coverageRiderAmounts[`${entry.coverageId}:${rider.id}:${entry.applicant}`] }))) }));
}
