import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Resume from './Resume';
import ResumeCode from './ResumeCode';
import ResumeMethod from './ResumeMethod';
import { applicantRecovery } from '../services/applicantSaveService';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { fieldCatalogRows } from './admin/library/fieldCatalogRows';

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
afterEach(async () => { await act(async () => root.unmount()); installPrototypeLibrary(null); container.remove(); vi.useRealTimers(); vi.unstubAllEnvs(); });
const input = async (value: string) => act(async () => {
  const field = container.querySelector('input')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
});
const submit = async () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
function LocationProbe() { const location = useLocation(); return <output>{location.pathname}:{JSON.stringify(location.state)}</output>; }

describe('restored resume flow', () => {
  it('renders saved Resume labels and choices from the same field records as the Library', async () => {
    const data = createReviewedMigrationDatabase();
    const email = data.fields.find(field => field.key === 'resume-email')!;
    const method = data.fields.find(field => field.key === 'resume-delivery-method')!;
    const code = data.fields.find(field => field.key === 'resume-security-code')!;
    email.definition.label = 'Saved recovery email';
    method.definition.label = 'Saved delivery question';
    method.definition.options = [{ value: 'call', label: 'Saved phone call' }];
    code.definition.label = 'Saved recovery code'; code.definition.maxLength = 8;
    installPrototypeLibrary(resolvePrototypeLibrary(data, 'asce', 'saved-fields-test'));
    const catalog = fieldCatalogRows({ data, revision: 'saved-fields-test', analyticsTags: [] }, 'asce');
    for (const [Component, saved] of [[Resume, email], [ResumeMethod, method], [ResumeCode, code]] as const) {
      await act(async () => root.render(<MemoryRouter><Component /></MemoryRouter>));
      expect(container.textContent).toContain(catalog.find(field => field.key === saved.key)!.field.label);
      if (saved === method) {
        expect(container.textContent).toContain('Saved phone call');
        const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        expect(radios).toHaveLength(1);
        await act(async () => radios[0].click());
        expect(radios[0].checked).toBe(true);
      }
      if (saved === code) expect(container.querySelector('input')?.maxLength).toBe(8);
    }
  });
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
