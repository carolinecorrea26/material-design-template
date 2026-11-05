import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApplicationFormContext } from '../app/ApplicationFormContext';
import { MESSAGE_DURATION } from '../config/transitionMessages';
import Profile from './Profile';

vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
// This integration checks the handoff and real form navigation; questionnaire
// validation is covered by Profile's field/collection tests.
vi.mock('../config/clientFields/getClientPageFields', () => ({ getClientPageFields: () => [] }));
vi.mock('../config/pageSections', async original => ({ ...await original<typeof import('../config/pageSections')>(), getPageSections: () => [] }));
vi.mock('../config/client/getActiveClientCoverages', async original => ({ ...await original<typeof import('../config/client/getActiveClientCoverages')>(), getActiveClientCoverages: () => [] }));
vi.mock('../analytics/runtime', () => ({ attachPageAnalytics: () => () => {}, emitPageAnalytics: () => {} }));
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function Location() { return <output data-location>{useLocation().pathname}</output>; }
async function render(mode?: string) {
  await act(async () => root.render(<MemoryRouter initialEntries={['/profile']}><ApplicationFormContext.Provider value={{ values: { ...(mode ? { 'advisor-flow-type': mode } : {}), 'first-name': 'Jordan', 'last-name': 'Rivera', email: 'jordan@example.com' }, setPageValues: () => {}, resetValues: () => {}, saveApplication: async () => null }}><Profile /><Location /></ApplicationFormContext.Provider></MemoryRouter>));
}
const location = () => container.querySelector('[data-location]')?.textContent;
const submit = () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')].find(button => button.textContent === label)!;

it.each(['new', 'saved'])('hands an advisor %s application to the confirmation page after Send, with Cancel retaining Profile', async mode => {
  await render(mode); await submit();
  expect(location()).toBe('/profile');
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('jordan@example.com');
  await act(async () => button('Cancel').click());
  await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2));
  expect(location()).toBe('/profile');
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  await submit();
  await act(async () => button('Send').click());
  await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2));
  expect(location()).toBe('/advisor-send-confirmation');
});
it('continues a consumer application from Profile to Review without an advisor dialog', async () => {
  await render(); await submit();
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(MESSAGE_DURATION * 2));
  expect(location()).toBe('/review');
});
