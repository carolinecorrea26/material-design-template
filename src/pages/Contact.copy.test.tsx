import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Contact from './Contact';
import BusinessInformation from '../components/contact/BusinessInformation';
import { ComponentContentContext } from '../components/content/ComponentContentContext';
import { FieldDefinitionsContext } from '../components/forms/FieldDefinitionsContext';
import { freshStartSource } from '../domain/freshStartCatalog';
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn(), saveApplication: vi.fn<(values: ApplicationFormValues) => Promise<null>>(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const copy = { 'contact.title': 'Configured Contact heading', 'contact.subhead': 'Configured Contact introduction', 'contact.section.business': 'Configured employer heading' };
function fixture() {
  const source = structuredClone(freshStartSource());
  source.fields.sitePages!.asce.contact = { ...source.fields.sitePages!.asce.contact as object, content: copy };
  return resolvePrototypeLibrary(catalog.data, 'asce', 'contact-copy', source);
}
let root: Root | undefined, host: HTMLDivElement;
beforeEach(() => {
  form.setPageValues.mockImplementation(patch => { form.values = { ...form.values, ...patch }; });
  form.saveApplication.mockClear();
});
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; host?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
async function render(node: React.ReactNode) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/contact?site=asce');
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter>{node}</MemoryRouter>));
}

it('ignores hidden correspondence answers when deciding whether to collect business address', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.contact as object, { configurations: { 'contact-hide-correspondence': true } });
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'contact-hidden-correspondence', source));
  const address = { 'business-street-address': 'Retained address' };
  form.values = { membership: 'yes', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 }, 'correspondence-to': 'business', ...address };
  await render(<Contact />);
  expect(host.querySelector('[name="correspondence-to"]')).toBeNull();
  expect(host.querySelector('[name="business-street-address"]')).toBeNull();
  expect(form.values['correspondence-to']).toBe('residential');
  expect(form.values).toMatchObject(address);
});

it('hides correspondence and saves Home when business address is completely hidden', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.contact as object, { configurations: { 'contact-hide-business-address': true } });
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'contact-hidden-business', source));
  form.values = { membership: 'yes', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 }, 'street-address': '100 Home Street', city: 'New York', state: 'NY', 'zip-code': '10001', 'correspondence-to': 'business', 'business-street-address': 'Retained address' };
  await render(<Contact />);
  expect(host.querySelector('[name="correspondence-to"]')).toBeNull();
  expect(host.querySelector('[name="business-street-address"]')).toBeNull();
  expect(form.values['correspondence-to']).toBe('residential');
  await act(async () => host.querySelector('#contact-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(form.saveApplication).toHaveBeenCalledOnce();
  expect(form.saveApplication.mock.calls[0][0]).toMatchObject({ 'correspondence-to': 'residential', 'business-street-address': 'Retained address' });
});

it('allows Business correspondence independently of automatic product collection', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.contact as object, { configurations: { 'contact-business-address-products': ['di-ltd'] } });
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'contact-independent-business', source));
  form.values = { membership: 'yes', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 }, 'correspondence-to': 'business', 'business-address-same-as-home': true, 'business-street-address': 'Separate office' };
  await render(<Contact />);
  expect(host.querySelector('[name="correspondence-to"]')).not.toBeNull();
  expect(host.querySelector<HTMLInputElement>('[name="business-street-address"]')?.value).toBe('Separate office');
  for (const name of ['business-name', 'business-type', 'business-phone', 'business-address-same-as-home']) expect(host.querySelector(`[name="${name}"]`)).toBeNull();
});

it('ignores a retained same-as-home flag when the Site hides its control', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.contact as object, { hide: ['business-address-same-as-home'] });
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'contact-hidden-same-home', source));
  form.values = { membership: 'yes', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 }, 'correspondence-to': 'residential', 'street-address': 'Home', 'business-address-same-as-home': true, 'business-street-address': 'Separate office' };
  await render(<Contact />);
  expect(host.querySelector('[name="business-address-same-as-home"]')).toBeNull();
  expect(host.querySelector<HTMLInputElement>('[name="business-street-address"]')?.value).toBe('Separate office');
});

it('uses current URL product scope for business visibility and field availability', async () => {
  const source = structuredClone(freshStartSource());
  Object.assign(source.fields.sitePages!.asce.contact as object, { configurations: { 'contact-business-address-products': ['di-ltd'] } });
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'contact-url-product-scope', source));
  form.values = { membership: 'yes', coverageSelections: ['li-10yr', 'di-ltd'], productApplicants: { 'li-10yr': ['member'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000, 'di-ltd:member': 1000 }, 'correspondence-to': 'residential', 'business-street-address': 'Retained employer address' };
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/contact?site=asce&categories=li&prods=G-29137-0');
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter><Contact /></MemoryRouter>));
  expect(host.querySelector('[name="business-street-address"]')).toBeNull();
  expect(host.querySelector('[name="business-name"]')).toBeNull();
  expect(form.values['business-street-address']).toBe('Retained employer address');
});

it.each([true, false])('honors configured Contact copy without changing section participation (spouse-only DI: %s)', async spouseDi => {
  installPrototypeLibrary(fixture());
  const product = spouseDi ? 'di-ltd' : 'li-10yr';
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', dependents: spouseDi ? ['spouse'] : [], coverageSelections: [product], productApplicants: { [product]: [spouseDi ? 'spouse' : 'member'] }, coverageAmounts: { [`${product}:${spouseDi ? 'spouse' : 'member'}`]: spouseDi ? 1000 : 100000 }, 'correspondence-to': 'residential', 'business-address-same-as-home': false, 'business-name': 'Member employer' };
  form.setPageValues.mockImplementation(patch => { form.values = { ...form.values, ...patch }; });
  await render(<Contact />);
  expect(host.textContent).toContain(copy['contact.title']); expect(host.textContent).toContain(copy['contact.subhead']);
  expect(host.textContent?.includes(copy['contact.section.business'])).toBe(spouseDi);
  expect(host.querySelector('[name="street-address"]')).not.toBeNull();
  expect(host.querySelector('[name="spouse-business-name"]')).toBeNull();
  if (spouseDi) expect(host.querySelector<HTMLInputElement>('[name="business-name"]')?.value).toBe('Member employer');
  else expect(host.querySelector('[name="business-name"]')).toBeNull();
});
it('uses the same effective heading in a standalone business section without installing a Site', async () => {
  const model = fixture(); installPrototypeLibrary(null);
  function Section() {
    const fields = model.site.configuration.pages.find(page => page.key === 'contact')!.fields.filter(field => field.included && field.key.startsWith('business-')).map(field => field.definition);
    const controller = useForm<ApplicationFormValues>({ defaultValues: {} });
    return <BusinessInformation fields={fields} control={controller.control} errors={controller.formState.errors} watchedValues={controller.watch()} setValue={controller.setValue} sameAsHome={false} showEmployerDetails />;
  }
  await render(<ComponentContentContext value={model.content}><FieldDefinitionsContext value={model.fields}><Section /></FieldDefinitionsContext></ComponentContentContext>);
  expect(host.textContent).toContain(copy['contact.section.business']);
  expect(host.querySelector('[name="business-name"]')).not.toBeNull();
  expect(getPrototypeLibrary()).toBeNull();
});
