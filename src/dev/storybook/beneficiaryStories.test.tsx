import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Beneficiary from '../../pages/Beneficiary';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { beneficiaryScenarios } from '../../../.storybook/beneficiaryScenarios';
import { ApplicationSessionProvider } from '../../app/ApplicationSessionContext';
import { buildGlobalTemplate } from './globalTemplate';
import { freshStartSource } from '../../domain/freshStartCatalog';
import { beneficiaryStoredValues, beneficiarySemanticValues } from '../../config/fields/storedSurfaces';
import { resolvePrototypeLibrary, installPrototypeLibrary } from '../../domain/prototypeLibrary';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.useFakeTimers(); window.sessionStorage.clear();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each(Object.entries(beneficiaryScenarios))('uses supported fresh-start products and page settings: %s', (_name, scenario) => {
  const library = buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, 'beneficiary' in scenario ? scenario.beneficiary : undefined);
  const selected = scenario.values.coverageSelections as string[];
  expect(selected.every(id => library.products.some(product => product.id === id))).toBe(true);
  expect(library.site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('beneficiary' in scenario ? scenario.beneficiary.requirement : 'optional');
});
it('renders the default optional page from source and continues after No', async () => {
  await act(async () => root.render(<MemoryRouter initialEntries={['/beneficiary']}><ApplicationSessionProvider><ApplicationPageExample catalog={catalog} scenario={beneficiaryScenarios.optional}><Beneficiary /></ApplicationPageExample></ApplicationSessionProvider></MemoryRouter>));
  const option = container.querySelector<HTMLInputElement>('input[name="beneficiary-information-opt-in"][value="no"]');
  expect(option).not.toBeNull();
  await act(async () => option!.click());
  expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  const next = [...container.querySelectorAll('button')].find(button => button.textContent === 'Next')!;
  await act(async () => next.click()); await act(async () => vi.advanceTimersByTimeAsync(10000));
  expect(container.textContent).toContain('The application would now open');
});

it('stores only authored record bindings while restoring semantic display values', () => {
  const source = structuredClone(freshStartSource());
  source.pages.beneficiary.surfaces!.beneficiaryIndividual.definition!.fields[0].valueKey = 'givenName';
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'beneficiary-binding-check', source);
  installPrototypeLibrary(library);
  const stored = beneficiaryStoredValues({ id: 'record', designation: 'primary', beneficiaryType: 'individual', firstName: 'Alex', lastName: 'Example', relationship: 'Sibling', share: 50, trustName: 'Inactive trust data' });
  expect(stored).toMatchObject({ givenName: 'Alex', lastName: 'Example', share: 50 });
  expect(stored).not.toHaveProperty('firstName');
  expect(stored).not.toHaveProperty('trustName');
  expect(beneficiarySemanticValues(stored)).toMatchObject({ firstName: 'Alex', share: 50 });
});
