import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { activeReviewBlocks, isReviewPolicy, resolveReviewConsent, reviewUnderwritingFlag } from '../domain/reviewPolicy';
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';
import { composeReadAndSign, resolveReviewExperience } from './reviewExperience';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const workbook = JSON.parse(readFileSync('src/migration/sources/mcr-v78.json', 'utf8')) as { cells: Array<{ sheet: string; cell: string; value: unknown }> };
const mcr = (cell: string) => String(workbook.cells.find(row => row.sheet === 'Read & Sign' && row.cell === cell)!.value).trim();
const base = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', dependents: ['spouse', 'child'], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
let library: PrototypeLibrary;
beforeAll(() => { library = resolvePrototypeLibrary(catalog.data, 'asce', 'review:MCR-matrix'); installPrototypeLibrary(library); });
afterAll(() => installPrototypeLibrary(null));
function result(values: Record<string, unknown>) {
  const experience = resolveReviewExperience(library.client, library.site.siteKey, library.products, values);
  const text = composeReadAndSign(library.content.review.readAndSignContent, experience.fraudNotice, experience.consent.text, experience.authorizationVisible, experience.medicalAuthorization, experience.premiumContributionStatement);
  return { experience, text };
}

it.each([
  ['member', 'li-term', true], ['spouse', 'li-term', true],
  ['member', 'li-10yr', true], ['spouse', 'li-20yr', true],
  ['member', 'di-ltd', true], ['spouse', 'di-ltd', true],
  ['member', 'li-add', false], ['spouse', 'li-add', false],
  ['child', 'li-term', false], ['child', 'li-add', false],
] as const)('matches MCR B3:B4/B35:B40/B77:B93 for %s %s', (applicant, product, underwritten) => {
  const amount = product === 'di-ltd' ? 1000 : applicant === 'child' ? 10000 : 100000;
  const { experience, text } = result({ ...base, coverageSelections: [product], productApplicants: { [product]: [applicant] }, coverageAmounts: { [`${product}:${applicant}`]: amount } });
  expect(experience.underwritingFlag).toBe(underwritten);
  expect(experience.authorizationVisible).toBe(underwritten);
  expect(text.includes(mcr('B36'))).toBe(underwritten);
  expect(text.includes(mcr('B41'))).toBe(underwritten);
  expect(experience.consent.text).toBe(mcr(underwritten ? 'B78' : 'B93').replace('{Link to IMPORTANT NOTICE}', 'IMPORTANT NOTICE'));
  expect(text.startsWith(mcr('B7'))).toBe(true);
  expect(text.match(/CONSENT:/g)).toHaveLength(1);
});

it.each(Object.entries({ CO: 'C56', CA: 'C57', AL: 'C58', AR: 'C59', LA: 'C60', PA: 'C61', RI: 'C62', MD: 'C63', DC: 'C64', FL: 'C65', KS: 'C66', ME: 'C67', NJ: 'C68', NY: 'C69', OK: 'C70', PR: 'C71', TN: 'C72', WA: 'C73', VA: 'C74', VT: 'C76', AZ: 'C55', MN: 'C55' }))('uses the exact MCR fraud notice for %s', (state, cell) => {
  const { experience, text } = result({ ...base, 'state-province': state, coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 1000 } });
  expect(experience.fraudNotice).toBe(mcr(cell));
  expect(text.indexOf(mcr(cell))).toBeLessThan(text.indexOf('CONSENT:'));
});

it.each([
  [['li-term'], { 'li-term': ['member'] }, false],
  [['li-term'], { 'li-term': ['child'] }, false],
  [['li-add'], { 'li-add': ['member'] }, true],
  [['di-ltd'], { 'di-ltd': ['spouse'] }, true],
  [['li-term', 'li-add'], { 'li-term': ['member'], 'li-add': ['spouse'] }, true],
] as const)('matches the MCR NY Life-only exception for %j', (products, applicants, fraud) => {
  const { experience } = result({ ...base, 'state-province': 'NY', coverageSelections: [...products], productApplicants: applicants, coverageAmounts: { 'li-term:member': 100000, 'li-term:child': 10000, 'li-add:member': 100000, 'li-add:spouse': 100000, 'di-ltd:spouse': 1000 } });
  expect(experience.fraudNotice).toBe(fraud ? mcr('C69') : null);
});

it('uses C90 as well as C48 for Virginia QD, and standard wording for Virginia non-QD DI', () => {
  const qd = result({ ...base, 'state-province': 'VA' });
  expect(qd.experience.medicalAuthorization!.text).toBe(mcr('C48'));
  expect(qd.experience.consent.text).toBe(mcr('C90'));
  const di = result({ ...base, 'state-province': 'VA', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } });
  expect(di.experience.medicalAuthorization!.text).toBe(mcr('B41'));
  expect(di.experience.consent.text).toBe(mcr('B78').replace('{Link to IMPORTANT NOTICE}', 'IMPORTANT NOTICE'));
});

it('keeps Minnesota authorization and its post-consent exclusion in the exact source order', () => {
  const [authorization, exclusion] = mcr('C43').split(/\nStandard Fraud Notice\nCONSENT: site specific or standard consent\n/).map(part => part.trim());
  const { experience, text } = result({ ...base, 'state-province': 'MN' });
  expect(experience.medicalAuthorization!.text).toBe(authorization);
  expect(experience.medicalAuthorization!.afterConsentText).toBe(exclusion);
  expect(text.indexOf(authorization)).toBeLessThan(text.indexOf('FRAUD NOTICE'));
  expect(text.indexOf('CONSENT:')).toBeLessThan(text.indexOf(exclusion));
});

it('uses combo C52 without online health pages, while MN/VA state wording still takes precedence', () => {
  const synthetic = buildGlobalTemplate(catalog, 'multipleTerms', undefined, undefined, undefined, undefined, undefined, undefined, { withoutHealthQuestions: true });
  const previous = library;
  installPrototypeLibrary(synthetic); library = synthetic;
  try {
    const values = { ...base, coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['spouse'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:spouse': 100000, 'di-ltd:member': 1000 } };
    const combo = result(values);
    expect(combo.experience.healthQuestionParticipation).toBe(false);
    expect(combo.experience.authorizationVisible).toBe(true);
    expect(combo.experience.medicalAuthorization!.text).toBe(mcr('C52'));
    expect(result({ ...values, 'state-province': 'VA' }).experience.medicalAuthorization!.text).toBe(mcr('C48'));
    expect(result({ ...values, 'state-province': 'MN' }).experience.medicalAuthorization!.text).toBe(mcr('C43').split('\nStandard Fraud Notice')[0].trim());
  } finally { library = previous; installPrototypeLibrary(previous); }
});

it('models the 14pt SH attestation globally without enabling an ASCE SH product', () => {
  const policy = library.client.reviewPolicy!;
  const selections = [{ productKey: 'sh-critical-illness', category: 'SH', applicants: ['member'] }];
  const block = activeReviewBlocks(policy, selections).find(block => block.key === 'supplemental-health-attestation')!;
  expect(block.paragraphs).toEqual([mcr('B116').slice(mcr('B116').indexOf('I HEREBY'))]);
  expect(block.fontSizePt).toBe(14);
  expect(block.placement).toBe('before-signature');
  expect(library.products.some(product => product.categoryId === 'SH')).toBe(false);
});

it('supports OO and explicit effective-Site flag overrides without treating children or AD as underwritten', () => {
  const policy = structuredClone(library.client.reviewPolicy!);
  expect(reviewUnderwritingFlag(policy, [{ productKey: 'oo-professional', category: 'OO', applicants: ['spouse'] }])).toBe(true);
  policy.underwritingFlag!.rules = [];
  expect(isReviewPolicy(policy)).toBe(true);
  expect(reviewUnderwritingFlag(policy, [{ productKey: 'li-term', category: 'LI', applicants: ['member'] }])).toBe(false);
  expect(resolveReviewConsent(policy, [{ productKey: 'li-term', category: 'LI', applicants: ['member'] }], {}, false, { jurisdiction: 'VA', underwritingTypes: ['QD'] }).text).toBe(policy.consent!.otherText);
});

it.each(['li-add', 'li-term'])('omits the CT warning for child-only %s and ignores stale adult elections', product => {
  const { experience } = result({ ...base, 'state-province': 'CT', coverageSelections: [product], productApplicants: { [product]: ['child'], 'di-ltd': ['member'] }, coverageAmounts: { [`${product}:child`]: 10000, 'di-ltd:member': 1000 } });
  expect(experience.underwritingFlag).toBe(false);
  expect(experience.blocks.some(block => block.key === 'connecticut-underwritten-notice')).toBe(false);
});

it('rejects missing or malformed underwriting-flag definitions instead of guessing legal applicability', () => {
  const policy = structuredClone(library.client.reviewPolicy!);
  for (const flag of [undefined, { rules: [{ applicants: ['child'], categories: ['LI'] }] }, { rules: [{ applicants: ['member'] }] }, { rules: [{ applicants: ['member'], categories: ['unknown'] }] }]) {
    expect(isReviewPolicy({ ...policy, underwritingFlag: flag })).toBe(false);
  }
});
