import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { isReviewPolicy, type ReviewPolicy } from '../domain/reviewPolicy';
import { composeReadAndSign, isAdvisorReviewQuery, resolveReviewExperience } from './reviewExperience';
import { getActiveClientCoverages } from './client/getActiveClientCoverages';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const base = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
afterEach(() => { installPrototypeLibrary(null); window.history.replaceState(null, '', '/'); window.sessionStorage.clear(); });
function setup(values: Record<string, unknown>, source = freshStartSource()) {
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'review:source-test', source);
  installPrototypeLibrary(library);
  const experience = resolveReviewExperience(library.client, 'asce', getActiveClientCoverages(), values);
  return { library, experience, text: composeReadAndSign(library.content.review.readAndSignContent, experience.fraudNotice, experience.consent.text, experience.authorizationVisible, experience.medicalAuthorization, experience.premiumContributionStatement) };
}

it('uses the MCR product flag for authorization and consent independently of online health participation', () => {
  const life = setup(base);
  expect(life.experience.healthQuestionParticipation).toBe(true);
  expect(life.text).toContain('AUTHORIZATION:');
  expect(life.text.match(/CONSENT:/g)).toHaveLength(1);
  const disability = setup({ ...base, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } });
  expect(disability.experience.healthQuestionParticipation).toBe(false);
  expect(disability.experience.underwritingFlag).toBe(true);
  expect(disability.text).toContain('AUTHORIZATION:');
  expect(disability.experience.consent.text).toBe(disability.library.client.reviewPolicy!.consent!.underwrittenText);
});

it('selects configured processing and jurisdiction wording with jurisdiction precedence', () => {
  const values = { ...base, coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 1000 } };
  const combo = setup(values);
  expect(combo.experience.medicalAuthorization?.text).toBe(combo.library.client.reviewPolicy!.authorization!.wording!.processingVariants![0].text);
  const virginia = setup({ ...values, 'state-province': 'VA' });
  expect(virginia.experience.medicalAuthorization?.text).toBe(virginia.library.client.reviewPolicy!.authorization!.wording!.variants.find(variant => variant.jurisdictions.includes('VA'))!.text);
  const minnesota = setup({ ...base, 'state-province': 'MN' });
  expect(minnesota.text).toContain(minnesota.experience.medicalAuthorization!.afterConsentText);
});

it('does not let another applicant’s stale accident-rider key select the NY fraud notice', () => {
  const result = setup({ ...base, 'state-province': 'NY', coverageRiders: { 'li-term:accident:spouse': true } });
  expect(result.experience.fraudNotice).toBeNull();
  const mixed = setup({ ...base, 'state-province': 'NY', coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 1000 } });
  expect(mixed.experience.fraudNotice).toContain('FRAUD NOTICE');
});

it('does not silently omit unsupported controls from an active Review block', () => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push({ key: 'unsupported', title: 'Invalid block', paragraphs: [], fields: ['missing-field' as never], sourceReferences: ['Synthetic invalid configuration'] });
  expect(() => setup(base, source)).toThrow(/Unmapped Review policy field/);
});

it.each([['PA', 'standard'], ['NM', 'new-mexico'], ['VA', 'virginia']] as const)('selects the source IMPORTANT NOTICE for %s', (state, key) => {
  const result = setup({ ...base, 'state-province': state });
  expect(result.experience.importantNotice?.document).toEqual(result.library.content.review.importantNotices![key]);
  const text = JSON.stringify(result.experience.importantNotice!.document);
  expect(text.includes('CONFIDENTIAL ABUSE INFORMATION')).toBe(state === 'NM');
});

it('rejects a configured notice selection without an authored viewer document', () => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.importantNotice!.defaultDocument = 'missing-document';
  expect(() => setup(base, source)).toThrow(/Missing or invalid Review notice document/);
});

it.each([['flow=advisor', true], ['', false], ['flow=consumer', false], ['flow=ADVISOR', false]])('uses only the supported advisor query context: %s', (query, expected) => {
  expect(isAdvisorReviewQuery(new URLSearchParams(query))).toBe(expected);
});

it('uses the resolved fixed Association for policy blocks rather than the membership attestation or a retained answer', () => {
  const source = structuredClone(freshStartSource());
  const association = resolvePrototypeLibrary(catalog.data, 'asce', 'association-inspection', source).associationContext.associations[0].id;
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push({ key: 'association-notice', title: 'Association notice', paragraphs: ['Configured Association notice'], fields: [], when: { associationKeys: [association] }, sourceReferences: ['Synthetic Association scope'] });
  expect(setup({ ...base, association: 'retained-unrelated-value' }, source).experience.blocks.map(block => block.key)).toContain('association-notice');
});

it.each(['US-CT', ' us-ct ', 'ct'])('normalizes %s consistently for legal blocks, fraud and document selection', state => {
  const result = setup({ ...base, 'state-province': state });
  const canonical = setup({ ...base, 'state-province': 'CT' });
  expect(result.experience.blocks).toEqual(canonical.experience.blocks);
  expect(result.experience.fraudNotice).toBe(canonical.experience.fraudNotice);
  expect(result.experience.importantNotice).toEqual(canonical.experience.importantNotice);
});

it('rejects unsupported policy fields even inside a currently inactive block', () => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push({ key: 'invalid-inactive', title: 'Invalid', paragraphs: [], fields: ['missing-field' as never], when: { jurisdictions: ['CT'] }, sourceReferences: ['Synthetic inactive configuration'] });
  expect(() => setup(base, source)).toThrow(/Unmapped Review policy field/);
});

it.each([
  [{ products: ['missing-product'] }, 'product scope'],
  [{ products: ['di-ltd'], applicant: 'child' }, 'applicant scope'],
  [{ associationKeys: ['missing-association'] }, 'Association scope'],
] as const)('rejects an unavailable Review block scope: %j', (when, error) => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push({ key: 'unavailable-scope', title: 'Invalid', paragraphs: [], fields: [], when: structuredClone(when) as ReviewPolicy['blocks'][number]['when'], sourceReferences: ['Synthetic scope validation'] });
  expect(() => setup(base, source)).toThrow(error);
});

it('rejects overlapping active fields but allows the same field in mutually exclusive notice variants', () => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push(...['PA', 'CT'].map(state => ({ key: `identity-${state}`, title: 'Identity', paragraphs: [], fields: ['dividend-first-name' as const], when: { jurisdictions: [state] }, sourceReferences: ['Synthetic exclusive variants'] })));
  expect(setup(base, source).experience.blocks.flatMap(block => block.fields).map(field => field.id)).toEqual(['dividend-first-name']);
  delete policy.blocks[policy.blocks.length - 1].when;
  expect(() => setup(base, source)).toThrow(/Duplicate active Review policy field/);
});

it('rejects an applicant-type prerequisite that cannot be collected', () => {
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.consent!.otherOpening = { fieldId: 'missing-field', answer: 'yes', acceptedAnswers: ['yes', 'no'], prefix: 'as a member, ' };
  expect(() => setup(base, source)).toThrow(/Invalid Review applicant-type field or options/);
});

it.each([
  { applicant: 'self' }, { products: [] }, { products: ['li-term', 'li-term'] },
  { jurisdictions: ['ct'] }, { jurisdictions: ['US-CT'] }, { product: ['li-term'] },
])('rejects malformed or ambiguous Review filters: %j', when => {
  const source = freshStartSource();
  const policy = structuredClone(source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value) as ReviewPolicy;
  policy.blocks.push({ key: 'malformed-filter', title: 'Invalid', paragraphs: [], fields: [], when: when as ReviewPolicy['blocks'][number]['when'], sourceReferences: ['Synthetic invalid filter'] });
  expect(isReviewPolicy(policy)).toBe(false);
});

it('uses current URL product/applicant scope for legal conditions and ignores retained adult Life elections', () => {
  window.history.replaceState(null, '', '/review?site=asce&category=ad&applicant=member');
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  policy.blocks.push({ key: 'life-only', title: 'Life notice', paragraphs: [], fields: [], when: { categories: ['LI'] }, sourceReferences: ['Synthetic URL scope'] });
  const { experience } = setup({ ...base, 'state-province': 'NY', dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', coverageSelections: ['li-term', 'li-add'], productApplicants: { 'li-term': ['spouse'], 'li-add': ['member'] }, coverageAmounts: { 'li-term:spouse': 100000, 'li-add:member': 100000 } }, source);
  expect(experience.underwritingFlag).toBe(false);
  expect(experience.authorizationVisible).toBe(false);
  expect(experience.blocks.some(block => block.key === 'life-only')).toBe(false);
  expect(experience.fraudNotice).toContain('FRAUD NOTICE');
});

it('reads disclosure presentation from the projected global page definition', () => {
  const source = structuredClone(freshStartSource());
  const sections = source.pages.review.definition.legalSections as Record<string, { maxHeight: number | null }>;
  sections['electronic-consent'].maxHeight = 180;
  expect(setup(base, source).experience.legalSections).toEqual(sections);
  sections['read-and-sign'].maxHeight = 180;
  expect(() => setup(base, source)).toThrow(/Invalid fresh-start Review disclosure presentation/);
});
