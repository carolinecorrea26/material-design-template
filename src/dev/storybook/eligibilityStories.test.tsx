import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { Member, MemberAndSpouse, MemberAndChild, NoticeOnlyChildren, ApplicantOnly } from '../../components/eligibility/EligibilityPage.stories';
import { AllowedResidencyOptions } from '../../components/eligibility/EligibilitySections.stories';
import { Empty, WithoutStudentQuestion, AdditionalChildQuestions } from '../../components/eligibility/EligibilityChildren.stories';

vi.mock('../../persistence/sharedCatalog', async original => {
  const source = await original<typeof import('../../persistence/sharedCatalog')>();
  const { readFileSync } = await import('node:fs');
  return { ...source, readSharedCatalog: async () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) };
});
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each([
  ['Member', Member, false, false, true],
  ['Spouse', MemberAndSpouse, true, false, true],
  ['Child', MemberAndChild, false, true, true],
  ['Notice', NoticeOnlyChildren, false, false, true],
  ['Applicant only', ApplicantOnly, false, false, false],
] as const)('renders effective Eligibility %s from compiled composition', async (name, story, spouse, children, dependents) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const before = JSON.stringify(catalog), previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: name, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    expect(container.querySelector('[name="zip-postal-code"]')).not.toBeNull();
    expect(!!container.querySelector('[data-analytics-field="dependents"]')).toBe(dependents);
    expect(!!container.querySelector('[name="spouse-first-name"]')).toBe(spouse);
    expect(container.textContent?.includes('Add Child')).toBe(children);
    if (name === 'Member') {
      await act(async () => container.querySelector<HTMLInputElement>('input[name="dependents"][value="spouse"]')!.click());
      expect(container.querySelector('[name="spouse-first-name"]')).not.toBeNull();
      await act(async () => container.querySelector<HTMLInputElement>('input[name="dependents"][value="spouse"]')!.click());
      expect(container.querySelector('[name="spouse-first-name"]')).toBeNull();
    }
    if (name === 'Notice') expect(container.textContent?.match(/Only unmarried children/g)).toHaveLength(1);
    expect(JSON.stringify(catalog)).toBe(before);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
it.each([['Student', Empty, true, false], ['Without student', WithoutStudentQuestion, false, false], ['Additional questions', AdditionalChildQuestions, true, true]] as const)('uses compiled child dialog fields: %s', async (_name, story, student, armedForces) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary(), container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as () => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render()}</MemoryRouter>));
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Add Child')!.click());
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('[name="child-first-name"]')).not.toBeNull();
    expect(!!dialog.querySelector('[name="child-full-time-student"]')).toBe(student);
    expect(!!dialog.querySelector('[name="child-active-military"]')).toBe(armedForces);
    expect(dialog.textContent).not.toContain('unmarried?');
    expect(getPrototypeLibrary()).toBe(previous);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
it('uses an effective eligible-state assignment in a detached section', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = AllowedResidencyOptions.render as unknown as () => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render()}</MemoryRouter>));
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Open"]')!.click());
    expect([...document.querySelectorAll('[role="option"]')].map(option => option.textContent)).toEqual(['California', 'New York']);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
