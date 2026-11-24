import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Profile from './Profile';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { buildDocumentSections } from '../components/content/applicationDocumentSections';
import { validateProfile } from '../domain/profileValidation';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';

const form = vi.hoisted(() => ({ values: {} as ApplicationFormValues, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const answers = (): ApplicationFormValues => ({
  membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'NY', dependents: ['spouse'],
  coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['member', 'spouse'], 'di-ltd': ['member', 'spouse'] },
  coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000, 'di-ltd:member': 3000, 'di-ltd:spouse': 1000 },
});
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; host?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.sessionStorage.clear();
});
async function render(source = structuredClone(freshStartSource()), query = '', site = 'asce') {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', `/profile?site=${site}${query}`);
  const library = resolvePrototypeLibrary(catalog.data, site, 'profile-configuration', source);
  installPrototypeLibrary(library);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Profile /></MemoryRouter>));
  return library;
}

it.each([[5000, true, false], [5500, true, true], [5500, false, false]] as const)('uses WAEPA DI amount %s selected=%s consistently on Profile and Review', async (amount, selected, shown) => {
  form.values = { 'birth-date': '1990-01-01', 'state-province': 'VA', coverageSelections: selected ? ['di-short-term'] : [], productApplicants: { 'di-short-term': selected ? ['member'] : [] }, coverageAmounts: { 'di-short-term:member': amount }, 'total-net-worth': '$90,000' };
  await render(undefined, '', 'waepa');
  expect(host.querySelector('[name="total-net-worth"]') !== null).toBe(shown);
  expect(JSON.stringify(buildDocumentSections(form.values)).includes('90,000')).toBe(shown);
});

it('suppresses hidden personal follow-ups independently per adult without deleting restored answers', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.profile as object, { fieldParticipation: { self: { hide: ['has-drivers-license', 'intend-live-outside-us', 'travel-outside-us-six-months'] } } });
  form.values = answers();
  for (const prefix of ['', 'spouse-']) Object.assign(form.values, {
    [`${prefix}has-drivers-license`]: 'yes', [`${prefix}drivers-license-number`]: `${prefix || 'member-'}LICENSE`, [`${prefix}drivers-license-state`]: 'NY',
    [`${prefix}intend-live-outside-us`]: 'yes', [`${prefix}outside-us-country`]: 'CA',
    [`${prefix}travel-outside-us-six-months`]: 'yes', [`${prefix}travel-outside-us-country`]: 'CA',
  });
  const library = await render(source);
  expect(library.site.configuration.pages.find(page => page.key === 'profile')!.fields.find(field => field.key === 'drivers-license-number')?.definition.visibilityDependencies).toEqual(['has-drivers-license']);
  for (const id of ['has-drivers-license', 'drivers-license-number', 'drivers-license-state', 'intend-live-outside-us', 'outside-us-country', 'travel-outside-us-six-months', 'travel-outside-us-country']) {
    expect(host.querySelector(`[name="${id}"]`), id).toBeNull();
    expect(host.querySelector(`[name="spouse-${id}"]`), `spouse-${id}`).not.toBeNull();
  }
  const preview = JSON.stringify(buildDocumentSections(form.values));
  expect(preview).not.toContain('member-LICENSE');
  expect(preview).toContain('spouse-LICENSE');
  expect(form.values['drivers-license-number']).toBe('member-LICENSE');
});

it('omits empty personal and physician sections when a Site hides their fields', async () => {
  const source = structuredClone(freshStartSource());
  const hide = Object.values(source.pages.profile.layout.sections).filter(section => section.for === 'self' && section.id?.startsWith('profilePersonal') && !section.enabledByConfiguration).flatMap(section => section.fields ?? []);
  Object.assign(source.fields.sitePages!.asce.profile as object, { fieldParticipation: { self: { hide } }, configurations: { 'physician-information': false } });
  form.values = { ...answers(), dependents: [], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] } };
  await render(source);
  expect(host.textContent).not.toContain('Personal information');
  expect(host.textContent).not.toContain('Physician information');
  expect(host.textContent).toContain('Other coverage');
  expect(getClientPageFields('profile', form.values).find(field => field.id === 'social-security-number')).toBeUndefined();
});

it('keeps personal requiredness overrides separate from global physician, Other coverage and carrier definitions', async () => {
  const source = structuredClone(freshStartSource());
  const fields = source.fields.sites.asce as { fields: Record<string, unknown> };
  fields.fields['height-feet'] = { required: false, label: 'Height in feet' };
  fields.fields['di-company-name'] = { label: 'Carrier name' };
  form.values = answers();
  const library = await render(source);
  const current = getClientPageFields('profile', form.values);
  expect(current.find(field => field.id === 'height-feet')).toMatchObject({ label: 'Height in feet', required: false });
  expect(current.find(field => field.id === 'physician-phone')).toBeDefined();
  expect(current.find(field => field.id === 'physician-phone')?.required).not.toBe(true);
  for (const key of ['selfDisabilityCompanies', 'spouseDisabilityCompanies']) {
    const collection = library.fieldCollections[key];
    expect(collection.mapping.fields).toHaveLength(4);
    expect(collection.mapping.fields.every(field => field.required)).toBe(true);
    expect(collection.mapping.fields[0].label).toBe('Carrier name');
  }
});

it('hides the complete shared physician section for both adults and retains their saved drafts', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.profile as object, { configurations: { 'physician-information': false } });
  form.values = { ...answers(), 'physician-first-name': 'HiddenMemberDoctor', 'spouse-physician-first-name': 'HiddenSpouseDoctor' };
  await render(source);
  expect(host.textContent).not.toContain('Physician information');
  for (const prefix of ['', 'spouse-']) expect(host.querySelector(`[name="${prefix}physician-first-name"]`)).toBeNull();
  const preview = JSON.stringify(buildDocumentSections(form.values));
  expect(preview).not.toContain('HiddenMemberDoctor');
  expect(preview).not.toContain('HiddenSpouseDoctor');
  expect(form.values['physician-first-name']).toBe('HiddenMemberDoctor');
  expect(form.values['spouse-physician-first-name']).toBe('HiddenSpouseDoctor');
});

it('excludes retained spouse carrier answers when the URL restricts applicants to the member', async () => {
  form.values = { ...answers(), 'has-disability-insurance': 'no', 'spouse-has-disability-insurance': 'yes', spouseDisabilityCompanies: [{ company: 'Hidden spouse carrier' }] };
  const library = await render(undefined, '&applicant=member');
  expect(host.querySelector('[name="spouse-height-feet"]')).toBeNull();
  expect(host.textContent).not.toContain('Hidden spouse carrier');
  expect(validateProfile(form.values, library)).toBeUndefined();
  expect(JSON.stringify(buildDocumentSections(form.values))).not.toContain('Hidden spouse carrier');
  expect(form.values.spouseDisabilityCompanies).toEqual([{ company: 'Hidden spouse carrier' }]);
});
