import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import meta, { MultipleScreens, SingleScreen } from '../../components/feedback/PrototypeHandoffPage.stories';
import PrototypeHandoffPage from '../../components/feedback/PrototypeHandoffPage';
import defaults from '../../../requirements/global/prototype-fixtures/handoffs.json';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());

it.each([
  ['multiple screens', MultipleScreens, 'health-qd'], ['single screen', SingleScreen, 'docusign'],
] as const)('renders the actual canonical %s story from global defaults and restores its fixture', async (_label, story, page) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  expect(meta.component).toBe(PrototypeHandoffPage);
  const previous = getPrototypeLibrary();
  const original = JSON.stringify(catalog);
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render(story.args!, { id: `handoff-${page}`, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog().getAttribute('aria-label')).toBe(defaults[page][0].alt);
    expect(dialog().textContent).toContain(defaults[page][0].placeholder);
    expect(dialog().querySelector('img')).toBeNull();
    if (page === 'health-qd') {
      await act(async () => dialog().querySelector<HTMLButtonElement>('button[aria-busy]')!.click());
      expect(dialog().getAttribute('aria-label')).toBe(defaults[page][1].alt);
    }
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); host.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
