import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import Review from './Review';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import type { DatabaseSchema } from '../persistence/types';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: vi.fn(), markReviewSubmitted: vi.fn() }) }));
vi.mock('../app/SinglePageFlowContext', () => ({ useSinglePageFlow: () => ({ pageId: 'review', navigationPending: false, setNavigationPending: vi.fn(), completeSection: vi.fn(), goToSection: vi.fn() }) }));
let db: DatabaseSchema, root: Root, container: HTMLDivElement;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); });
async function render(site: string) {
  window.history.replaceState(null, '', `/?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(db, site, 'review-restoration'));
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
}
it('restores separate member and spouse acknowledgements that have no saved scalar page placement', async () => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', dependents: ['spouse'], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 }, 'review-self-consent': true, 'review-spouse-consent': false };
  await render('asce');
  expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[name="review-spouse-consent"]')?.checked).toBe(false);
});
it('restores active policy block fields together with the member acknowledgement', async () => {
  form.values = { 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, 'review-self-consent': true, 'dividend-acknowledgement': true, 'dividend-first-name': 'Jordan', 'dividend-last-name': 'Morgan', 'dividend-birth-date': '1990-01-01' };
  await render('abe');
  expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-acknowledgement"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-first-name"]')?.value).toBe('Jordan');
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-last-name"]')?.value).toBe('Morgan');
});
