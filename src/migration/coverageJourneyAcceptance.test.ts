import { describe, expect, it } from 'vitest';
import { freshStartLibraryData } from '../domain/freshStartLibraryData';
import { isSelectionPolicy, reconcileCoverageSelection, type SelectionPolicy } from '../domain/coverageSelectionPolicy';
import { isCoverageJourneyPolicy, resolveCoverageJourneyPolicy, resolveSubmissionMapping, reconcileDependentElections } from '../domain/coverageJourneyPolicy';
import { applicantAge, evaluateCoverageJourney, resolveQuestionParticipation, resolveScheduledChildren, resolveJourneyUnderwriting, type CoverageJourneyInput } from '../domain/coverageJourney';
import { createMockPolicyVerificationService, type VerifiedPolicy } from '../domain/policyVerification';
import { resolveNormalizedResidency } from '../domain/residencyPolicy';
import { effectiveHealthFollowUps } from '../config/fields/healthPageFields';
import { createCoverageJourneyFixture } from './coverageJourneyExceptionAcceptance';
import { journeySite as site, journeySiteKeys, journeyCatalog, journeyAssignment, journeyLibrary, riderOnlyJourneySite, syntheticJourneySource } from './freshStartJourneyFixtures';

const now = () => Date.parse('2026-10-02T12:00:00Z');
const policyFixture = (siteKey: string): VerifiedPolicy => ({ policyId: 'mock-existing-1', ownerReference: 'mock-owner', siteKey, productKey: 'li-term', applicantKey: 'member', status: 'active', amount: 100000, riders: [], permittedChanges: ['increase', 'rider-only'], billing: { method: 'bank-account', frequency: 'monthly' }, effectiveDate: '2026-10-02', expiresAt: now() + 300000 });

describe('fresh-start effective journey acceptance', () => {
  it('resolves enabled applicants, modes and submission identifiers for every enrolled Site', () => {
    for (const key of journeySiteKeys) {
      const s = site(key);
      for (const product of s.configuration.products) {
        const p = resolveCoverageJourneyPolicy(s, product.productKey)!;
        expect(isCoverageJourneyPolicy(p), `${key}/${product.productKey}`).toBe(true);
        expect(product.journeyPolicies).toHaveLength(1);
        expect(product.journeyPolicies[0].provenance.length).toBeGreaterThan(0);
        const selection = product.selectionPolicies[0].value as SelectionPolicy;
        expect(isSelectionPolicy(selection)).toBe(true);
        for (const applicant of s.products.find(x => x.productKey === product.productKey)!.applicants) {
          expect(applicant.constraints, `${key}/${product.productKey}/${applicant.applicantKey}`).not.toBeNull();
          expect(applicant.constraints?.value.maximumAgeYears).not.toBeNull();
          for (const mode of selection.modes.filter(m => m !== 'rider-only' || selection.riderOnlyApplicants.includes(applicant.applicantKey))) {
            expect(p.mappings.some(m => m.when.applicantKey === applicant.applicantKey && m.when.mode === mode), `${key}/${product.productKey}/${applicant.applicantKey}/${mode}`).toBe(true);
            expect(p.questions.filter(q => q.applicantKey === applicant.applicantKey && q.modes.includes(mode))).toHaveLength(p.questions.length ? 1 : 0);
            if (!p.questions.length) expect(p).toMatchObject({ defaultUnderwritingPathway: 'GI', healthPageByUnderwriting: { GI: null } });
          }
        }
        for (const mapping of p.mappings) {
          expect(resolveSubmissionMapping(p, mapping.when)).toMatchObject({ status: 'resolved', mapping });
          for (const value of Object.values(mapping.identifiers)) for (const role of ['display', 'rating', 'issue', 'xml', 'pdf'] as const) expect(value[role]).toBeTruthy();
          expect(Object.keys(mapping.riderCodes).sort()).toEqual(selection.riders.map(r => r.key).sort());
        }
        expect(resolveNormalizedResidency(s, product.productKey, p.applicants[0], {}).status).toBe('needs-information');
      }
    }
  });
  it('retains confirmed ASCE and WAEPA standalone-rider exclusions', async () => {
    for (const [key, productKey] of [['asce', 'li-term'], ['waepa', 'li-group-term']]) {
      const s = site(key), p = s.configuration.products.find(p => p.productKey === productKey)!;
      expect(p.selectionPolicies[0].value).toMatchObject({ riderOnlyApplicants: [] });
      expect((p.selectionPolicies[0].value as SelectionPolicy).modes).not.toContain('rider-only');
      const { input, policies } = createCoverageJourneyFixture(s, productKey, { applicantKey: 'member', mode: 'new' });
      expect(await evaluateCoverageJourney(s, { ...input, mode: 'rider-only', amount: 0 }, { policies })).toMatchObject({ allowed: false, submission: null });
    }
  });
  it('exercises verified rider-only applications once using a synthetic authored Site assignment', async () => {
    const s = riderOnlyJourneySite();
    const { input } = createCoverageJourneyFixture(s, 'li-term', { applicantKey: 'member', mode: 'rider-only' });
    input.existingPolicy = { policyId: 'mock-existing-1', ownerReference: 'mock-owner' };
    const policies = createMockPolicyVerificationService([policyFixture(s.siteKey)], now);
    const result = await evaluateCoverageJourney(s, input, { policies, now, existingLifeAmount: 0 });
    expect(result, JSON.stringify(result)).toMatchObject({ allowed: true, skipPayment: true, skipBeneficiary: true, submission: { amount: 0, existingAmount: 100000, existingPolicyId: 'mock-existing-1' } });
    expect(result.submission?.riders).toHaveLength(1);
    for (const patch of [{ existingPolicy: undefined }, { amount: 100000 }, { jurisdiction: 'FR-Paris' }, { attestations: [] }]) expect(await evaluateCoverageJourney(s, { ...input, ...patch }, { policies, now })).toMatchObject({ allowed: false, submission: null });
  });
  it('verifies increases against service evidence and rejects stale, inactive, wrong-scope or failed verification', async () => {
    const s = site('asce'), { input } = createCoverageJourneyFixture(s, 'li-term', { applicantKey: 'member', mode: 'increase' });
    input.amount = 150000; input.existingPolicy = { policyId: 'mock-existing-1', ownerReference: 'mock-owner' };
    const record = policyFixture(s.siteKey);
    for (const patch of [{ status: 'lapsed' as const }, { expiresAt: now() }, { siteKey: 'waepa' }, { permittedChanges: [] }]) {
      const policies = createMockPolicyVerificationService([{ ...record, ...patch }], now);
      expect(await evaluateCoverageJourney(s, input, { policies, now })).toMatchObject({ allowed: false, submission: null });
    }
    expect((await evaluateCoverageJourney(s, input, { policies: { verify: async () => { throw new Error('offline'); } }, now })).errors).toContain('Policy verification unavailable');
    expect((await evaluateCoverageJourney(s, input, { policies: { verify: async () => ({ status: 'verified', source: 'mock', policy: { ...record, productKey: 'li-add' } }) }, now })).allowed).toBe(false);
    const policies = createMockPolicyVerificationService([record], now);
    expect((await evaluateCoverageJourney(s, input, { policies, now })).allowed).toBe(true);
    expect((await evaluateCoverageJourney(s, { ...input, amount: record.amount }, { policies, now })).allowed).toBe(false);
  });
  it('resolves synthetic dependent defaults, attestations and withdrawal cleanup through the compiler', () => {
    const source = syntheticJourneySource(), p = journeyAssignment(source, 'example', 'li-term');
    p.dependentElections = [
      { key: 'dependent-choice', applicantKey: 'spouse', defaultSelected: true, amountChoices: [500, 1000], fixedAmount: null, maximumAgeYears: null, attestation: 'Confirm dependent election', signatureRequired: false, visitsPerYear: null },
      { key: 'dependent-fixed', applicantKey: 'child', defaultSelected: true, amountChoices: [], fixedAmount: 50, maximumAgeYears: null, attestation: 'Confirm child election', signatureRequired: false, visitsPerYear: 1 },
    ];
    const policy = resolveCoverageJourneyPolicy(journeyLibrary('example', source).site, 'li-term')!;
    expect(reconcileDependentElections(policy, {}, true)).toMatchObject({ allowed: false, elections: { 'dependent-choice': { selected: true, amount: 500 }, 'dependent-fixed': { selected: true, amount: 50 } } });
    expect(reconcileDependentElections(policy, { 'dependent-choice': { selected: true, amount: 1000, attested: true }, 'dependent-fixed': { selected: true, attested: true } }).allowed).toBe(true);
    expect(reconcileDependentElections(policy, { 'dependent-choice': { selected: true, amount: 750, attested: true } }).allowed).toBe(false);
    expect(reconcileDependentElections(policy, { 'dependent-fixed': { selected: false, amount: 500, attested: true }, orphan: { selected: true, amount: 100 } }).elections).toEqual({ 'dependent-choice': { selected: false, amount: null, attested: false, signatureRequired: false }, 'dependent-fixed': { selected: false, amount: null, attested: false, signatureRequired: false } });
  });
  it("evaluates WAEPA children individually on schedule/calendar boundaries and spouse-only primary coverage", () => {
    const s = site("waepa");
    const result = resolveScheduledChildren(s, "li-group-term", [{ key: "young", birthDate: "2026-04-03" }, { key: "older", birthDate: "2026-04-02" }], "2026-10-02", { member: 100000, spouse: 0 });
    expect(result).toMatchObject({ allowed: true, children: [{ key: "young", amount: 1000 }, { key: "older", amount: 10000 }] });
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2020-10-02" }], "2026-10-02", { member: 0, spouse: 10000 })).toMatchObject({ allowed: true, children: [{ amount: 5000 }] });
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2000-10-02" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "child", birthDate: "2026-02-30" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(resolveScheduledChildren(s, "li-group-term", [{ key: "a", birthDate: "2020-01-01" }, { key: "a", birthDate: "2021-01-01" }], "2026-10-02", { member: 100000, spouse: 0 }).allowed).toBe(false);
    expect(applicantAge("2000-02-29", "2025-02-28")?.ageYears).toBe(24);
    expect(applicantAge("2000-02-29", "2025-03-01")?.ageYears).toBe(25);
  });
  it("accepts a complete child-only WAEPA candidate with spouse-linked schedule and no child health/payment", async () => {
    const s = site("waepa"), p = resolveCoverageJourneyPolicy(s, "li-group-term")!;
    const q = p.questions.find(q => q.applicantKey === "child" && q.modes.includes("new"))!;
    const input: CoverageJourneyInput = { productKey: "li-group-term", applicantKey: "child", mode: "new", amount: 5000, memberAmount: 0, spouseAmount: 10000, onlyChild: true, membershipConfirmed: true, eligibility: { ageYears: 10, ageDays: 3652, activeMilitary: false, fullTimeStudent: true, selectedPlans: [{ productKey: "li-group-term", categoryKey: "LI", applicantKey: "spouse" }] }, jurisdiction: "US-PA", election: { riders: [], riderAmounts: {} }, attestations: [q.attestationKey] };
    const result = await evaluateCoverageJourney(s, input, { policies: createMockPolicyVerificationService([]) });
    expect(result).toMatchObject({ allowed: true, skipPayment: true, questions: { healthPage: null }, submission: { amount: 5000, payment: null } });
    expect((await evaluateCoverageJourney(s, { ...input, spouseAmount: undefined }, { policies: createMockPolicyVerificationService([]) })).allowed).toBe(false);
  });

  it('retains approved ASCE underwriting bands and the assigned QD questionnaire for QD and FUW', () => {
    const s = site('asce');
    expect(resolveJourneyUnderwriting(s, 'li-10yr', 'member', 40, 500000)).toMatchObject({ status: 'resolved', pathway: 'QD', healthPage: 'health-qd' });
    expect(resolveJourneyUnderwriting(s, 'li-10yr', 'member', 61, 500001)).toMatchObject({ status: 'resolved', pathway: 'FUW', healthPage: 'health-qd' });
    expect(resolveJourneyUnderwriting(s, 'li-10yr', 'member', 65, 100000)).toMatchObject({ status: 'resolved', pathway: 'FUW' });
    expect(resolveJourneyUnderwriting(s, 'li-10yr', 'member', 70, 100000).status).toBe('unresolved');
    const q = resolveCoverageJourneyPolicy(s, 'li-10yr')!.questions.find(q => q.applicantKey === 'member' && q.modes.includes('new'))!;
    for (const pathway of ['QD', 'FUW']) expect(resolveQuestionParticipation(s, 'li-10yr', 'member', 'new', { smoker: 'no' }, [q.attestationKey], [], pathway)).toMatchObject({ allowed: true, healthPage: 'health-qd' });
  });
  it('checks shared rider age, combined-benefit and new-applicant floors with a synthetic policy', () => {
    // A unit-policy input retains the former FPO boundary coverage without
    // enrolling an obsolete Site or asserting its historical values as defaults.
    const effective = site('asce').configuration.products.find(p => p.productKey === 'li-term')!.selectionPolicies[0].value as SelectionPolicy;
    const p = structuredClone(effective), rider = p.riders[0];
    p.riders = [{ ...rider, included: false, applicants: ['member'], requires: [], incompatible: [], excludedJurisdictions: [], minimumBase: 0, maximumBase: undefined, minimumAge: undefined, baseAmountSource: undefined, maximumAge: 49, amount: { kind: 'choices', values: [100, 500, 1000, 7000], default: 500 }, amountByApplicant: undefined, amountCap: { baseFraction: 0.25, combinedMaximum: 12500, minimumNewAmount: 500 } }];
    const key = rider.key, election = { riders: [key], riderAmounts: { [key]: 7000 } };
    const facts = { mode: 'new' as const, applicantKey: 'member', baseAmount: 10000, ageYears: 49 };
    expect(reconcileCoverageSelection(p, facts, election).election.riderAmounts[key]).toBe(500);
    expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 12400 }, election).election.riders).toEqual([]);
    expect(reconcileCoverageSelection(p, { ...facts, ageYears: 50 }, election).election.riders).toEqual([]);
    expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 2000 }, { riders: [key], riderAmounts: { [key]: 100 } }).election.riderAmounts[key]).toBe(500);
  });
  it('requires association/class mapping dimensions and preserves independent identifier roles once', () => {
    const p = structuredClone(resolveCoverageJourneyPolicy(site('asce'), 'li-term')!);
    p.associationChoices = [{ key: 'synthetic-association', label: 'Synthetic association' }];
    const mapping = structuredClone(p.mappings[0]);
    mapping.when = { applicantKey: 'member', mode: 'new', associationKey: 'synthetic-association', applicantClass: 'synthetic-class' };
    mapping.identifiers.gNumber = { display: 'Display', rating: 'Rating', issue: 'Issue', xml: 'XML', pdf: 'PDF', portalDummy: 'Dummy' };
    p.mappings = [mapping];
    expect(resolveSubmissionMapping(p, { applicantKey: 'member', mode: 'new' }).status).toBe('needs-information');
    expect(resolveSubmissionMapping(p, { ...mapping.when, associationKey: 'unknown' }).status).toBe('unresolved');
    expect(resolveSubmissionMapping(p, { ...mapping.when, applicantClass: undefined }).status).toBe('needs-information');
    expect(resolveSubmissionMapping(p, { ...mapping.when, applicantClass: 'unknown' }).status).toBe('unresolved');
    expect(resolveSubmissionMapping(p, mapping.when)).toEqual({ status: 'resolved', mapping });
  });
  it('retains the ASCE spouse-only residency exception', () => {
    const s = site('asce');
    expect(resolveNormalizedResidency(s, 'di-ltd', 'member', { jurisdiction: 'US-NH' }).allowed).toBe(true);
    expect(resolveNormalizedResidency(s, 'di-ltd', 'spouse', { jurisdiction: 'US-NH' }).allowed).toBe(false);
    expect(resolveNormalizedResidency(s, 'di-ltd', 'member', { jurisdiction: 'US-VT' }).allowed).toBe(false);
  });
  it('uses stable authored health aliases and the same repeatable detail contract as the UI', () => {
    const source = syntheticJourneySource(), p = journeyAssignment(source, 'example', 'li-term');
    p.healthPageByUnderwriting = { QD: 'health-tele', FUW: 'health-tele' };
    const s = journeyLibrary('example', source).site;
    const { input } = createCoverageJourneyFixture(s, 'li-term', { applicantKey: 'member', mode: 'new' });
    const question = effectiveHealthFollowUps(s, 'health-tele', 'self')[0];
    const answers = { ...input.answers, [question.answer.id]: 'yes', 'health-li-q1-spouse': 'yes', unused: 'discard', 'tobacco-products': ['cigarettes'] };
    const resolve = (a: Record<string, unknown>) => resolveQuestionParticipation(s, 'li-term', 'member', 'new', a, input.attestations, [], 'QD');
    const missing = resolve(answers);
    expect(missing.missingFacts).toContain(question.collection);
    for (const key of ['health-li-q1-spouse', 'unused', 'tobacco-products']) expect(missing.cleanedAnswers).not.toHaveProperty(key);
    const details = Object.fromEntries(question.fields.map(field => [question.fieldToKey[field.id], field.options?.[0]?.value ?? (field.inputType === 'date' ? '2020-01-01' : field.format === 'month-year' ? '01/2020' : field.format === 'phone' ? '2025550123' : 'Mock detail')]));
    const accepted = resolve({ ...answers, [question.collection]: [{ ...details, orphan: 'discard' }] });
    expect(accepted, JSON.stringify(accepted)).toMatchObject({ allowed: true });
    expect(accepted.cleanedAnswers).toHaveProperty(question.collection, [details]);
    expect(resolve({ ...answers, [question.collection]: 'legacy text' }).allowed).toBe(false);
    expect(resolve({ ...answers, [question.collection]: [{}] }).allowed).toBe(false);
  });
  it('recompiles authored records idempotently without superseded captured product/application records', () => {
    const projected = freshStartLibraryData(journeyCatalog.data);
    const compiled = freshStartLibraryData(projected);
    for (const table of ['configurationDefinitions', 'configurationValues', 'riders', 'productRiders', 'eligibilityConstraints'] as const) { const different = compiled[table].filter(row => JSON.stringify(row) !== JSON.stringify(projected[table].find(original => original.id === row.id))); expect(different, JSON.stringify(different.slice(0, 1))).toEqual([]); }
  });
  it('fails closed on invalid authored versions or missing non-GI question assignments', () => {
    const source = syntheticJourneySource(), p = journeyAssignment(source, 'example', 'li-term');
    p.version = 9 as 1;
    expect(() => journeyLibrary('example', source)).toThrow();
    p.version = 1; p.questions = [];
    expect(resolveQuestionParticipation(journeyLibrary('example', source).site, 'li-term', 'member', 'new').allowed).toBe(false);
  });
});
