import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { buildGlobalTemplate, globalTemplateKey, templateCapabilities, templateSourceLibraries, type TemplateCapability } from './globalTemplate';
import type { SharedCatalog } from '../../persistence/sharedCatalog';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json','utf8')) as SharedCatalog;
const pages = ['home', 'membership', 'eligibility', 'coverage', 'beneficiary', 'contact'];
// Reference shared structural examples; differences in Site values do not
// require separate copies of the same field or membership composition.
const examples: Record<TemplateCapability, string[]> = {
 standard: ['pages-membership-whole-page--standard-membership', 'pages-home-hero--standard-quote'],
 optionalBeneficiaries: ['pages-beneficiary-whole-page--optional-participation', 'pages-membership-additional-membership-information--member-id'],
 multipleTerms: ['pages-eligibility-children-information--additional-child-questions', 'coverage-commerce-quotecalculator--multiple-term-products'],
 physicianMembership: ['pages-membership-whole-page--category-membership', 'components-forms-field-groups-name--with-title', 'pages-contact-whole-page--member-and-spouse'],
 professionalEducation: ['pages-membership-additional-membership-information--professional-education'],
 occupationAndChildNotice: ['pages-eligibility-children-information--notice-only', 'pages-eligibility-your-information--allowed-residency-options'],
 nursingMembership: ['pages-membership-additional-membership-information--nursing-qualification'],
 associationSelection: ['pages-membership-membership-status--association-selection'],
 employmentMembership: ['pages-membership-whole-page--new-or-current-membership', 'pages-contact-whole-page--product-scoped-business-information'],
 membershipStatus: ['pages-membership-membership-status--new-or-current-member', 'pages-contact-whole-page--business-information-hidden'],
};
const fieldKeys = (library: ReturnType<typeof buildGlobalTemplate>, page: string) => [...new Set([
 ...(library.site.configuration.pages.find(row => row.key === page)?.fields.filter(field => field.included).map(field => field.key) ?? []),
 ...Object.values(library.fieldCollections).filter(collection => collection.pageKey === page).flatMap(collection => collection.mapping.fields.map(field => field.id)),
])].sort();
it('accounts for every earlier-page field and collection addition across all configured sources', () => {
 const sources = templateSourceLibraries(catalog);
 const fixtures = Object.keys(templateCapabilities).map(capability => buildGlobalTemplate(catalog, capability as TemplateCapability));
 for (const page of pages) expect([...new Set(fixtures.flatMap(library => fieldKeys(library,page)))].sort()).toEqual([...new Set(sources.flatMap(library => fieldKeys(library,page)))].sort());
});
it.each(Object.keys(templateCapabilities) as TemplateCapability[])('installs %s under the same global template identity without changing saved definitions', capability => {
 const before = JSON.stringify(catalog);
 const library = buildGlobalTemplate(catalog, capability);
 expect(library.site.siteKey).toBe(globalTemplateKey);
 expect(library.client.branding.name).toBe('Example Association');
 expect(library.sourceSiteKey).toBe(globalTemplateKey);
 expect(library.pageData.sitePages.every(page => page.siteKey === globalTemplateKey)).toBe(true);
 expect(JSON.stringify({content:library.content, branding:library.client.branding})).not.toMatch(/\b(?:ABE|ASCE|AMA|AVMA|CSEA|NSO|WAEPA)\b/);
 expect(JSON.stringify(catalog)).toBe(before);
 if (templateSourceLibraries(catalog).some(templateCapabilities[capability])) expect(examples[capability].length).toBeGreaterThan(0);
});
it('writes a reproducible capability register with source provenance separated from Storybook controls', () => {
 const sources = templateSourceLibraries(catalog);
 const rows = Object.entries(templateCapabilities).map(([capability,predicate]) => {
  const matched = sources.find(predicate);
  return { capability, selection: matched ? 'matched' : examples[capability as TemplateCapability].length ? 'synthetic global example; no enrolled Site assignment' : 'no enrolled Site assignment or current example', sourceProvenance: matched?.site.siteKey ?? null, globalTemplateKey, exampleScope: 'Shared structure; effective Site values are verified separately', examples:examples[capability as TemplateCapability], pages:matched ? Object.fromEntries(pages.map(page=>[page,fieldKeys(matched,page)])) : {} };
 });
 // Enrolled Sites may share capabilities; canonical examples do not multiply
 // merely because another Site supplies a different assignment of shared fields.
 expect(rows.every(row => row.sourceProvenance === null || sources.some(source => source.site.siteKey === row.sourceProvenance))).toBe(true);
 const report = {scope:pages,sourceCount:sources.length,rows};
 if (process.env.GLOBAL_TEMPLATE_REVIEW_WRITE === '1') writeFileSync('docs/project-review/global-template-capabilities.json',JSON.stringify(report,null,2)+'\n');
 else expect(JSON.parse(readFileSync('docs/project-review/global-template-capabilities.json','utf8'))).toEqual(report);
});
