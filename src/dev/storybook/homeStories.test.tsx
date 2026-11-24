import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { Default, EntryNotice } from '../../components/home/HomePage.stories';
import { LandingNotice } from '../../components/home/HomeDialogs.stories';
import { StandardQuote } from '../../components/home/HomeHero.stories';

vi.mock('../../persistence/sharedCatalog', async original => {
  const source = await original<typeof import('../../persistence/sharedCatalog')>();
  const { readFileSync } = await import('node:fs');
  return { ...source, readSharedCatalog: async () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) };
});

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each([['Default', Default, false], ['Entry notice', EntryNotice, true], ['Landing notice overlay', LandingNotice, true]] as const)('renders Home %s with the configured entry behavior', async (name, story, hasNotice) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary(), before = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}>{render({}, { id: name, loaded: { catalog } })}</ApplicationSessionContext.Provider></MemoryRouter>));
    expect(container.querySelector('input[name="home-birth-date"]')).not.toBeNull();
    if (name === 'Landing notice overlay') {
      const play = LandingNotice.play as unknown as (context: { canvasElement: HTMLElement }) => Promise<void>;
      await act(async () => play({ canvasElement: container }));
    } else await act(async () => container.querySelector<HTMLAnchorElement>('a[href*="/membership"]')!.click());
    if (hasNotice) {
      expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Example entry information');
      await act(async () => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(button => button.textContent === 'Continue')!.click());
    } else expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain('The application would now open /membership');
    expect(JSON.stringify(catalog)).toBe(before);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});

it('uses compiled quote eligibility in the standalone Hero without imposing a separate age-80 limit', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary();
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = StandardQuote.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, {})}</MemoryRouter>));
    const enter = async (id: string, value: string) => {
      await act(async () => {
        const input = container.querySelector<HTMLInputElement>(`input[name="home-${id}"]`)!;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    await enter('zip-postal-code', '10001');
    await enter('birth-date', '01/01/1930');
    expect(container.querySelector<HTMLInputElement>('input[name="home-state-province"]')?.value).toBe('New York');
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'See my quote')!.click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 650)); });
    expect(container.textContent).toContain('Quote requested.');
    expect(getPrototypeLibrary()).toBe(previous);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
