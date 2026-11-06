import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { buildGlobalTemplate, globalTemplateKey, templateCapabilities, templateSourceLibraries, type TemplateCapability } from './globalTemplate';
import type { SharedCatalog } from '../../persistence/sharedCatalog';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json','utf8')) as SharedCatalog;
const pages = ['home', 'membership', 'eligibility', 'coverage', 'beneficiary', 'contact'];
const examples: Record<TemplateCapability, string[]> = {
 standard: ['pages-membership-whole-page--standard-membership', 'pages-home-hero--standard-quote', 'coverage-commerce-coveragequestions--supplemental-health-selected'],
 optionalBeneficiaries: ['pages-membership-additional-membership-information--optional-member-reference', 'pages-eligibility-children-information--child-service-eligibility', 'pages-beneficiary-whole-page--optional-participation', 'pages-home-whole-page--entry-notice'],
 multipleTerms: ['pages-membership-additional-membership-information--member-id', 'pages-eligibility-children-information--child-student-and-marital-status', 'pages-contact-whole-page--business-same-as-home', 'coverage-commerce-quotecalculator--multiple-term-products'],
 physicianMembership: ['pages-membership-whole-page--professional-membership', 'pages-membership-additional-membership-information--physician-spouse', 'pages-membership-member-information--with-title', 'pages-contact-whole-page--member-and-spouse'],
 professionalEducation: ['pages-membership-additional-membership-information--professional-information'],
 occupationAndChildNotice: ['pages-membership-additional-membership-information--occupation-group', 'pages-eligibility-children-information--notice-only', 'pages-eligibility-your-information--allowed-residency-options', 'coverage-reference-rate-table--pdf'],
 nursingMembership: ['pages-membership-additional-membership-information--nurse-type'],
 associationSelection: ['pages-membership-membership-status--association-selection'],
 employmentMembership: ['pages-membership-whole-page--new-membership', 'pages-membership-whole-page--current-membership', 'pages-membership-additional-membership-information--new-member', 'pages-membership-additional-membership-information--active-federal-employee', 'pages-membership-additional-membership-information--former-federal-employee', 'pages-membership-additional-membership-information--associate-member', 'pages-membership-additional-membership-information--adult-child-associate', 'pages-membership-additional-membership-information--parent-associate', 'pages-membership-additional-membership-information--sibling-associate', 'pages-contact-whole-page--product-scoped-business-information'],
 membershipStatus: ['pages-membership-whole-page--membership-status-and-referral', 'pages-membership-additional-membership-information--membership-status-and-referral', 'pages-contact-whole-page--business-information-hidden'],
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
 expect(examples[capability].length).toBeGreaterThan(0);
});
it('writes a reproducible capability register with source provenance separated from Storybook controls', () => {
 const sources = templateSourceLibraries(catalog);
 const rows = Object.entries(templateCapabilities).map(([capability,predicate]) => {
  const source = sources.find(predicate)!;
  return { capability, sourceProvenance: source.site.siteKey, globalTemplateKey, examples:examples[capability as TemplateCapability], pages:Object.fromEntries(pages.map(page=>[page,fieldKeys(source,page)])) };
 });
 expect(new Set(rows.map(row=>row.sourceProvenance)).size).toBe(sources.length);
 const report = {scope:pages,sourceCount:sources.length,rows};
 if (process.env.GLOBAL_TEMPLATE_REVIEW_WRITE === '1') writeFileSync('docs/project-review/global-template-capabilities.json',JSON.stringify(report,null,2)+'\n');
 else expect(JSON.parse(readFileSync('docs/project-review/global-template-capabilities.json','utf8'))).toEqual(report);
});
