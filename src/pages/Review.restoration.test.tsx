import { freshStartSource } from '../domain/freshStartCatalog';
import type { ReviewPolicy } from '../domain/reviewPolicy';
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
async function render(site: string, withNotice = false) {
  window.history.replaceState(null, '', `/?site=${site}`);
  const source = structuredClone(freshStartSource());
  const policy = source.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value as ReviewPolicy;
  if (withNotice) policy.blocks.push({
    key: 'synthetic-dividend', title: 'Dividend notice', paragraphs: ['Synthetic configured notice.'], placement: 'before-consent', listItems: ['Configured notice list item'],
    fields: ['dividend-acknowledgement', 'dividend-first-name', 'dividend-last-name', 'dividend-birth-date'],
    sourceReferences: ['Synthetic Review restoration test'],
  });
  const fixture = resolvePrototypeLibrary(db, site, 'review-restoration', source);
  installPrototypeLibrary(fixture);
  await act(async () => root.render(<MemoryRouter><Review /></MemoryRouter>));
}
it('restores separate member and spouse acknowledgements that have no saved scalar page placement', async () => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', dependents: ['spouse'], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 }, 'review-self-consent': true, 'review-spouse-consent': false };
  await render('asce');
  expect(container.querySelector('.MuiAlert-standardWarning')?.textContent).toContain("You're entering the final stages");
  expect(container.textContent).not.toContain('1. Preview your application');
  expect(container.textContent).not.toContain('2. Read and consent');
  expect([...container.querySelectorAll('button')].filter(button => button.textContent === 'Print')).toHaveLength(2);
  expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[name="review-spouse-consent"]')?.checked).toBe(false);
});
it('restores active policy block fields together with the member acknowledgement', async () => {
  form.values = { 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, 'review-self-consent': true, 'dividend-acknowledgement': true, 'dividend-first-name': 'Jordan', 'dividend-last-name': 'Morgan', 'dividend-birth-date': '1990-01-01' };
  await render('asce', true);
  expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-acknowledgement"]')?.checked).toBe(true);
  const readAndSign = container.querySelector('[data-legal-review-section="read-and-sign"]')!;
  expect(readAndSign.textContent).toContain('Configured notice list item');
  expect(readAndSign.textContent!.indexOf('Configured notice list item')).toBeLessThan(readAndSign.textContent!.indexOf('CONSENT:'));
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-first-name"]')?.value).toBe('Jordan');
  expect(container.querySelector<HTMLInputElement>('input[name="dividend-last-name"]')?.value).toBe('Morgan');
});

it.each([
  [{ 'li-term': ['member'], 'di-ltd': ['spouse'] }, false],
  [{ 'li-term': ['spouse'], 'di-ltd': ['member'] }, true],
])('requires the owner acknowledgement and only the actively applying spouse acknowledgement: %j', async (productApplicants, spouse) => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'spouse-birth-date': '1991-01-01', 'state-province': 'PA', dependents: ['spouse'], coverageSelections: ['li-term'], productApplicants, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 }, 'review-self-consent': true, 'review-spouse-consent': true };
  await render('asce');
  expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
  expect(container.querySelector('input[name="review-spouse-consent"]') !== null).toBe(spouse);
});

it('renders the inherited legal segments exactly once without duplicate base-content consent or authorization', async () => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } };
  await render('asce');
  const text = container.querySelector('[data-legal-review-section="read-and-sign"]')!.textContent!;
  expect(text.match(/AUTHORIZATION:/g)).toHaveLength(1);
  expect(text.match(/CONSENT:/g)).toHaveLength(1);
  expect(text.match(/FRAUD NOTICE:/g)).toHaveLength(1);
  expect(text.indexOf('FRAUD NOTICE:')).toBeLessThan(text.indexOf('CONSENT:'));
});

it('places the CT warning immediately above the owner acknowledgement for DI without an online health page', async () => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'CT', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } };
  await render('asce');
  const notice = container.querySelector('[data-review-block="connecticut-underwritten-notice"]')!;
  const acknowledgement = container.querySelector('input[name="review-self-consent"]')!;
  expect(notice).not.toBeNull();
  expect(notice.closest('[data-legal-review-section]')).toBeNull();
  expect(notice.nextElementSibling!.contains(acknowledgement)).toBe(true);
  expect(container.querySelector('[data-legal-review-section="read-and-sign"]')!.textContent).toContain('AUTHORIZATION:');
});
