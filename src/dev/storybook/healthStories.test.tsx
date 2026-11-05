import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as si from '../../components/health/HealthSiPage.stories';
import * as qd from '../../components/health/HealthQdPage.stories';
import * as li from '../../components/health/HealthLiPage.stories';
import * as di from '../../components/health/HealthDiPage.stories';
import * as ci from '../../components/health/HealthCiPage.stories';
import * as cir from '../../components/health/HealthCirPage.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
const cases = [
  ['SI', si, 5], ['Life', li, 15], ['Disability', di, 7],
  ['Critical Illness', ci, 16], ['Chronic Illness Rider', cir, 12],
] as const;

it.each(cases.flatMap(([label, stories, count]) => [
  { label: `${label} member`, story: stories.MemberOnly, count: Number(count), adults: false },
  { label: `${label} member and spouse`, story: stories.MemberAndSpouse, count: Number(count), adults: true },
]).concat([{ label: 'QuickDecision processing', story: qd.Processing, count: 0, adults: false }]))('renders $label with the real questions and restores the installed fixture', async ({ story, count, adults }) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const before = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container);
  document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: 'health-test', loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    expect([...container.querySelectorAll('button, [role="button"]')].filter(button => button.textContent === 'How is my health information used?')).toHaveLength(1);
    if (!count) {
      const chip = [...container.querySelectorAll<HTMLElement>('[role="button"]')].find(button => button.textContent === 'How is my health information used?')!;
      await act(async () => chip.click());
      expect(document.body.textContent).toContain('Your health information is only used to review your application');
      await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Close drawer"]')!.click());
    }
    expect(container.textContent).not.toMatch(/Unable to load health questions/);
    expect(container.querySelectorAll('[data-health-question]')).toHaveLength(count);
    if (count) {
      expect(container.querySelectorAll('[data-health-applicant="self"]')).toHaveLength(count);
      expect(container.querySelectorAll('[data-health-applicant="spouse"]')).toHaveLength(adults ? count : 0);
      const first = container.querySelector('[data-health-question]')!;
      const yes = first.querySelector<HTMLInputElement>('[data-health-applicant="self"] input[value="yes"]');
      if (yes) {
        await act(async () => yes.click());
        expect(yes.checked).toBe(true);
        expect(first.querySelector<HTMLInputElement>('[data-health-applicant="spouse"] input[value="yes"]')?.checked ?? false).toBe(false);
      }
    } else expect(container.textContent).toContain('QuickDecision');
    expect(JSON.stringify(catalog)).toBe(before);
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
  expect(getPrototypeLibrary()).toBe(previous);
});

it.each([
  ['full source Life', async () => (await import('../../components/health/HealthLiPage.stories')).FullSourceQuestionnaire, 0],
  ['supplemental DI', async () => (await import('../../components/health/HealthDiPage.stories')).SupplementalQuestionnaire, 8],
  ['California CI', async () => (await import('../../components/health/HealthCiPage.stories')).CaliforniaWording, 16],
] as const)('renders the configured %s page story', async (label, load, count) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const story = await load(); const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: label, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    const rendered = container.querySelectorAll('[data-health-question]').length;
    if (count) expect(rendered).toBe(count); else expect(rendered).toBeGreaterThan(15);
    if (label === 'California CI') { expect(container.textContent).toContain('Substance Abuse?'); expect(container.textContent).not.toContain('Alcoholism or drug habit?'); }
    expect(container.textContent).not.toContain('Unable to load health questions');
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
