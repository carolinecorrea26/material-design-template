import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as library from '../../domain/prototypeLibrary';
import residentialMeta, { Default as residential } from '../../components/contact/ResidentialAddress.stories';
import businessMeta, { Default as business } from '../../components/contact/BusinessInformation.stories';
import spouseMeta, { Default as spouse } from '../../components/contact/SpouseContact.stories';
import personalMeta, { IndependentApplicants } from '../../components/profile/ProfilePersonalInformation.stories';
import addressMeta, { MappedPhysicianAddresses } from '../../components/forms/AddressFields.stories';
import reviewMeta, { MemberAndSpouse as ReviewMemberAndSpouse } from '../../components/review/ReviewSections.stories';
import { WithEditButtons } from '../../components/content/ApplicationDocumentPreview.stories';
import { Default as LegalSection } from '../../components/content/LegalReviewSection.stories';
import profileMeta, { PersonalInformation, OtherCoverage, FinancialQuestionnaire, SpouseInformation } from '../../components/profile/ProfileSections.stories';
import physicianMeta, { Default as physician } from '../../components/forms/PhysicianInformation.stories';
import memberMeta, { Default as member } from '../../components/membership/MemberInformation.stories';

vi.mock('../../persistence/sharedCatalog', async original => {
  const source = await original<typeof import('../../persistence/sharedCatalog')>();
  const { readFileSync } = await import('node:fs');
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  return { ...source, readSharedCatalog: async () => catalog };
});
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each([
  ['Residential address', residentialMeta, residential, 'street-address'],
  ['Business information', businessMeta, business, 'business-address-same-as-home'],
  ['Spouse contact', spouseMeta, spouse, 'spouse-phone'],
  ['Member information', memberMeta, member, 'first-name'],
  ['Profile personal information', profileMeta, PersonalInformation, 'height-feet'],
  ['Profile other coverage', profileMeta, OtherCoverage, 'has-other-life-insurance'],
  ['Profile questionnaire', profileMeta, FinancialQuestionnaire, 'total-net-worth'],
  ['Profile spouse', profileMeta, SpouseInformation, 'spouse-height-feet'],
  ['Physician fields', physicianMeta, physician, 'physician-first-name'],
  ['Independent personal fields', personalMeta, IndependentApplicants, 'spouse-height-feet'],
  ['Mapped physician addresses', addressMeta, MappedPhysicianAddresses, 'spouse-medical-facility-street-address'],
  ['Review adult consent', reviewMeta, ReviewMemberAndSpouse, 'review-spouse-consent'],
] as const)('renders the actual %s story without installing a Site', async (_name, meta, story, field) => {
  expect(meta.parameters.standalone).toBe(true);
  const installed = vi.spyOn(library, 'installPrototypeLibrary');
  const previous = library.getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  try {
    const render = story.render as unknown as (args: object, context: object) => ReactNode;
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    expect(container.querySelector(`input[name="${field}"]`)).not.toBeNull();
    expect(installed).not.toHaveBeenCalled();
    expect(library.getPrototypeLibrary()).toBe(previous);
    if (field === 'business-address-same-as-home') {
      await act(async () => container.querySelector<HTMLInputElement>(`input[name="${field}"]`)!.click());
      expect(container.querySelector<HTMLInputElement>('input[name="business-street-address"]')?.value).toBe('100 Example Street');
    }
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('keeps personal follow-ups independent between member and spouse in the reusable composition', async () => {
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  try {
    const render = IndependentApplicants.render as unknown as (args: object, context: object) => ReactNode;
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    const input = (id: string) => container.querySelector(`input[name="${id}"]`);
    expect(input('drivers-license-number')).toBeNull();
    expect(input('spouse-drivers-license-number')).toBeNull();
    await act(async () => container.querySelector<HTMLInputElement>('input[name="has-drivers-license"][value="yes"]')!.click());
    expect(input('drivers-license-number')).not.toBeNull();
    expect(input('spouse-drivers-license-number')).toBeNull();
    await act(async () => container.querySelector<HTMLInputElement>('input[name="spouse-travel-outside-us-six-months"][value="yes"]')!.click());
    expect(input('spouse-travel-outside-us-country')).not.toBeNull();
    expect(input('travel-outside-us-country')).toBeNull();
    expect(input('drivers-license-number')).not.toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('restores mapped physician addresses into distinct member and spouse bindings', async () => {
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  try {
    const render = MappedPhysicianAddresses.render as unknown as (args: object, context: object) => ReactNode;
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    expect(container.querySelector<HTMLInputElement>('input[name="medical-facility-street-address"]')?.value).toBe('100 Example Clinic Road');
    expect(container.querySelector<HTMLInputElement>('input[name="spouse-medical-facility-street-address"]')?.value).toBe('200 Other Clinic Road');
    expect(container.querySelector('input[name="street-address"]')).toBeNull();
    for (const prefix of ['', 'spouse-']) for (const id of ['medical-city', 'medical-state', 'medical-zip-code']) expect(container.querySelector(`[name="${prefix}${id}"]`)).not.toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('invokes document edit and disclosure Print callbacks in their standalone examples', async () => {
  const installed = vi.spyOn(library, 'installPrototypeLibrary');
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  try {
    const render = (story: { render?: unknown; args?: object }) => (story.render as (args: object, context: object) => ReactNode)(story.args ?? {}, {});
    await act(async () => root.render(<MemoryRouter>{render(WithEditButtons)}</MemoryRouter>));
    const edit = container.querySelector<HTMLButtonElement>('button[aria-label="Edit Membership"]')!;
    expect(edit).not.toBeNull();
    await act(async () => edit.click());
    expect(container.textContent).toContain('Edit requested: membership');
    await act(async () => root.render(<MemoryRouter>{render(LegalSection)}</MemoryRouter>));
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Print')!.click());
    expect(LegalSection.args?.onPrint).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain('Print callback requested.');
    expect(installed).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); container.remove(); }
});
