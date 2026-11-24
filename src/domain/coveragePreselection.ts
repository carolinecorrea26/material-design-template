import type { CoverageApplicantId, CoverageDefinition } from './coverage';
import { resolveApplicationCoverage } from './coverageRuntime';
import { requirementUrlValues } from './requirementUrlParameters';

export function coveragePreselectEnabled(values: Record<string, unknown>) {
  const scope = values.coverageEntryScope as Record<string, unknown> | undefined;
  return typeof scope?.preselect === 'string' && requirementUrlValues('preselect').includes(scope.preselect.trim().toUpperCase());
}

/** One initial election on the Coverage page. Subsequent edits and saved choices
 * remain authoritative. This action never adds optional rider elections. */
export function coveragePreselection(products: CoverageDefinition[], values: Record<string, unknown>) {
  if (!coveragePreselectEnabled(values) || values.coveragePreselectionApplied === true) return null;
  const dependents = Array.isArray(values.dependents) ? values.dependents : [];
  const applicants = { ...(values.productApplicants as Record<string, CoverageApplicantId[]> ?? {}) };
  const selected = new Set(Array.isArray(values.coverageSelections) ? values.coverageSelections.filter((id): id is string => typeof id === 'string') : []);
  for (const product of products) {
    const offered = product.applicants.filter(applicant => (applicant === 'member' || dependents.includes(applicant))
      && resolveApplicationCoverage(product, applicant, values, products).eligibility !== 'ineligible');
    if (!offered.length) continue;
    applicants[product.id] = [...new Set([...(applicants[product.id] ?? []), ...offered])];
    selected.add(product.id);
  }
  const amounts = { ...(values.coverageAmounts as Record<string, number> ?? {}) };
  const patch = { coverageSelections: [...selected], productApplicants: applicants, coverageAmounts: amounts, coveragePreselectionApplied: true };
  // Primary defaults are available before dependent caps are calculated. A second
  // pass handles a dependency whose primary product appears later in source order.
  for (let pass = 0; pass < 2; pass++) for (const product of products) for (const applicant of ['member', 'spouse', 'child'] as const) {
    if (!applicants[product.id]?.includes(applicant)) continue;
    const key = `${product.id}:${applicant}`;
    const control = resolveApplicationCoverage(product, applicant, { ...values, ...patch }, products).amountControl;
    if (control.defaultAmount !== undefined && (amounts[key] == null || control.locked)) amounts[key] = control.defaultAmount;
  }
  return patch;
}
