import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as si from '../../components/health/HealthSiPage.stories';
import * as qd from '../../components/health/HealthQdPage.stories';
import * as li from '../../components/health/HealthTelePage.stories';
import * as di from '../../components/health/HealthDiSuppPage.stories';
import * as cir from '../../components/health/HealthCirPage.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
const cases = [
  ['SI', si, 5], ['TELE', li, 15], ['DI SUPP', di, 7],
  ['Chronic Illness Rider', cir, 12],
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
    expect([...container.querySelectorAll('button, [role="button"]')].filter(button => button.textContent === 'How is my health information used?')).toHaveLength(0);
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
    } else expect(document.body.querySelector('[role="dialog"] img')?.getAttribute('alt')).toContain('QuickDecision');
    expect(JSON.stringify(catalog)).toBe(before);
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
  expect(getPrototypeLibrary()).toBe(previous);
});

it.each([
  ['Life', async () => (await import('../../components/health/HealthTelePage.stories')).FullSourceQuestionnaire, 2],
  ['restored TELE', async () => (await import('../../components/health/HealthTelePage.stories')).RestoredDetails, 15],
  ['supplemental DI', async () => (await import('../../components/health/HealthDiSuppPage.stories')).SupplementalQuestionnaire, 8],
  ['CI TELE', async () => (await import('../../components/health/HealthTelePage.stories')).CriticalIllnessQuestionnaire, 16],
  ['California CI', async () => (await import('../../components/health/HealthTelePage.stories')).CaliforniaWording, 16],
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
