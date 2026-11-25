import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Review from './Review';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';

const form = vi.hoisted(() => ({ values: {}, setPageValues: vi.fn(), saveApplication: vi.fn(async () => null) }));
const session = vi.hoisted(() => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: vi.fn(), markReviewSubmitted: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => session }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
// Exercise actual Review actions and form routing; coverage policy validation has its own matrix.
vi.mock('../domain/coverageRuntime', async original => ({ ...await original<typeof import('../domain/coverageRuntime')>(), validateApplicationCoverages: () => undefined }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root | undefined, host: HTMLDivElement;
function Location() { return <output data-location>{useLocation().pathname}</output>; }
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; host?.remove(); installPrototypeLibrary(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); window.sessionStorage.clear();
});
async function render(applicantWithAdvisor = false, query = '') {
  vi.useFakeTimers(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/review?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'review-workflow'));
  Object.assign(session, { reviewSubmitted: false, advisorApplicantFlow: applicantWithAdvisor });
  session.setAdvisorApplicantFlow.mockClear(); session.markReviewSubmitted.mockClear(); form.saveApplication.mockClear();
  form.values = { membership: 'yes', gender: 'female', smoker: 'no', 'birth-date': '1990-01-01', 'state-province': 'PA', 'first-name': 'Jordan', 'last-name': 'Morgan', email: 'jordan@example.invalid', 'advisor-email': 'advisor@example.invalid', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, 'review-self-consent': true };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter initialEntries={[`/review${query}`]}><Review /><Location /></MemoryRouter>));
}
const location = () => host.querySelector('[data-location]')?.textContent;
const dialogButton = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')].find(button => button.textContent === label)!;
async function edit() { await act(async () => host.querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!.click()); }

it('confirms a normal consumer edit and returns to the owning Membership page', async () => {
  await render(); await edit();
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('Edit your application');
  await act(async () => dialogButton('Yes').click());
  expect(location()).toBe('/membership');
});

it.each([true, false])('requests advisor corrections through the confirmation route (restored session: %s)', async restored => {
  await render(restored, restored ? '' : '?flow=advisor');
  expect(host.textContent).toContain('Your advisor has completed');
  expect(host.textContent).not.toContain('Steps completed by your advisor');
  if (!restored) expect(session.setAdvisorApplicantFlow).toHaveBeenCalledWith(true);
  await edit();
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('advisor@example.invalid');
  await act(async () => dialogButton('Send').click());
  expect(location()).toBe('/application-edit-confirmation');
});

it.each([false, true])('continues the applicant to the applicable health step after Review (advisor-prepared: %s)', async advisorPrepared => {
  await render(advisorPrepared);
  await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(session.markReviewSubmitted).toHaveBeenCalledOnce();
  expect(location()).toBe('/health-qd');
});
