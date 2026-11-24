import { sendReceiptMockEmail } from '../utils/mockEmail';
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import Contact from './Contact';
import Eligibility from './Eligibility';
import Profile from './Profile';
import Review from './Review';
import Receipt from './Receipt';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, setPageValues: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ reviewSubmitted: false, advisorApplicantFlow: false, setAdvisorApplicantFlow: vi.fn(), markReviewSubmitted: vi.fn() }) }));
vi.mock('../utils/mockEmail', () => ({ sendReceiptMockEmail: vi.fn().mockResolvedValue(undefined) }));
const base = { 'has-other-life-insurance': 'no', qdDecisions: { 'li-term:member': 'conditionally-approved' }, membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', dependents: ['child'], children: [{ 'child-first-name': 'Jamie', 'child-last-name': 'Mock', 'child-birth-date': '2016-01-01' }], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'child'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000, 'li-term:child': 10000 } };
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.mocked(sendReceiptMockEmail).mockResolvedValue(undefined);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); window.sessionStorage.clear(); window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'shared-section-test'));
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([['Contact', Contact], ['Profile', Profile], ['Review', Review]] as const)('%s uses application-wide dependent context without adding child/spouse form sections', async (_, Page) => {
  form.values = base;
  const render = () => root.render(<MemoryRouter><Page /></MemoryRouter>);
  await act(async () => render());
  expect(container.querySelector('[data-applicant-section="self"]')).not.toBeNull();
  expect(container.querySelector('[data-applicant-section="spouse"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).toBeNull();
  form.values = { ...base, dependents: ['spouse'], productApplicants: { 'li-term': ['member'], 'li-10yr': ['spouse'] } };
  await act(async () => render());
  expect(container.querySelector('[data-applicant-section="self"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="spouse"]')).toBeNull();
});

it.each([['Contact', Contact, true], ['Profile', Profile, false], ['Review', Review, true]] as const)('%s preserves only its applicable member-owner section in child-only coverage', async (_, Page, owner) => {
  form.values = { ...base, productApplicants: { 'li-term': ['child'] } };
  await act(async () => root.render(<MemoryRouter><Page /></MemoryRouter>));
  expect(!!container.querySelector('[data-applicant-section="self"]')).toBe(owner);
  expect(container.querySelector('[data-applicant-section="spouse"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).toBeNull();
  if (Page === Contact) expect(container.querySelector('input[name="street-address"]')).not.toBeNull();
  if (Page === Review) expect(container.querySelector('input[name="review-self-consent"]')).not.toBeNull();
});

it('Receipt keeps member labels across products and omits deselected dependent decisions', async () => {
  form.values = { ...base, coverageSelections: ['li-term', 'li-10yr'], productApplicants: { 'li-term': ['member'], 'li-10yr': ['child'] }, coverageAmounts: { 'li-term:member': 100000, 'li-10yr:child': 10000 } };
  await act(async () => root.render(<MemoryRouter><Receipt /></MemoryRouter>));
  expect(container.querySelector('[data-applicant-section="self"]')).not.toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).not.toBeNull();
  expect(container.querySelector('[data-applicant-section="spouse"]')).toBeNull();
  form.values = { ...form.values, dependents: [] };
  await act(async () => root.render(<MemoryRouter><Receipt /></MemoryRouter>));
  expect(container.querySelector('[data-applicant-section="self"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).toBeNull();
});

it('Eligibility shows only intended dependent headings before product elections', async () => {
  form.values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'PA', dependents: ['child'] };
  await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
  expect(container.querySelector('[data-applicant-section="self"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).not.toBeNull();
  form.values = { ...form.values, dependents: [] };
  await act(async () => root.render(<MemoryRouter><Eligibility /></MemoryRouter>));
  expect(container.querySelector('[data-applicant-section="self"]')).toBeNull();
  expect(container.querySelector('[data-applicant-section="child"]')).toBeNull();
});
