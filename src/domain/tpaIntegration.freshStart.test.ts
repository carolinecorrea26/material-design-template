import { readFileSync } from 'node:fs';
import { beforeAll, expect, it } from 'vitest';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { lookupPrototypeTpa, resolveTpaOutcome } from './tpaIntegration';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { validateFieldCollection } from './fieldCollections';
import { eligibilityIneligibilityMessage } from './applicantExperience';
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let library: ReturnType<typeof resolvePrototypeLibrary>;
beforeAll(() => { library = resolvePrototypeLibrary(catalog.data, 'asce', 'eligibility-policy'); });
it('matches exactly the configured lookup fields and ignores extra prototype record facts', () => {
  const fields = ['first-name', 'last-name', 'birth-date'];
  const facts = library.client.tpaIntegration!.prototypeRecords![0].facts;
  const client = { ...library.client, tpaIntegration: { ...library.client.tpaIntegration!, lookupFields: fields } };
  const values = Object.fromEntries(fields.map(field => [field, ` ${facts[field].toUpperCase()} `]));
  expect(lookupPrototypeTpa(client, values)).toEqual({ existingMember: true, activeCoverage: true });
  expect(lookupPrototypeTpa(client, { ...values, 'member-id': 'different', 'state-province': 'CA' })).toEqual({ existingMember: true, activeCoverage: true });
  expect(lookupPrototypeTpa(client, { ...values, 'birth-date': '' }).existingMember).toBe(false);
});
it('uses all effective ASCE lookup facts and separates verification, approval and portfolio outcomes', () => {
  const facts = library.client.tpaIntegration!.prototypeRecords![0].facts;
  expect(library.client.tpaIntegration?.lookupFields).toEqual(['first-name', 'last-name', 'birth-date', 'member-id', 'state-province']);
  expect(lookupPrototypeTpa(library.client, facts)).toEqual({ existingMember: true, activeCoverage: true });
  for (const field of library.client.tpaIntegration!.lookupFields) expect(lookupPrototypeTpa(library.client, { ...facts, [field]: '' }).existingMember).toBe(false);
  const member = { existingMember: true, activeCoverage: true };
  expect(resolveTpaOutcome(library.client, member).verifyIdentity).toBe(true);
  expect(resolveTpaOutcome(library.client, member, true)).toMatchObject({ verified: true, portfolio: true, decision: 'auto-approve' });
  expect(resolveTpaOutcome(library.client, member, false)).toMatchObject({ verified: false, portfolio: false, decision: 'manual-review' });
});
it('does not look up or verify in none mode, even with stale matches and proof', () => {
  const fixture = buildGlobalTemplate(catalog, 'standard', undefined, { tpaMode: 'none' });
  const facts = fixture.client.tpaIntegration!.prototypeRecords![0].facts;
  expect(lookupPrototypeTpa(fixture.client, facts)).toEqual({ existingMember: false, activeCoverage: false });
  expect(resolveTpaOutcome(fixture.client, { existingMember: true, activeCoverage: true }, true)).toEqual({ verifyIdentity: false, verified: false, portfolio: false, decision: 'manual-review' });
});
it('keeps membership auto-approval separate from identity verification and portfolio access', () => {
  const fixture = buildGlobalTemplate(catalog, 'standard', undefined, { tpaMode: 'membership-auto-approval' });
  for (const existingMember of [false, true]) expect(resolveTpaOutcome(fixture.client, { existingMember, activeCoverage: true }, true)).toEqual({ verifyIdentity: false, verified: false, portfolio: false, decision: existingMember ? 'manual-review' : 'auto-approve' });
});
it('validates restored children against effective fields and list limits', () => {
  const child = { 'child-first-name': 'Avery', 'child-last-name': 'Rivera', 'child-birth-date': '2015-05-14', 'child-gender': 'female', 'child-full-time-student': 'yes' };
  const collection = library.fieldCollections.children;
  expect(validateFieldCollection(collection, [child])).toBeUndefined();
  expect(validateFieldCollection(collection, [{ ...child, 'child-full-time-student': '' }])).toContain('full-time student');
  expect(validateFieldCollection(collection, [{ ...child, 'child-birth-date': 'not-a-date' }])).toBeTruthy();
  expect(validateFieldCollection(collection, [null])).toBeTruthy();
  expect(validateFieldCollection({ ...collection, maxItems: 1 }, [child, child])).toBeTruthy();
});
it('evaluates a configured child-answer policy within participating repeated records', () => {
  const experience = { eligibilityDisqualifications: [{ applicant: 'child' as const, fieldId: 'child-full-time-student', value: 'no', message: 'Configured child policy result' }] };
  const values = { dependents: ['child'], children: [{ 'child-full-time-student': 'no' }] };
  expect(eligibilityIneligibilityMessage(experience, values)).toBe('Configured child policy result');
  expect(eligibilityIneligibilityMessage(experience, { ...values, dependents: [] })).toBeUndefined();
  expect(eligibilityIneligibilityMessage({ ...experience, childEligibility: { mode: 'notice-only' } }, values)).toBeUndefined();
});
