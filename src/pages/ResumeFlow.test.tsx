import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Resume from './Resume';
import ResumeCode from './ResumeCode';
import ResumeMethod from './ResumeMethod';
import { applicantRecovery } from '../services/applicantSaveService';

const restore = vi.fn();
vi.mock('../services/applicantSaveService', () => ({ applicantRecovery: { request: vi.fn(), verify: vi.fn(), challenge: vi.fn(), outbox: vi.fn() }, readSavedApplication: () => null, recoveryFromSearch: () => ({ siteKey: 'asce', applicationId: 'saved', recipient: 'member@example.invalid', recoveryId: 'recovery', token: 'token' }) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => ({ restoreApplication: restore }) }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ resetApplicationSession: vi.fn() }) }));
vi.mock('../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../data/activeSite')>(), resolveSiteId: () => 'asce' }));
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  vi.useFakeTimers(); vi.clearAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllEnvs(); });
const input = async (value: string) => act(async () => {
  const field = container.querySelector('input')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
});
const submit = async () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
function LocationProbe() { const location = useLocation(); return <output>{location.pathname}:{JSON.stringify(location.state)}</output>; }

describe('restored resume flow', () => {
  it('keeps email-only entry, back navigation, and a disabled loading button', async () => {
    let complete!: (result: { applicationId: string; expiresAt: number }) => void;
    vi.mocked(applicantRecovery.request).mockReturnValue(new Promise(resolve => { complete = resolve; }));
    await act(async () => root.render(<MemoryRouter><Resume /></MemoryRouter>));
    expect(container.querySelectorAll('input')).toHaveLength(1);
    expect(container.querySelector('[aria-label="Go back"]')).not.toBeNull();
    await input('member@example.invalid'); await submit();
    expect(applicantRecovery.request).toHaveBeenCalledWith('', 'asce', 'member@example.invalid');
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    await act(async () => complete({ applicationId: 'saved', expiresAt: Date.now() + 600000 }));
    expect(container.textContent).toContain('A secure link has been sent');
    expect(container.textContent).toContain('Resend link');
  });
  it('restores Text and Call choices and disables Next until a method is selected', async () => {
    await act(async () => root.render(<MemoryRouter><ResumeMethod /></MemoryRouter>));
    expect(container.textContent).toContain('Text');
    expect(container.textContent).toContain('Call');
    expect(container.textContent).not.toContain('simulation');
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });
  it('shows the countdown, verifies the saved application, and shows the success check before navigation', async () => {
    let complete!: (result: never) => void;
    vi.mocked(applicantRecovery.verify).mockReturnValue(new Promise(resolve => { complete = resolve; }));
    await act(async () => root.render(<MemoryRouter initialEntries={['/resume-code?method=email']}><ResumeCode /><LocationProbe /></MemoryRouter>));
    expect(container.textContent).toContain('Code expires in');
    expect(container.textContent).toContain('Resend code');
    await input('123456'); await submit();
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(container.querySelector('[aria-label="Verifying code"]')).not.toBeNull();
    await act(async () => complete({ values: { email: 'member@example.invalid' } } as never));
    expect(restore).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Verified successfully"]')).not.toBeNull();
    expect(container.querySelector('output')?.textContent).toContain('/resume-code:');
    await act(async () => vi.advanceTimersByTime(1200));
    expect(container.querySelector('output')?.textContent).toContain('/eligibility:{"resumeLoaded":true}');
  });
});
