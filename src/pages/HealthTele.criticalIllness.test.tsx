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
import { validateHealthPage } from '../config/healthFollowUps';
import HealthTele from './HealthTele';

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
it('renders spouse-only CI questions inside TELE without adding member answers or another tobacco control', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/health-tele?site=storybook-template');
  const catalog = validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
  const scenario = healthPageScenario('ci', true);
  installPrototypeLibrary(buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, undefined, undefined, undefined, undefined, undefined, scenario.health));
  const values = { ...scenario.values, productApplicants: { 'li-term': ['spouse'] } };
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><HealthTele /></ApplicationFormContext.Provider></ApplicationSessionContext.Provider></MemoryRouter>));
    expect(container.querySelectorAll('[data-health-question]')).toHaveLength(16);
    expect(container.querySelectorAll('[data-health-applicant="self"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-health-applicant="spouse"]')).toHaveLength(16);
    expect(container.querySelector('[name="smoker"], [name="spouse-smoker"]')).toBeNull();
    expect(validateHealthPage('health-tele', values)).toBeDefined();
  } finally { await act(async () => root.unmount()); container.remove(); }
});
