import { readFileSync } from 'node:fs';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { healthPageScenario } from '../../.storybook/healthPageScenario';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary, installPrototypeLibrary } from '../domain/prototypeLibrary';
import { configuredHealthQuestionnaire } from '../domain/configuredHealthQuestionnaire';
import { getPageCollectionDefaults } from '../app/RoutePage';
import { ApplicationFormContext } from '../app/ApplicationFormContext';
import { ApplicationSessionContext } from '../app/ApplicationSessionContext';
import HealthTele from './HealthTele';

const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const fixture = (page: 'li' | 'ci') => {
  const scenario = healthPageScenario(page, true);
  const health = { ...scenario.health!, ...(page === 'li' ? { questionnaire: 'life' as const } : {}) };
  return buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, undefined, undefined, undefined, undefined, health);
};
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it('restores policy-generated member/spouse detail records in real controls and retains them through No/Yes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/health-tele?site=storybook-template');
  const library = fixture('li'); installPrototypeLibrary(library);
  const values: Record<string, any> = { membership: 'yes', state: 'PA', 'birth-date': '1986-01-01', 'spouse-birth-date': '1986-01-01', dependents: ['spouse'], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member','spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000 } };
  const questions = (['member','spouse'] as const).map(applicant => {
    const item = configuredHealthQuestionnaire(library.site, 'health-tele', applicant, values).items.find(item => item.repeated)!;
    expect(item).toBeDefined();
    values[item.question!.id] = 'yes';
    values[item.collection] = [Object.fromEntries(item.fields.map(field => [field.id, field.format === 'month-year' ? '01/2020' : field.inputType === 'date' ? '2020-01-01' : `Saved ${applicant} record`]))];
    return item;
  });
  const defaults = getPageCollectionDefaults('health-tele', values);
  for (const item of questions) expect(defaults[item.collection]).toEqual(values[item.collection]);
  expect(getPageCollectionDefaults('contact', values)).toEqual({});
  const saved = vi.fn(), container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><ApplicationFormContext.Provider value={{ values, setPageValues: saved, resetValues: () => {} }}><HealthTele /></ApplicationFormContext.Provider></ApplicationSessionContext.Provider></MemoryRouter>));
    expect(container.textContent).toContain('Saved member record'); expect(container.textContent).toContain('Saved spouse record');
    const member = questions[0];
    await act(async () => container.querySelector<HTMLInputElement>(`input[name="${member.question!.id}"][value="no"]`)!.click());
    expect(container.textContent).not.toContain('Saved member record'); expect(container.textContent).toContain('Saved spouse record');
    await act(async () => container.querySelector<HTMLInputElement>(`input[name="${member.question!.id}"][value="yes"]`)!.click());
    expect(container.textContent).toContain('Saved member record');
  } finally { await act(async () => root.unmount()); container.remove(); }
  for (const item of questions) expect(saved.mock.lastCall?.[0][item.collection]).toEqual(values[item.collection]);
  expect(getPrototypeLibrary()).toBe(library);
});

it('uses the configured California CI replacement with and without additional coverage', async () => {
  const library = fixture('ci');
  for (const combined of [false, true]) {
    const selected = combined ? ['li-term', 'di-ltd'] : ['li-term'];
    const values = { state: 'CA', coverageSelections: selected, productApplicants: Object.fromEntries(selected.map(key => [key, ['member']])) };
    const ca = configuredHealthQuestionnaire(library.site, 'health-tele', 'member', values);
    expect(ca.items).toHaveLength(16);
    expect(ca.items.some(item => item.question?.label.includes('Substance Abuse?'))).toBe(true);
    expect(ca.items.some(item => item.question?.label.includes('Alcoholism or drug habit?'))).toBe(false);
    const pa = configuredHealthQuestionnaire(library.site, 'health-tele', 'member', { ...values, state: 'PA' });
    expect(pa.items).toHaveLength(16);
    expect(pa.items.some(item => item.question?.label.includes('Alcoholism or drug habit?'))).toBe(true);
  }
});
