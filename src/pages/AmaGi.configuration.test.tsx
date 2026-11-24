import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import Membership from './Membership';
import Profile from './Profile';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import type { ApplicationFormValues } from '../app/ApplicationFormContext';
import { MESSAGE_DURATION } from '../config/transitionMessages';
const form = vi.hoisted(() => ({ values: {} as ApplicationFormValues, setPageValues: vi.fn(), setActiveAssociationId: vi.fn(), saveApplication: vi.fn(async () => null) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => null }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
let root: Root | undefined, host: HTMLDivElement;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; host?.remove(); installPrototypeLibrary(null); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); sessionStorage.clear(); });
async function render(page: 'membership' | 'profile') {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', `/${page}?site=ama-gi`);
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'ama-gi', 'ama-gi-page'));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(<MemoryRouter>{page === 'membership' ? <Membership /> : <Profile />}</MemoryRouter>));
  await act(async () => { await vi.advanceTimersByTimeAsync(MESSAGE_DURATION + 20); });
}
it.each(['student', 'spouse'])('renders the shared associated-student fields only for the %s membership path', async role => {
  form.values = { membership: role, 'ama-physician-first-name': 'RetainedStudentDraft' };
  await render('membership');
  if (role === 'spouse') expect(host.textContent).toContain('Medical Student Information');
  else expect(host.textContent).not.toContain('Medical Student Information');
  expect(host.textContent).not.toContain('Physician Information');
  expect(host.querySelector('[name="ama-physician-first-name"]') !== null).toBe(role === 'spouse');
  expect(host.querySelector('[name="ama-physician-title"]')).toBeNull();
  expect(host.querySelector('[name="ama-physician-type"]')).toBeNull();
  if (role === 'spouse') for (const id of ['ama-physician-first-name', 'ama-physician-last-name', 'ama-physician-birth-date', 'ama-physician-email']) expect(host.querySelector(`[name="${id}"]`), id).not.toBeNull();
  expect(form.values['ama-physician-first-name']).toBe('RetainedStudentDraft');
});
it('renders only SSN on Profile even with retained physician, other-coverage and financial answers', async () => {
  form.values = { membership: 'student', 'birth-date': '2000-01-01', 'state-province': 'IL', coverageSelections: ['li-term', 'di-short-term'], productApplicants: { 'li-term': ['member'], 'di-short-term': ['member'] }, coverageAmounts: { 'li-term:member': 50000, 'di-short-term:member': 1000 }, 'physician-first-name': 'RetainedDoctor', 'total-net-worth': '100000', 'has-other-life-insurance': 'yes' };
  await render('profile');
  const names = [...host.querySelectorAll<HTMLInputElement>('input[name]')].map(input => input.name);
  expect([...new Set(names)]).toEqual(['social-security-number']);
  for (const heading of ['Physician information', 'Other coverage', 'Financial questionnaire']) expect(host.textContent).not.toContain(heading);
  expect(host.querySelector('.FieldGrid-root:empty')).toBeNull();
});
