import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import HealthTele from './HealthTele';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { healthPageScenario } from '../../.storybook/healthPageScenario';
import { validateHealthPage } from '../config/healthFollowUps';
import { getPageCollectionDefaults } from '../app/RoutePage';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
let baseline: PrototypeLibrary;
beforeAll(() => {
  baseline = resolvePrototypeLibrary(catalog.data, 'asce', 'health-life-test');
});
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
function setup(spouse = false) {
  window.history.replaceState(null, '', '/health-tele?site=asce');
  const scenario = healthPageScenario('li', spouse);
  const fixture = buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, undefined, undefined, undefined, undefined, scenario.health);
  installPrototypeLibrary(fixture);
  form.values = scenario.values;
  return fixture;
}

it('restores separate adult answers and condition records from page-owned collections', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  setup(true);
  form.values = { ...form.values, 'health-li-q1': 'yes', 'health-li-q1-spouse': 'no', 'health-li-q1-details': [{ onset: '01/2020', conditionsDetails: 'Saved local treatment record', physicianAddress: '' }] };
  expect(getPageCollectionDefaults('health-tele', form.values)['health-li-q1-details']).toEqual(form.values['health-li-q1-details']);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><HealthTele /></MemoryRouter>));
    expect(container.querySelectorAll('[data-health-question]')).toHaveLength(15);
    expect(container.querySelector<HTMLInputElement>('input[name="health-li-q1"][value="yes"]')?.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="health-li-q1-spouse"][value="no"]')?.checked).toBe(true);
    expect(container.querySelector('[data-health-question="health-li-q1"] [data-health-applicant="self"]')?.textContent).toContain('Saved local treatment record');
    expect(container.querySelector('[data-health-question="health-li-q1"] [data-health-applicant="spouse"]')?.textContent).not.toContain('Saved local treatment record');
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(baseline.site.configuration.pages.find(page => page.key === 'health-tele')!.requirement).toBe('required');
});

it('validates active answers and restored detail records using the shared field definitions', () => {
  setup();
  const values = { ...form.values, ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`health-li-q${i + 1}`, 'no'])) };
  const validate = (patch: Record<string, unknown>) => validateHealthPage('health-tele', { ...values, ...patch } as never);
  expect(validate({})).toBeUndefined();
  expect(validate({ 'health-li-q1': '' })).toContain('Answer');
  expect(validate({ 'health-li-q1': 'yes' })).toContain('Add details');
  const row = { onset: '01/2020', conditionsDetails: 'Saved treatment' }; // Physician is optional for Life.
  expect(validate({ 'health-li-q1': 'yes', 'health-li-q1-details': [row] })).toBeUndefined();
  expect(validate({ 'health-li-q1': 'yes', 'health-li-q1-details': [{ ...row, onset: '13/2020' }] })).toContain('valid month');
  expect(validate({ 'health-li-q1': 'yes', 'health-li-q1-details': Array(11).fill(row) })).toContain('at most 10');
  expect(validate({ 'health-li-q1': 'no', 'health-li-q1-details': [{}] })).toBeUndefined();
});

it('blocks an invalid assigned questionnaire instead of using the default questions', () => {
  const fixture = setup();
  fixture.site.configuration.healthQuestionnairePolicies.push({ value: { version: 1, pageId: 'health-tele', variants: [] }, fields: [] } as never);
  expect(validateHealthPage('health-tele', form.values as never)).toBe('No unique valid health questionnaire is assigned.');
});
