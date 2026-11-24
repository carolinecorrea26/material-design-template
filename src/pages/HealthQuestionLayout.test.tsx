import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { healthPageScenario } from '../../.storybook/healthPageScenario';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { installPrototypeLibrary } from '../domain/prototypeLibrary';
import { ApplicationFormContext } from '../app/ApplicationFormContext';
import { ApplicationSessionContext } from '../app/ApplicationSessionContext';
import HealthSi from './HealthSi';
import HealthTele from './HealthTele';
import HealthDiSupp from './HealthDiSupp';
import HealthCir from './HealthCir';
const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it.each([
  ['si', HealthSi, 5], ['li', HealthTele, 15], ['di', HealthDiSupp, 7],
  ['ci', HealthTele, 16], ['cir', HealthCir, 12],
] as const)('groups %s questions on one shared page with independent self/spouse controls', async (kind, Page, count) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const scenario = healthPageScenario(kind, true);
  installPrototypeLibrary(buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, undefined, undefined, undefined, undefined, scenario.health));
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><ApplicationFormContext.Provider value={{ values: scenario.values, setPageValues: () => {}, resetValues: () => {} }}><Page /></ApplicationFormContext.Provider></ApplicationSessionContext.Provider></MemoryRouter>));
    const questions = [...container.querySelectorAll('[data-health-question]')];
    expect(questions).toHaveLength(count);
    expect(questions[0].querySelector('h2')?.textContent).toBe('Question 1');
    expect(questions[1].querySelector('h2')?.textContent).toBe('Question 2');
    for (const question of questions) expect([...question.querySelectorAll('[data-health-applicant]')].map(section => section.getAttribute('aria-label'))).toEqual(['You', 'Your Spouse']);
    const member = questions[0].querySelector('[data-health-applicant="self"]')!;
    const spouse = questions[0].querySelector('[data-health-applicant="spouse"]')!;
    expect(member.querySelector('[role="radiogroup"]')?.getAttribute('aria-labelledby')).not.toBe(spouse.querySelector('[role="radiogroup"]')?.getAttribute('aria-labelledby'));
    const yes = member.querySelector<HTMLInputElement>('input[value="yes"]')!;
    await act(async () => yes.click());
    expect(yes.checked).toBe(true);
    expect(spouse.querySelector<HTMLInputElement>('input[value="yes"]')?.checked).toBe(false);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
