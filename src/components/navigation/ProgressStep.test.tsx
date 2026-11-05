import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProgressStep, { Breadcrumbs } from './ProgressStep';
import { ApplicationFormContext } from '../../app/ApplicationFormContext';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { SinglePageFlowContext } from '../../app/SinglePageFlowContext';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { prototypeCatalogData, type SharedCatalog } from '../../persistence/sharedCatalog';
import { withApplicantsApplying } from '../../utils/applicantsApplying';
import type { PageId } from '../../types';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as SharedCatalog;
const values = withApplicantsApplying({ membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', 'zip-postal-code': '22101', dependents: [], coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 } });
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  installPrototypeLibrary(resolvePrototypeLibrary(prototypeCatalogData(catalog), 'asce', 'navigation-state-test'));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });
function Location() { return <output>{useLocation().pathname}</output>; }
async function render(pageId: PageId = 'contact', flags: { reviewSubmitted?: boolean; advisorApplicantFlow?: boolean; navigationPending?: boolean } = {}) {
  await act(async () => root.render(<MemoryRouter initialEntries={['/contact']}>
    <ApplicationSessionContext.Provider value={{ reviewSubmitted: !!flags.reviewSubmitted, advisorApplicantFlow: !!flags.advisorApplicantFlow, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>
      <ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}>
        <SinglePageFlowContext.Provider value={flags.navigationPending ? { pageId, navigationPending: true, goToSection: () => {}, completeSection: () => {}, setNavigationPending: () => {} } : null}>
          <ProgressStep pageId={pageId}><Breadcrumbs pageId={pageId} /></ProgressStep><Location />
        </SinglePageFlowContext.Provider>
      </ApplicationFormContext.Provider>
    </ApplicationSessionContext.Provider>
  </MemoryRouter>));
}
const breadcrumbs = () => container.querySelector('[aria-label="Breadcrumbs"]')!;
it('shows completed, current and upcoming entries and lets only completed breadcrumbs navigate', async () => {
  await render();
  expect(container.querySelector('[aria-label="Main steps"] [aria-current="step"]')?.textContent).toContain('Your application details');
  expect(breadcrumbs().querySelector('[aria-current="page"]')?.textContent).toBe('Contact');
  const back = breadcrumbs().querySelector('button[aria-label="Go to Beneficiary"]') as HTMLButtonElement;
  expect(back).not.toBeNull();
  expect(back.querySelector('[data-testid="CheckCircleRoundedIcon"]')).not.toBeNull();
  expect(breadcrumbs().querySelector('[aria-label="Go to Profile"]')).toBeNull();
  expect(breadcrumbs().querySelector('[aria-current="page"] [data-testid="CheckCircleRoundedIcon"]')).toBeNull();
  await act(async () => back.click());
  expect(container.querySelector('output')?.textContent).toBe('/beneficiary');
});
it('shows no completed breadcrumb on the first page and all earlier entries completed on the last', async () => {
  await render('beneficiary');
  expect(breadcrumbs().querySelectorAll('button')).toHaveLength(0);
  expect(breadcrumbs().querySelectorAll('[data-testid="CheckCircleRoundedIcon"]')).toHaveLength(0);
  await render('profile');
  expect(breadcrumbs().querySelectorAll('button')).toHaveLength(2);
  expect(breadcrumbs().querySelector('[aria-current="page"]')?.textContent).toBe('Profile');
});
it.each([{ reviewSubmitted: true }, { advisorApplicantFlow: true }])('keeps completed indicators but locks navigation for %j', async flags => {
  await render('contact', flags);
  expect(breadcrumbs().querySelectorAll('button')).toHaveLength(0);
  expect(breadcrumbs().querySelector('[data-testid="CheckCircleRoundedIcon"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Main steps"] button')).toBeNull();
});
it('temporarily locks breadcrumb navigation while a section transition is pending', async () => {
  await render('contact', { navigationPending: true });
  expect(breadcrumbs().querySelectorAll('button')).toHaveLength(0);
  expect(breadcrumbs().querySelector('[aria-current="page"]')?.textContent).toBe('Contact');
});
it('hides breadcrumbs for a main step with one page and restores them for a multi-page step', async () => {
  await render('coverage');
  expect(breadcrumbs()).toBeNull();
  expect(container.querySelector('[aria-label="Main steps"]')).not.toBeNull();
  await render('contact');
  expect(breadcrumbs()).not.toBeNull();
});
it('clears transient completion on reset and when the page changes', async () => {
  await render();
  const mark = async (detail: PageId | null) => act(async () => { window.dispatchEvent(new CustomEvent('form:pendingbreadcrumbcompletion', { detail })); });
  const currentCheck = () => breadcrumbs().querySelector('[aria-current="page"] [data-testid="CheckCircleRoundedIcon"]');
  await mark('contact'); expect(currentCheck()).not.toBeNull();
  await mark(null); expect(currentCheck()).toBeNull();
  await mark('contact'); await render('profile'); expect(currentCheck()).toBeNull();
  await render('contact'); expect(currentCheck()).toBeNull();
});
