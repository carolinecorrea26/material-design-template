import { coverageLifeMaximumError } from './coverageSubmitValidation';
import { resolveEffectiveAmount } from './effectiveConfiguration';
import { validateNormalizedCoverageAmount } from './normalizedCoverageAmounts';
import { verifiedPortfolioAmount } from './tpaPortfolioAmounts';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { resolveApplicationCoverage, validateApplicationCoverages } from './coverageRuntime';
import { applicationRiderOptions } from './applicationRiders';
import { coveragePreselection } from './coveragePreselection';
import { isSelectionPolicy, reconcileCoverageSelection } from './coverageSelectionPolicy';
import { isDependentPolicy, resolveDependentCoverage } from './dependentPolicy';
import { capturedCoverageEntryScope, captureCoverageAmountParameters, restoreCoverageEntryScope } from '../config/client/coverageProductScope';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'coverage-decisions');
const verified = { 'tpa-existing-member': true, 'tpa-active-coverage': true, 'tpa-verified': true, 'tpa-portfolio-enabled': true };
const base = { membership: 'yes', 'birth-date': '1990-01-01', gender: 'male', smoker: 'no', 'state-province': 'VA', dependents: ['spouse', 'child'], 'spouse-birth-date': '1991-01-01', 'spouse-gender': 'female', 'spouse-smoker': 'no', children: [{ 'child-birth-date': '2020-01-01', 'child-full-time-student': 'no' }], 'hours-worked-per-week': '40', 'spouse-hours-worked-per-week': '40', 'average-monthly-income': '10000', 'spouse-average-monthly-income': '5000', 'self-employed-under-one-year': 'no' };
beforeEach(() => installPrototypeLibrary(library));
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); window.history.replaceState(null, '', '/'); });
it.each(['prototype', 'storybook'])('allows verified existing member Life to support dependent-only Life in %s', surface => {
  const current = surface === 'prototype' ? library : buildGlobalTemplate(catalog);
  installPrototypeLibrary(current);
  const values = { ...base, ...verified, coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['child'] }, coverageAmounts: { 'li-10yr:child': 10000 } };
  expect(validateApplicationCoverages(current.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(validateApplicationCoverages(current.products, { ...values, 'tpa-verified': false }, { deferProfileUnderwriting: true })).toMatch(/requires|required primary/i);
});
it('uses existing same-product AD&D for dependent prerequisites and caps without a new member election', () => {
  const product = library.products.find(product => product.id === 'li-add')!;
  const values = { ...base, ...verified, coverageSelections: ['li-add'], productApplicants: { 'li-add': ['spouse', 'child'] }, coverageAmounts: { 'li-add:spouse': 100000, 'li-add:child': 10000 } };
  expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(resolveApplicationCoverage(product, 'spouse', values, library.products).amounts).toEqual([50000, 100000]);
  expect(validateApplicationCoverages(library.products, { ...values, 'tpa-active-coverage': false }, { deferProfileUnderwriting: true })).toBeDefined();
});
it.each(['prototype', 'storybook'] as const)('uses the 10k Term Life minimum for both adults with or without verified existing coverage in %s', surface => {
  const current = surface === 'prototype' ? library : buildGlobalTemplate(catalog);
  installPrototypeLibrary(current);
  const product = current.products.find(product => product.id === 'li-term')!;
  for (const applicant of ['member', 'spouse'] as const) {
    const values = { ...base, ...verified, coverageSelections: ['li-term'], productApplicants: { 'li-term': [applicant] }, coverageAmounts: { [`li-term:${applicant}`]: 10000 } };
    const amount = verifiedPortfolioAmount(current.client, values, applicant, [product.id]);
    expect(amount).toBeGreaterThan(0);
    expect(resolveApplicationCoverage(product, applicant, values, current.products).amounts[0]).toBe(10000);
    expect(resolveApplicationCoverage(product, applicant, values, current.products).amountControl.defaultAmount).toBe(10000);
    expect(validateApplicationCoverages(current.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
    expect(coverageLifeMaximumError(current.site, current.products, values, current.client)).toBeUndefined();
    expect(validateNormalizedCoverageAmount(current.site, product.id, applicant, 10000, undefined, undefined, 'new', amount).allowed).toBe(true);
    expect(resolveEffectiveAmount(current.site.configuration, product.id, { applicantKey: applicant, amount: 10000, verifiedExistingAmount: amount }).allowed).toBe(true);
    for (const flag of ['tpa-existing-member', 'tpa-active-coverage', 'tpa-verified', 'tpa-portfolio-enabled']) {
      const unverified = { ...values, [flag]: false, applicationMode: 'increase', 'has-other-life-insurance': 'yes', 'existing-life-insurance-amount': '250000' };
      expect(resolveApplicationCoverage(product, applicant, unverified, current.products).amounts[0]).toBe(10000);
      expect(validateApplicationCoverages(current.products, unverified, { deferProfileUnderwriting: true })).toBeUndefined();
    }
    expect(validateNormalizedCoverageAmount(current.site, product.id, applicant, 10000).allowed).toBe(true);
    expect(resolveEffectiveAmount(current.site.configuration, product.id, { applicantKey: applicant, amount: 10000 }).allowed).toBe(true);
  }
});
it('keeps the 10k minimum without TPA while verified portfolio amounts remain product/person scoped', () => {
  const current = buildGlobalTemplate(catalog, 'standard', undefined, { tpaMode: 'none' });
  installPrototypeLibrary(current);
  const product = current.products.find(product => product.id === 'li-term')!;
  expect(resolveApplicationCoverage(product, 'member', { ...base, ...verified }, current.products).amounts[0]).toBe(10000);
  expect(verifiedPortfolioAmount(library.client, verified, 'member', ['li-term'], { portfolios: [{ applicant: 'spouse', coverages: [{ productKey: 'li-term', amount: 100000 }] }, { applicant: 'self', coverages: [{ productKey: 'li-add', amount: 100000 }] }] })).toBe(0);
  installPrototypeLibrary(library);
  expect(resolveApplicationCoverage(library.products.find(product => product.id === 'li-10yr')!, 'member', { ...base, ...verified }, library.products).amounts[0]).toBe(100000);
  const patch = coveragePreselection(library.products, { ...base, ...verified, coverageEntryScope: { preselect: 'TRUE' } })!;
  expect(patch.coverageAmounts['li-term:member']).toBe(10000);
});
it.each(['member', 'spouse'] as const)('uses only this applicant’s verified existing plus requested Term Life for CIR: %s', applicant => {
  const product = library.products.find(product => product.id === 'li-term')!, rider = product.riders![0];
  const values = { ...base, ...verified, coverageSelections: ['li-term'], productApplicants: { 'li-term': [applicant] }, coverageAmounts: { [`li-term:${applicant}`]: 50000 }, coverageRiders: { [`li-term:${rider.id}:${applicant}`]: true }, coverageRiderAmounts: { [`li-term:${rider.id}:${applicant}`]: applicant === 'member' ? 300000 : 150000 } };
  expect(applicationRiderOptions(product, rider, applicant, values).choices.at(-1)).toBe(applicant === 'member' ? 300000 : 150000);
  expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(applicationRiderOptions(product, rider, applicant, { ...values, 'tpa-verified': false }).available).toBe(false);
  expect(validateApplicationCoverages(library.products, { ...values, 'tpa-verified': false }, { deferProfileUnderwriting: true })).toContain('select an available rider amount');
});
it.each(['member', 'spouse'] as const)('requires 100k supporting Term Life for CIR and retains the %s rider minimum', applicant => {
  const policy = library.site.configuration.products.find(product => product.productKey === 'li-term')!.selectionPolicies[0].value;
  if (!isSelectionPolicy(policy)) throw new Error('Invalid test policy');
  const rider = policy.riders[0];
  for (const [requested, existing, allowed] of [[90000, 0, false], [100000, 0, true], [10000, 80000, false], [10000, 90000, true]] as const) {
    const result = reconcileCoverageSelection(policy, { mode: 'new', applicantKey: applicant, baseAmount: requested, verifiedExistingAmount: existing, ageYears: 35, jurisdiction: 'US-VA' }, { riders: [rider.key], riderAmounts: {} });
    expect(result.election.riders.includes(rider.key), `${requested}+${existing}`).toBe(allowed);
    if (allowed) expect(result.election.riderAmounts[rider.key]).toBe(applicant === 'member' ? 50000 : 25000);
  }
});
it.each(['li-term', 'li-10yr', 'li-20yr'])('caps total spouse coverage only with verified matching member coverage: %s', product => {
  const facts = { amount: 150000, verifiedMemberAmount: 100000, verifiedExistingAmount: 50000, baseAmounts: { member: 200000, spouse: 200000 } };
  expect(resolveDependentCoverage(library.site, product, 'spouse', facts)).toMatchObject({ allowed: true, maximum: 150000 });
  expect(resolveDependentCoverage(library.site, product, 'spouse', { ...facts, amount: 160000 })).toMatchObject({ allowed: false, maximum: 150000 });
  expect(resolveDependentCoverage(library.site, product, 'spouse', { ...facts, verifiedMemberAmount: 0, amount: 300000, baseAmounts: { member: 0 } })).toMatchObject({ allowed: true, maximum: null });
  expect(resolveDependentCoverage(library.site, product, 'spouse', { ...facts, verifiedExistingAmount: 200000 })).toMatchObject({ allowed: false, maximum: 0 });
  const policy = library.site.configuration.products.find(row => row.productKey === product)!.dependentPolicies[0].value;
  expect(isDependentPolicy(policy)).toBe(true);
  expect(isDependentPolicy({ ...policy as object, rules: [{ applicantKey: 'spouse', memberCapRequiresVerifiedCoverage: true }] })).toBe(false);
});
it('uses verified same-policy totals in the real Coverage choices and validation, without borrowing other Life coverage', () => {
  const term = library.products.find(product => product.id === 'li-term')!;
  const values = { ...base, ...verified, coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 250000 } };
  expect(resolveApplicationCoverage(term, 'spouse', values, library.products).amounts.at(-1)).toBe(250000);
  expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(validateApplicationCoverages(library.products, { ...values, coverageAmounts: { ...values.coverageAmounts, 'li-term:spouse': 260000 } }, { deferProfileUnderwriting: true })).toBeDefined();
  expect(resolveApplicationCoverage(term, 'spouse', { ...values, 'tpa-verified': false }, library.products).amounts).toContain(500000);
  const level = library.products.find(product => product.id === 'li-10yr')!;
  const levelValues = { ...base, ...verified, coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['spouse'] }, coverageAmounts: { 'li-10yr:spouse': 500000 } };
  expect(validateApplicationCoverages(library.products, levelValues, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(resolveApplicationCoverage(level, 'spouse', levelValues, library.products).amounts).toContain(500000);
});
it('preselects all offered base products and participating applicants once, without adding riders', () => {
  const values = { ...base, coverageEntryScope: { preselect: 'TRUE' } };
  const patch = coveragePreselection(library.products, values)!;
  expect(patch.coverageSelections.sort()).toEqual(library.products.map(product => product.id).sort());
  for (const product of library.products) expect(patch.productApplicants[product.id]).toEqual(product.applicants);
  expect(patch).not.toHaveProperty('coverageRiders');
  expect(patch.coverageAmounts['li-term:member']).toBe(10000);
  expect(coveragePreselection(library.products, { ...values, ...patch, coverageSelections: [] })).toBeNull();
  expect(coveragePreselection(library.products, { ...base, coverageEntryScope: { preselect: 'invalid' } })).toBeNull();
});
it('respects the entry product scope and collected applicants while preserving existing riders and amounts', () => {
  const product = library.products.find(product => product.id === 'li-term')!;
  const values = { ...base, dependents: [], coverageEntryScope: { preselect: 'true' }, coverageAmounts: { 'li-term:member': 100000 }, coverageRiders: { 'saved-rider': true } };
  const patch = coveragePreselection([product], values)!;
  expect(patch.coverageSelections).toEqual(['li-term']);
  expect(patch.productApplicants['li-term']).toEqual(['member']);
  expect(patch.coverageAmounts['li-term:member']).toBe(100000);
  expect({ ...values, ...patch }.coverageRiders).toEqual(values.coverageRiders);
});
it('captures preselect into the saved entry contract and restores it independently of another application', () => {
  window.history.replaceState(null, '', '/?preselect=TRUE');
  captureCoverageAmountParameters('asce');
  expect(capturedCoverageEntryScope('asce')).toEqual({ preselect: 'TRUE' });
  restoreCoverageEntryScope('asce', {});
  expect(capturedCoverageEntryScope('asce')).toEqual({});
  restoreCoverageEntryScope('asce', { preselect: 'TRUE' });
  expect(capturedCoverageEntryScope('asce')).toEqual({ preselect: 'TRUE' });
});
