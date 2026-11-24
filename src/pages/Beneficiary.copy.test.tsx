import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Beneficiary from './Beneficiary';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { resolveFlowGate, applicantParticipatesInPage } from '../config/flowGates';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; host?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); window.sessionStorage.clear(); });

it('allows WAEPA to continue without opting into beneficiary information', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/beneficiary?site=waepa');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'waepa', 'optional-beneficiary'));
  form.values = { 'birth-date': '1990-01-01', 'state-province': 'VA', coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000 }, 'beneficiary-information-opt-in': 'no' };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
  expect(host.querySelector('[name="beneficiary-information-opt-in"]')).not.toBeNull();
  expect([...host.querySelectorAll('button')].some(button => /add beneficiary/i.test(button.textContent ?? ''))).toBe(false);
  await act(async () => host.querySelector('#beneficiary-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(host.querySelector('.MuiAlert-standardError')).toBeNull();
  expect(form.saveApplication).toHaveBeenCalledOnce();
});

it.each([['li-10yr', false], ['di-ltd', true]] as const)('uses the resolved fixed Association consistently for %s participation=%s', async (productKey, collect) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/beneficiary?site=asce');
  const source = structuredClone(freshStartSource());
  const base = resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-association-base');
  const key = 'shared.beneficiary-participation';
  source.siteApplication.asce.records.configurationValues.push({ id: key, key, position: 0, configurationKey: key, scope: 'site', siteKey: '{{site}}', clientKey: null, value: { version: 1, rules: [{ productKey, applicantKey: 'member', associationKeys: [base.site.enabledAssociationKeys[0]], collect }] } });
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-association-test', source);
  installPrototypeLibrary(library);
  form.values = { membership: 'yes', 'beneficiary-information-opt-in': 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', coverageSelections: [productKey], productApplicants: { [productKey]: ['member'] }, coverageAmounts: { [`${productKey}:member`]: productKey === 'di-ltd' ? 1000 : 100000 }, beneficiaries: {} };
  expect(resolveFlowGate('beneficiary', form.values as ApplicationFormValues, library.products)).toBe(collect);
  expect(applicantParticipatesInPage('beneficiary', 'member', form.values, library.products)).toBe(collect);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
  expect([...host.querySelectorAll('button')].some(button => /add beneficiary/i.test(button.textContent ?? ''))).toBe(collect);
});

it('excludes retained spouse records under a member-only URL without deleting saved data', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/beneficiary?site=asce&applicant=member');
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-url-scope');
  installPrototypeLibrary(library);
  const saved = { 'li-10yr:spouse': [{ id: 'spouse-bene', designation: 'primary', beneficiaryType: 'individual', firstName: 'Example', lastName: 'Person', relationship: 'Other', share: 100 }] };
  form.values = { membership: 'yes', 'beneficiary-information-opt-in': 'yes', dependents: ['spouse'], coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['spouse'] }, coverageAmounts: { 'li-10yr:spouse': 100000 }, beneficiaries: saved };
  expect(resolveFlowGate('beneficiary', form.values as ApplicationFormValues)).toBe(false);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
  expect([...host.querySelectorAll('button')].some(button => /add beneficiary/i.test(button.textContent ?? ''))).toBe(false);
  expect(form.values.beneficiaries).toEqual(saved);
});

it('uses the effective category configuration identically in routing, applicant participation and page records', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/beneficiary?site=asce');
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.beneficiary as object, { configurations: { 'beneficiary-categories': ['DI'] } });
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-category-override', source);
  installPrototypeLibrary(library);
  form.values = { membership: 'yes', 'beneficiary-information-opt-in': 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 }, beneficiaries: {} };
  expect(resolveFlowGate('beneficiary', form.values as ApplicationFormValues, library.products)).toBe(true);
  expect(applicantParticipatesInPage('beneficiary', 'member', form.values, library.products)).toBe(true);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
  expect([...host.querySelectorAll('button')].some(button => /add beneficiary/i.test(button.textContent ?? ''))).toBe(true);
});
it('renders effective designation wording for assigned member/spouse products without bypassing beneficiary validation', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/beneficiary?site=asce');
  const source = structuredClone(freshStartSource());
  const copy = { 'beneficiary.title': 'Configured beneficiary heading', 'beneficiary.subhead': 'Configured beneficiary introduction', 'beneficiary.note.replaces-prior': 'Site replaces-prior designation wording', 'beneficiary.note.new-insurance': 'Site new-insurance designation wording' };
  source.fields.sitePages!.asce.beneficiary = { ...source.fields.sitePages!.asce.beneficiary as object, content: copy };
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-copy-page', source));
  form.values = { membership: 'yes', 'beneficiary-information-opt-in': 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', gender: 'male', 'spouse-gender': 'female', smoker: 'no', 'spouse-smoker': 'no', dependents: ['spouse'], coverageSelections: ['li-term', 'li-10yr'], productApplicants: { 'li-term': ['member', 'spouse'], 'li-10yr': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000, 'li-10yr:member': 100000, 'li-10yr:spouse': 100000 }, beneficiaries: {} };
  form.setPageValues.mockImplementation(patch => { form.values = { ...form.values, ...patch }; });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Beneficiary /></MemoryRouter>));
  expect(host.textContent).toContain(copy['beneficiary.title']);
  expect(host.textContent).toContain(copy['beneficiary.subhead']);
  for (const key of ['beneficiary.note.replaces-prior', 'beneficiary.note.new-insurance'] as const) {
    expect([...host.querySelectorAll('[role="alert"]')].filter(alert => alert.textContent === copy[key])).toHaveLength(2);
    expect(host.textContent).not.toContain(String(source.content[key]));
  }
  await act(async () => host.querySelector('#beneficiary-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(form.saveApplication).not.toHaveBeenCalled();
  expect(host.querySelector('.MuiAlert-standardError')?.textContent).toMatch(/Primary|beneficiary/i);
});
