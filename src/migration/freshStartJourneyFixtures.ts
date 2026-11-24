import { readFileSync } from 'node:fs';
import { freshStartSource } from '../domain/freshStartCatalog';
import { resolvePrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';
import type { RequirementCatalogSource } from '../domain/requirementCatalog.mjs';
import type { CoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import type { SelectionPolicy } from '../domain/coverageSelectionPolicy';
import type { LibraryCatalog } from '../services/libraryCatalogService';

// Test infrastructure only. Enrollment and all policy values come from authored
// requirements, through the same compiler as Library and the applicant runtime.
export const journeyCatalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;
export const journeySiteKeys = Object.keys(freshStartSource().fields.sites).sort();
const libraries = new Map<string, PrototypeLibrary>();
export function journeyLibrary(key: string, source?: RequirementCatalogSource) {
  if (source) {
    const data = key === 'example' ? { ...journeyCatalog.data, sites: [...journeyCatalog.data.sites, { ...journeyCatalog.data.sites.find(site => site.key === 'asce')!, key, id: key }] } : journeyCatalog.data;
    return resolvePrototypeLibrary(data, key, 'journey-test:override', source);
  }
  if (!libraries.has(key)) libraries.set(key, resolvePrototypeLibrary(journeyCatalog.data, key, 'journey-test'));
  return libraries.get(key)!;
}
export const journeySite = (key: string) => journeyLibrary(key).site;

/** Adapt the same synthetic applicant facts to real form fields for runtime and
 * routing parity tests. Policy choices are supplied by createCoverageJourneyFixture. */
export { journeyFormValues } from '../dev/utils/journeyFormValues';

/** Edit authored assignments, never the effective/generated projection. */
export function journeyAssignment<T = CoverageJourneyPolicy>(source: RequirementCatalogSource, siteKey: string, productKey: string, kind = 'product-journey-policy'): T {
  const definitions = [...source.products.catalog.configurationDefinitions, ...(source.siteProducts[siteKey].catalog?.configurationDefinitions ?? [])];
  const definition = definitions.find(row => {
    const target = (row.definition as { target?: { kind: string; productKey: string } }).target;
    return target?.kind === kind && target.productKey === productKey;
  });
  const row = source.siteProducts[siteKey].catalog?.configurationValues?.find(row => row.configurationKey === definition?.key);
  if (!row) throw new Error(`Missing authored ${siteKey}/${productKey}/${kind}`);
  return row.value as T;
}

/** An isolated Site exercises supported inherited capabilities without enrolling
 * another real Site or changing any confirmed Site policy. */
export function syntheticJourneySource() {
  const source = structuredClone(freshStartSource());
  source.fields.sites.example = structuredClone(source.fields.sites.asce);
  source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
  source.siteProducts.example = structuredClone(source.siteProducts.asce);
  source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
  source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
  return source;
}
export function riderOnlyJourneySite() {
  const source = syntheticJourneySource();
  const selection = journeyAssignment<SelectionPolicy>(source, 'example', 'li-term', 'product-selection-policy');
  selection.modes.push('rider-only');
  selection.riderOnlyApplicants = ['member'];
  const policy = journeyAssignment(source, 'example', 'li-term');
  policy.questions.push({ ...structuredClone(policy.questions.find(q => q.applicantKey === 'member' && q.modes.includes('new'))!), modes: ['rider-only'] });
  policy.mappings.push({ ...structuredClone(policy.mappings.find(m => m.when.applicantKey === 'member' && m.when.mode === 'new')!), when: { applicantKey: 'member', mode: 'rider-only' } });
  return journeyLibrary('example', source).site;
}
