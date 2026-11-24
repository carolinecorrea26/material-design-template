import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { ComponentContentContext } from './ComponentContentContext';
import QuickDecisionInfoBox from './QuickDecisionInfoBox';
afterEach(() => vi.unstubAllGlobals());

it.each([false, true])('animates the icon once when revealed and respects reduced motion (%s)', async reducedMotion => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') && reducedMotion, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  let callback!: IntersectionObserverCallback;
  const observe = vi.fn(), disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb; }
    observe = observe; disconnect = disconnect;
  });
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<QuickDecisionInfoBox animateOnReveal />));
    expect(host.querySelector('[data-notice-attention]')).toBeNull();
    if (reducedMotion) expect(observe).not.toHaveBeenCalled();
    else {
      expect(observe).toHaveBeenCalledOnce();
      await act(async () => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      expect(host.querySelector('[data-notice-attention="revealed"]')).not.toBeNull();
      expect(disconnect).toHaveBeenCalledOnce();
      await act(async () => host.querySelector<HTMLButtonElement>('button')!.click());
      expect(observe).toHaveBeenCalledOnce();
    }
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('uses supplied shared copy for availability and both expansion controls', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const { content } = resolvePrototypeLibrary(catalog.data, 'asce', 'quick-decision-content');
  Object.assign(content.help.quickDecision, { availability: 'Configured availability.', showMore: 'Read details', showLess: 'Hide details' });
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<ComponentContentContext value={content}><QuickDecisionInfoBox /></ComponentContentContext>));
    expect(container.textContent).toContain('Configured availability.');
    const button = container.querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent).toBe('Read details');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await act(async () => button.click());
    expect(button.textContent).toBe('Hide details');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain(content.help.quickDecision.intro);
    await act(async () => button.click());
    expect(button.textContent).toBe('Read details');
    expect(container.textContent).not.toContain(content.help.quickDecision.intro);
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
