import { LocalStorageAdapter } from '../persistence/localAdapter';
import { createPortalDataRepository } from '../repositories/portalDataRepository';
import { afterEach, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { resolveApplicationCoverage } from './coverageRuntime';
import { reconcileApplicationRiders } from './applicationRiders';
import { groupReceiptDecisions } from './receiptGroups';
import { buildSelectedCoverageEntries } from '../utils/coverageDecisions';
import { createLibraryDraft, editDraftExperience, editDraftRiders } from './libraryDraft';
import { cseaDiTable, cseaAddTable } from '../migration/cseaRateTables';
import { csvRows, parseTextRateTable } from './rateTableImport';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { getSurfaceFields } from '../config/fields/storedSurfaces';
import { quoteEligibilityPresentation } from '../app/sections/ConfiguredEligibilityFields';
import { filterEligibleStateOptions } from './applicantExperience';
import type { FieldDefinition } from './fields';
const data = createReviewedMigrationDatabase();
const library = resolvePrototypeLibrary(data, 'csea', 'prototype:test');
const di = library.products.find(p => p.id === 'di-ltd')!;
const facts = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'NY', 'hours-worked-per-week': 40, 'average-monthly-income': 5000, 'csea-occupation-group': 'group-1-clerical', dependents: ['spouse','child'], coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 }, coverageWaitingPeriods: { 'di-ltd:member': '0-day-accident-7-day-sickness' }, coverageMaxBenefitPeriods: { 'di-ltd:member': '12-months' } };
afterEach(() => installPrototypeLibrary(null));
it('filters quote and application state options using the same site setting without mutating stored options', () => {
  window.history.replaceState(null, '', '/?site=csea');
  const quoteData = structuredClone(data);
  for (const field of quoteData.siteFieldConfigurations.filter(row => row.siteKey === 'csea' && row.pageKey === 'home')) field.hidden = false;
  installPrototypeLibrary(resolvePrototypeLibrary(quoteData, 'csea', 'test'));
  const raw = getSurfaceFields('quoteInputs').find(field => field.id === 'state-province')!.options!;
  const quote = quoteEligibilityPresentation().fields.find(field => field.id === 'state-province')!.options!;
  const application = getClientPageFields('eligibility').find(field => field.id === 'state-province')!.options!;
  expect(quote).toEqual(raw.filter(option => ['NY', 'NJ', 'VT', 'PA', 'CT'].includes(option.value.replace(/^US-/, ''))));
  expect(quote.map(option => option.value)).toEqual(application.map(option => option.value));
  expect(quote.length).toBeGreaterThan(0);
  expect(quote.length).toBeLessThan(raw.length);
  expect(getSurfaceFields('quoteInputs').find(field => field.id === 'state-province')!.options).toEqual(raw);

  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'test'));
  expect(quoteEligibilityPresentation().fields.find(field => field.id === 'state-province')!.options)
    .toEqual(getSurfaceFields('quoteInputs').find(field => field.id === 'state-province')!.options);
});
it('preserves authored option order and labels, matching prefixed codes only when enabled', () => {
  const field = { id: 'state-province', options: [
    { value: 'US-NJ', label: 'New Jersey authored' },
    { value: 'CA', label: 'California authored' },
    { value: 'NY', label: 'New York authored' },
  ] } as FieldDefinition;
  expect(filterEligibleStateOptions(field, { eligibleStatesOnly: true, eligibleStates: ['NY', 'NJ'] }).options)
    .toEqual([field.options![0], field.options![2]]);
  expect(filterEligibleStateOptions(field, { eligibleStatesOnly: false, eligibleStates: ['NY'] })).toBe(field);
  expect(filterEligibleStateOptions({ ...field, id: 'other' }, { eligibleStatesOnly: true, eligibleStates: ['NY'] }).options).toEqual(field.options);
});
it('persists CSEA state and notice collection settings, and combines attestation without the old question', () => {
  expect(library.client.applicantExperience).toMatchObject({ eligibleStatesOnly: true, eligibleStates: ['NY','NJ','VT','PA','CT'], childEligibility: { mode: 'notice-only' } });
  const membership = library.site.configuration.pages.find(p => p.key === 'membership')!;
  expect(membership.fields.find(f => f.key === 'membership')?.definition.label).toContain('presently performing all the duties');
  expect(membership.fields.find(f => f.key === 'csea-performing-duties')?.included ?? false).toBe(false);
  expect(membership.fields.find(f => f.key === 'csea-occupation-group')?.included).toBe(true);
});
it('uses the membership occupation answer and supplied clerical choices/periods without the duplicate class input', () => {
  installPrototypeLibrary(library);
  const decision = resolveApplicationCoverage(di, 'member', facts, library.products);
  expect(decision.amounts).toEqual([1000,1200,1300,1400,1600,1700,1800,1900,2000]);
  expect(decision.waitingPeriod.requiredValue).toBe('0-day-accident-7-day-sickness');
  expect(decision.benefitPeriod.requiredValue).toBe('12-months');
  expect(library.site.configuration.pages.find(p => p.key === 'coverage')?.fields.find(f => f.key.endsWith(':applicantClass'))?.included).toBe(false);
});
it('defaults eligible attached benefits, preserves opt-outs, clears removed dependents without adding AD&D as a DI rider', () => {
  const initial = reconcileApplicationRiders(library.products, facts);
  expect(initial.coverageRiderAmounts).toMatchObject({ 'di-ltd:csea.spouse-accident:member': 500 });
  expect(initial.coverageRiders['di-ltd:csea.child-outpatient:member']).toBe(true);
  const optedOut = reconcileApplicationRiders(library.products, { ...facts, ...initial, coverageRiders: { ...initial.coverageRiders, 'di-ltd:csea.spouse-accident:member': false } });
  expect(optedOut.coverageRiders['di-ltd:csea.spouse-accident:member']).toBe(false);
  const removed = reconcileApplicationRiders(library.products, { ...facts, ...initial, dependents: [] });
  expect(removed.coverageRiders).toEqual({});
  expect(di.riders?.some(r => r.id === 'mcr.rider.r25')).toBe(false);
});
it('groups independent applicants once per product and retains attached beneficiary roles without extra DI decisions', () => {
  installPrototypeLibrary(library);
  const groups = groupReceiptDecisions(buildSelectedCoverageEntries(facts, library.products), facts);
  expect(groups).toHaveLength(1); expect(groups[0].entries).toHaveLength(1);
  expect(groups[0].attachedBenefits.map(b => b.applicant)).toEqual(expect.arrayContaining(['spouse','child']));
  const base = di;
  const entries = ['member','spouse','child'].map(applicant => ({ coverage: base, coverageId: base.id, applicant, underwriting: { status: 'resolved', underwritingType: 'FUW' } })) as Parameters<typeof groupReceiptDecisions>[0];
  expect(groupReceiptDecisions(entries, {})[0].entries).toHaveLength(3);
});
it('edits new Library choices at Site scope without mutating original data or another Site', async () => {
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(data)).open(), 'csea');
  const edited = editDraftRiders(editDraftExperience(draft, { ...library.client.applicantExperience, eligibleStates: ['NY','NJ'] }), 'di-ltd', di.riders!.map(r => r.dependentApplicant === 'spouse' ? { ...r, name: 'Spouse test benefit', defaultSelected: false } : r));
  const reloaded = resolvePrototypeLibrary(JSON.parse(JSON.stringify(edited.data)), 'csea', 'prototype:edited');
  expect(reloaded.client.applicantExperience?.eligibleStates).toEqual(['NY','NJ']);
  expect(reloaded.products.find(p => p.id === 'di-ltd')!.riders?.some(r => r.name === 'Spouse test benefit')).toBe(true);
  expect(di.riders?.some(r => r.name === 'Spouse test benefit')).toBe(false);
  const other = resolvePrototypeLibrary(edited.data,'asce','prototype:edited').client.applicantExperience;
  expect(other?.eligibleStatesOnly).toBeUndefined();
  expect(other?.eligibleStates).toBeUndefined();
  expect(other?.childEligibility).toBeUndefined();
}, 20000);
it('retains every supplied reference value, collection labels, source links and unresolved salary note', () => {
  expect(cseaDiTable.kind).toBe('html-table');
  if (cseaDiTable.kind !== 'html-table' || cseaAddTable.kind !== 'html-table') throw new Error('Expected HTML');
  expect(cseaDiTable.rows).toHaveLength(9); expect(cseaDiTable.rows[8][6]).toBe('$78.42');
  expect(cseaDiTable.rows[4][0]).toBe(cseaDiTable.rows[5][0]);
  expect(cseaDiTable.notes?.join(' ')).toContain('repeats');
  expect(cseaAddTable.columns[1]).toBe('Bi-weekly rate'); expect(cseaAddTable.rows[3]).toEqual(['$100,000','$2.70']);
});
it('imports quoted CSV and XML/HTML tables as plain cells, rejecting malformed and external entity input', () => {
  expect(csvRows('Amount,Rate\n"$10,000",$0.27')).toEqual([['Amount','Rate'],['$10,000','$0.27']]);
  expect(parseTextRateTable('<rates><rate><amount>10000</amount><premium>0.27</premium></rate></rates>', 'xml','XML')).toMatchObject({ kind: 'html-table', rows: [['10000','0.27']] });
  expect(() => parseTextRateTable('<!DOCTYPE rates><rates/>','xml','bad')).toThrow();
  expect(() => parseTextRateTable('Amount,Rate\n10000','csv','bad')).toThrow();
});

it('exposes member-only AD&D as its own AD product, reference table and independent election', () => {
  installPrototypeLibrary(library);
  const add = library.products.find(p => p.id === 'li-add')!;
  expect(add).toMatchObject({ categoryId: 'AD', name: 'Group Accidental Death and Dismemberment', applicants: ['member'] });
  expect(resolveApplicationCoverage(add, 'member', facts, library.products).amounts).toEqual([10000,30000,50000,100000]);
  expect(library.site.configuration.products.find(p => p.productKey === 'li-add')?.journeyPolicies[0].value).toMatchObject({ dependentElections: [] });
  expect(library.site.configuration.pages.find(p => p.key === 'coverage')?.fields.some(f => f.included && f.key.endsWith(':existingMonthlyBenefit'))).toBe(false);
  expect(resolveApplicationCoverage(di, 'member', facts, library.products).selectable).toBe(true);
  const selected = { ...facts, coverageSelections: ['di-ltd','li-add'], productApplicants: { 'di-ltd': ['member'], 'li-add': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000, 'li-add:member': 30000 } };
  expect(groupReceiptDecisions(buildSelectedCoverageEntries(selected,library.products), selected).map(g => g.coverage.id).sort()).toEqual(['di-ltd','li-add']);
  expect(data.products.find(p => p.key === 'li-add')?.definition.name).toBe('Accidental Death and Dismemberment');
});
