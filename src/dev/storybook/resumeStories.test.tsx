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
    if (['LinkRequestConfirmation', 'LinkConfirmationExpired'].includes(name)) {
      expect(submit).toBeNull();
      if (name === 'LinkRequestConfirmation') expect(container.textContent).toContain('returning.user@example.com');
      else expect(container.textContent).toContain('Your secure link has expired.');
      expect(container.querySelector('input[name="resume-email"]')).toBeNull();
      expect(container.textContent).toContain('Resend link');
    } else expect(submit).not.toBeNull();
    if (name === 'ExpiredMagicLink') {
      expect(container.querySelector('[role="alert"]')?.textContent).toContain('This link is no longer valid. Request another secure link below.');
      expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
      expect(submit.disabled).toBe(false);
    }
    if (name === 'AdvisorIdentity') {
      expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
      expect(container.querySelector('input[name="resume-phone"]')).not.toBeNull();
      expect(container.textContent).toContain('Enter your advisor email and phone');
      expect(container.querySelector<HTMLInputElement>('input[name="resume-email"]')?.value).toBe('');
    }
    if (name === 'EmailRequest') expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
    if (name === 'DeliveryMethod') {
      expect(container.querySelectorAll('input[type="radio"]').length).toBeGreaterThan(0);
      expect(submit.disabled).toBe(true);
    }
    if (name === 'PhoneCode') expect(container.textContent).toContain('(•••)•••1234');
    if (name === 'ExpiredCode') {
      expect(container.textContent).toContain('Your verification code has expired.');
      expect(container.querySelector<HTMLInputElement>('input[name="resume-security-code"]')?.disabled).toBe(true);
      expect(submit.disabled).toBe(true);
    }
    if (name === 'MfaSessionWarning') {
      expect(container.textContent).toContain('Your verification session is about to expire');
      expect(container.textContent).not.toContain('Keep session active');
      const key = Object.keys(sessionStorage).find(key => key.startsWith('resumeMfa:'))!;
      const handle = JSON.parse(sessionStorage.getItem(key)!);
      expect(handle.codeExpiresAt).toBeLessThanOrEqual(handle.sessionExpiresAt);
    }
    for (const [example, text] of [['LinkRequestLimit', 'maximum number of requests'], ['CodeRequestLimit', 'maximum number of resend attempts'], ['PhoneAttemptLock', 'maximum number of phone code attempts']]) if (name === example) {
      expect(container.textContent).toContain(text);
      expect(submit.disabled).toBe(true);
      expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
    }
    expect(request).not.toHaveBeenCalled();
    expect(JSON.stringify(catalog)).toBe(original);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
  expect(getPrototypeLibrary()).toBe(previous);
});
