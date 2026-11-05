import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import * as stories from '../../components/feedback/ResumePage.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each(Object.entries(stories).filter(([key]) => key !== 'default'))('renders Resume %s with real fields and cleans up its fixture', async (name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', '');
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  const previous = getPrototypeLibrary();
  const original = JSON.stringify(catalog);
  const container = document.createElement('div');
  const root = createRoot(container);
  document.body.append(container);
  const render = stories.default.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render((story as typeof stories.EmailRequest).args!, { id: name, loaded: { catalog } })}</MemoryRouter>));
    expect(container.querySelectorAll('h2')).toHaveLength(1);
    const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit).not.toBeNull();
    if (name === 'EmailRequest') expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
    if (name === 'DeliveryMethod') {
      expect(container.querySelectorAll('input[type="radio"]').length).toBeGreaterThan(0);
      expect(submit.disabled).toBe(true);
    }
    if (name.startsWith('Missing')) {
      expect(container.textContent).toContain('Open a valid');
      expect(submit.disabled).toBe(true);
    }
    if (name === 'EmailCode') expect(container.textContent).toContain('returning.user@example.com');
    if (name === 'PhoneCode') expect(container.textContent).toContain('***-***-1234');
    if (name === 'ExpiredCode') {
      expect(container.textContent).toContain('Your verification code has expired.');
      expect(container.querySelector<HTMLInputElement>('input[name="resume-security-code"]')?.disabled).toBe(true);
      expect(submit.disabled).toBe(true);
    }
    expect(request).not.toHaveBeenCalled();
    expect(JSON.stringify(catalog)).toBe(original);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
  expect(getPrototypeLibrary()).toBe(previous);
});
