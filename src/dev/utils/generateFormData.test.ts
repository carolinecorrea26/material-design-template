import { buildPrototypeScenario, scenarioProducts } from './prototypeScenarios';
import { getIsDevMode } from '../devMode';
import { freshStartSource } from '../../domain/freshStartCatalog';
import { noEligibleProductsMessage, validateCoverageSubmission } from '../../domain/coverageRuntime';
import { readQdDecisionResult } from '../../utils/coverageDecisions';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../../requirements/global/prototype-fixtures/autofill.json', async original => {
  const module = await original<{ default: { fieldValues: Record<string, unknown> } }>();
  return { default: { ...module.default, fieldValues: { ...module.default.fieldValues, 'first-name': 'JSON preview applicant' } } };
});
import { generateFormDataUpToPage, getDefaultValueForField } from './generateFormData';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { buildGlobalTemplate } from '../storybook/globalTemplate';
import { paymentSelectionAllowed } from '../../domain/paymentPolicy';
import { resolveCoverageJourneyPolicy } from '../../domain/coverageJourneyPolicy';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); vi.useRealTimers(); sessionStorage.clear(); window.history.replaceState(null, '', '/'); });

it('propagates JSON preview answers through the actual page generator', () => {
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'autofill-source'));
  expect(generateFormDataUpToPage('contact')['first-name']).toBe('JSON preview applicant');
});

it('honors effective defaults and choices instead of invalid fictional preferences', () => {
  const field = { id: 'gender', inputType: 'radio' as const, options: [{ value: 'female', label: 'Configured option' }] };
  expect(getDefaultValueForField(field)).toBe('female');
  expect(getDefaultValueForField({ ...field, defaultValue: 'female' })).toBe('female');
  expect(getDefaultValueForField({ id: 'new-flag', inputType: 'checkbox', defaultValue: false })).toBe(false);
  expect(getDefaultValueForField({ ...field, inputType: 'multi-select', defaultValue: ['male', 'female'] })).toEqual(['female']);
  expect(getDefaultValueForField({ ...field, options: [] })).toBe('');
  expect(getDefaultValueForField({ id: 'new-identifier', inputType: 'text', format: 'digits', minLength: 8, maxLength: 8 })).toBe('11111111');
});

it('derives fictional birth dates from the JSON age rule without a captured calendar year', () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2030-11-18T18:00:00Z'));
  expect(getDefaultValueForField({ id: 'birth-date', inputType: 'date' })).toBe('1995-01-15');
  expect(getDefaultValueForField({ id: 'birth-date', inputType: 'date', defaultValue: '1990-05-21' })).toBe('1990-05-21');
});

it('uses effective payment choices and annual field values instead of forcing bank/monthly samples', () => {
  const library = buildGlobalTemplate(catalog, 'standard', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, { products: { 'li-term': { collection: 'required', methods: [{ method: 'bill-me', frequencies: ['annual'] }], defaultMethod: 'bill-me', defaultFrequency: 'annual', frequencyLocked: true, synchronizeAcrossProducts: false } } });
  installPrototypeLibrary(library);
  const values = generateFormDataUpToPage('payment');
  expect(values['bank-routing-number']).toBe('021000021');
  expect(values['bank-account-number']).toBe('123456789');
  expect(values).not.toHaveProperty('payment-routing-number');
  expect(values['payment-method:li-term']).toBe('bill-me');
  expect(values['payment-frequency:li-term']).toBe('annually');
  expect(paymentSelectionAllowed(resolveCoverageJourneyPolicy(library.site, 'li-term')!.payment, 'bill-me', 'annual')).toBe(true);
});

it('enables internal tools on every effective Site and honors an explicit off value', () => {
  for (const site of Object.keys(freshStartSource().fields.sites)) {
    window.history.replaceState(null, '', `/?site=${site}&dev`);
    expect(getIsDevMode()).toBe(true);
  }
  window.history.replaceState(null, '', '/?dev=false');
  expect(getIsDevMode()).toBe(false);
});
it('builds applicant scenarios from each Site offering without stale products or unsupported dependents', () => {
  for (const key of Object.keys(freshStartSource().fields.sites)) {
    window.history.replaceState(null, '', `/?site=${key}&dev`);
    const library = resolvePrototypeLibrary(catalog.data, key, 'dev-scenarios'); installPrototypeLibrary(library);
    for (const scenario of ['member', 'member-spouse', 'member-child', 'household'] as const) {
      const product = scenarioProducts(library, scenario)[0];
      if (!product) continue;
      const values = buildPrototypeScenario(library, scenario, product.id);
      expect(values.coverageSelections, key).toEqual([product.id]);
      expect(validateCoverageSubmission(library.products, values), `${key}/${scenario}/${product.id}`).toBeUndefined();
    }
  }
}, 60000);

it('uses the shared validators and supported outcomes for internal error and Receipt scenarios', () => {
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'scenario-errors'); installPrototypeLibrary(library);
  expect(noEligibleProductsMessage(library.products, buildPrototypeScenario(library, 'no-products'))).toContain(library.client.support.email);
  expect(validateCoverageSubmission(library.products, buildPrototypeScenario(library, 'amount-error'))).toBeTruthy();
  expect(buildPrototypeScenario(library, 'required-error')['first-name']).toBe('');
  for (const [id, outcome] of [['receipt-approved', 'conditionally-approved'], ['receipt-referred', 'referred'], ['receipt-declined', 'soft-declined']] as const) {
    const product = scenarioProducts(library, id)[0];
    expect(readQdDecisionResult(buildPrototypeScenario(library, id, product.id), product.id, 'member')).toBe(outcome);
  }
});

it('uses the runtime entry offering for scenarios, mixed products and retained campaign restrictions', () => {
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'entry-scenarios'); installPrototypeLibrary(library);
  sessionStorage.clear();
  window.history.replaceState(null, '', '/?site=asce&dev&applicant=member&category=LI');
  expect(scenarioProducts(library, 'household')).toEqual([]);
  expect(scenarioProducts(library, 'member-spouse')).toEqual([]);
  expect(scenarioProducts(library, 'mixed-products')).toEqual([]);
  expect(() => buildPrototypeScenario(library, 'household')).toThrow('no matching product');
  const choices = scenarioProducts(library, 'member');
  expect(choices.length).toBeGreaterThan(0);
  expect(choices.every(product => product.categoryId === 'LI' && product.applicants.join(',') === 'member')).toBe(true);
  window.history.replaceState(null, '', '/coverage?site=asce&dev');
  expect(scenarioProducts(library, 'member-child')).toEqual([]);
  expect(scenarioProducts(library, 'member').map(product => product.id)).toEqual(choices.map(product => product.id));
  const values = buildPrototypeScenario(library, 'member', choices[0].id);
  expect(validateCoverageSubmission(choices, values)).toBeUndefined();
});
