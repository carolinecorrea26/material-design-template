import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../requirements/parked/field-details.json', async original => {
  const module = await original<{ default: { fields: Array<{ id: string; label: unknown }> } }>();
  return { default: { ...module.default, fields: module.default.fields.map(field => field.id === 'first-name' ? { ...field, label: 'JSON given name' } : field.id === 'di-company-name' ? { ...field, label: 'JSON carrier name' } : field) } };
});
vi.mock('../../requirements/global/option-lists.json', async original => {
  const module = await original<{ default: Record<string, Array<{ value: string; label: string }>> }>();
  return { default: { ...module.default, 'states-provinces': module.default['states-provinces'].map(option => option.value === 'NY' ? { ...option, label: 'JSON New York label' } : option) } };
});
vi.mock('../../requirements/global/configurations/presentation.json', async original => {
  const module = await original<{ default: { configurations: Array<{ id: string; default: unknown }> } }>();
  return { default: { ...module.default, configurations: module.default.configurations.map(row => row.id === 'single-page-artwork' ? { ...row, default: 'clouds-cat-umbrella' } : row) } };
});
import { evaluateConditionDefinition } from '../config/conditions/evaluateConditions';
import { freshStartSource, withFreshStartCatalog } from './freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { fieldSurfaceRows } from '../pages/admin/library/fieldSurfaceRows';
import { configurationRows } from '../pages/admin/library/configurationRows';
import { showSinglePageArtwork } from '../config/homepagePresentation';
import CompanyRecordExample from '../../.storybook/CompanyRecordExample';
import { renderDisabilityCompanySummary } from '../components/profile/ProfileSections';
import { renderToStaticMarkup } from 'react-dom/server';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });

it('propagates authored field labels, option labels and inherited configuration through all three consumers', () => {
  const stale = structuredClone(catalog);
  stale.data.fields.find((row: { key: string }) => row.key === 'first-name').definition.label = 'Stale saved name';
  const current = { ...stale, data: withFreshStartCatalog(stale.data) };
  const prototype = resolvePrototypeLibrary(stale.data, 'asce', 'field-source');
  const story = buildGlobalTemplate(stale);
  const usages = fieldSurfaceRows(current, 'asce');
  expect(usages.some(row => row.field.id === 'first-name' && row.field.label === 'JSON given name')).toBe(true);
  expect(usages.find(row => row.field.id === 'state-province')?.field.options?.find(option => option.value === 'NY')?.label).toBe('JSON New York label');
  expect(configurationRows(current, 'asce').find(row => row.key.includes('singlePageArtwork'))?.values).toContain('clouds-cat-umbrella');
  for (const library of [prototype, story]) {
    installPrototypeLibrary(library);
    const fields = [...getClientPageFields('membership', { membership: 'yes' }), ...getClientPageFields('eligibility')];
    expect(fields.find(field => field.id === 'first-name')?.label).toBe('JSON given name');
    expect(fields.find(field => field.id === 'state-province')?.options?.find(option => option.value === 'NY')?.label).toBe('JSON New York label');
    expect(showSinglePageArtwork('single', library.client.features)).toBe(true);
  }
});

it('renders the repeated-record story from the installed collection after its module has loaded', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const library = buildGlobalTemplate(catalog);
  const collection = library.fieldCollections.selfDisabilityCompanies;
  collection.label = 'Configured carrier'; collection.maxItems = 2;
  collection.mapping.fields.find(field => field.id === 'di-company-name')!.label = 'Current revision carrier';
  installPrototypeLibrary(library);
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<CompanyRecordExample populated />));
    expect(host.textContent).toContain('Example Carrier');
    expect(host.textContent).not.toContain('Add Configured carrier');
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Edit')!.click());
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Current revision carrier');
    expect(document.querySelector<HTMLInputElement>('input[name="di-company-name"]')?.value).toBe('Example Carrier');
    expect(renderToStaticMarkup(renderDisabilityCompanySummary({}))).not.toContain('undefined');
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('resolves cross-page Membership outcomes using the owning effective field metadata', () => {
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'cross-page-condition');
  installPrototypeLibrary(library);
  const foreignFields = library.site.configuration.pages.find(page => page.key === 'eligibility')!.fields.filter(field => field.included).map(field => field.definition);
  expect(evaluateConditionDefinition('condition-requirements-membership-follow-up', { membership: 'yes' }, foreignFields)).toBe(true);
  expect(evaluateConditionDefinition('condition-requirements-membership-follow-up', { membership: 'no' }, foreignFields)).toBe(false);
  // A changed option outcome must propagate without copying Membership options
  // into Eligibility or adding Site-specific condition logic.
  const source = structuredClone(freshStartSource());
  const details = source.fields.fieldDetails as { fields: Array<{ id: string; configurations?: Record<string, { options?: Array<{ value: string; outcome?: string }> }> }> };
  details.fields.find(field => field.id === 'membership')!.configurations!['yes-no'].options!.find(option => option.value === 'yes')!.outcome = 'not-eligible';
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'changed-cross-page-condition', source));
  expect(evaluateConditionDefinition('condition-requirements-membership-follow-up', { membership: 'yes' }, foreignFields)).toBe(false);
});
