import peopleConfiguration from '../../../requirements/global/configurations/people.json';
import type { CoverageApplicantId, CoverageDefinition } from '../../domain/coverage';
import { requirementUrlValues } from '../../domain/requirementUrlParameters';
import { coverageCategoryParameter } from './coverageCategoryScope';

/** URL entry context can narrow the effective offering, never expand it. */
export function resolveAvailableApplicants(people: readonly string[] = peopleConfiguration.configurations.find(row => row.id === 'site-people')!.default as string[], restriction: string | null = null): CoverageApplicantId[] {
  const normalized = restriction?.split(',').map(value => value.trim().toLowerCase()).join(',');
  const allowed = normalized && requirementUrlValues('applicant').includes(normalized) ? normalized.split(',') : null;
  return [...new Set(people.map(person => person === 'self' ? 'member' : person))]
    .filter((person): person is CoverageApplicantId => ['member', 'spouse', 'child'].includes(person) && (!allowed || allowed.includes(person)));
}

export function activeCoverageApplicantRestriction(siteKey: string): string | null {
  const params = new URLSearchParams(window.location.search), key = `coverage-applicant-scope:${siteKey}`;
  if (params.has('applicant')) {
    const value = params.get('applicant')!.split(',').map(part => part.trim().toLowerCase()).join(',');
    if (requirementUrlValues('applicant').includes(value)) { window.sessionStorage.setItem(key, value); return value; }
    window.sessionStorage.removeItem(key);
    return null;
  }
  if (coverageCategoryParameter(params) !== null || params.has('prods')) { window.sessionStorage.removeItem(key); return null; }
  return window.sessionStorage.getItem(key);
}

export function restrictCoverageApplicants(products: CoverageDefinition[], applicants: readonly CoverageApplicantId[]): CoverageDefinition[] {
  return products.map(product => ({ ...product,
    applicants: product.applicants.filter(applicant => applicants.includes(applicant)),
    riders: product.riders?.filter(rider => !rider.dependentApplicant || applicants.includes(rider.dependentApplicant)),
  })).filter(product => product.applicants.length > 0);
}
