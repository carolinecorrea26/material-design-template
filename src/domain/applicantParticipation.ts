import type { CoverageApplicantId, CoverageDefinition } from './coverage';
import type { EffectiveSite } from './effectiveSite';

/** Current elections only. Retained maps never select a removed product/person.
 * Missing per-product maps preserve the established initial member/dependent defaults;
 * an explicit empty map is an intentional empty election.
 */
export function selectedProductApplicants(values: Record<string, unknown>, product: Pick<CoverageDefinition, 'id' | 'applicants'>): CoverageApplicantId[] {
  if (!Array.isArray(values.coverageSelections) || !values.coverageSelections.includes(product.id)) return [];
  const dependents = Array.isArray(values.dependents) ? values.dependents : [];
  const maps = values.productApplicants && typeof values.productApplicants === 'object' && !Array.isArray(values.productApplicants)
    ? values.productApplicants as Record<string, unknown> : {};
  const explicit = Object.hasOwn(maps, product.id);
  const selected = Array.isArray(maps[product.id]) ? maps[product.id] as unknown[] : [];
  return product.applicants.filter(applicant => (applicant === 'member' || dependents.includes(applicant)) && (!explicit || selected.includes(applicant)));
}

/** Derived elections only; retained draft answers never become active people. */
export function selectedApplicationApplicants(values: Record<string, unknown>, products: Pick<CoverageDefinition, 'id' | 'applicants'>[]): Record<string, CoverageApplicantId[]> {
  return Object.fromEntries(products.filter(product => Array.isArray(values.coverageSelections) && values.coverageSelections.includes(product.id))
    .map(product => [product.id, selectedProductApplicants(values, product)]));
}

/** The same election projection for pure policy consumers of an effective Site. */
export function selectedSiteApplicants(site: EffectiveSite, values: Record<string, unknown>) {
  return selectedApplicationApplicants(values, site.products.map(product => ({ id: product.productKey,
    applicants: product.applicants.filter(applicant => site.configuration.products.find(row => row.productKey === product.productKey)?.applicantRules.some(rule => rule.value.applicantTypeKey === applicant.applicantKey && rule.value.eligible && rule.value.conditionKey === null))
      .map(applicant => applicant.applicantKey as CoverageApplicantId),
  })));
}
