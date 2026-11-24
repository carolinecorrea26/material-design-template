import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Resume from './Resume';
import ResumeCode from './ResumeCode';
import ResumeMethod from './ResumeMethod';
import { applicantRecovery, rememberResumeSession, resumeSessionQuery } from '../services/applicantSaveService';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { fieldCatalogRows } from './admin/library/fieldCatalogRows';
import { readFileSync } from 'node:fs';

const restore = vi.fn();
vi.mock('../services/applicantSaveService', async original => ({ ...await original<typeof import('../services/applicantSaveService')>(), applicantRecovery: { request: vi.fn(), verify: vi.fn(), challenge: vi.fn(), outbox: vi.fn() }, readSavedApplication: () => null, recoveryFromSearch: () => ({ siteKey: 'asce', applicationId: 'saved', recipient: 'member@example.invalid', recoveryId: 'recovery', token: 'token' }) }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => ({ restoreApplication: restore }) }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => ({ resetApplicationSession: vi.fn() }) }));
vi.mock('../data/activeSite', async importOriginal => ({ ...await importOriginal<typeof import('../data/activeSite')>(), resolveSiteId: () => 'asce' }));
let container: HTMLDivElement, root: Root;
const canonicalResume = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'resume-fresh-start');
beforeEach(() => {
  installPrototypeLibrary(structuredClone(canonicalResume));
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  vi.useFakeTimers(); vi.clearAllMocks(); sessionStorage.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); installPrototypeLibrary(null); container.remove(); vi.useRealTimers(); vi.unstubAllEnvs(); sessionStorage.clear(); });
const input = async (value: string) => act(async () => {
  const field = container.querySelector('input')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
});
const submit = async () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
function sessionPath(deliveryTarget = '(•••)•••1234') {
  const session = { siteKey: 'asce', applicationId: 'saved', recipient: 'member@example.invalid', sessionId: 'mfa', mfaToken: 'proof', sessionExpiresAt: Date.now() + 1800000, codeExpiresAt: Date.now() + 600000, deliveryTarget, method: 'text' as const, advisorFlow: false };
  rememberResumeSession(session); return '/resume-code?' + resumeSessionQuery(session);
}
function LocationProbe() { const location = useLocation(); return <output>{location.pathname}:{JSON.stringify(location.state)}</output>; }

describe('restored resume flow', () => {
  it.each([ResumeCode, ResumeMethod])('opens the shared expiration page when the MFA countdown reaches zero (%s)', async Component => {
    const path = sessionPath().replace('/resume-code', Component === ResumeCode ? '/resume-code' : '/resume-method');
    const key = Object.keys(sessionStorage).find(key => key.startsWith('resumeMfa:'))!;
    const session = JSON.parse(sessionStorage.getItem(key)!);
    session.sessionExpiresAt = Date.now() + 2000;
    session.codeExpiresAt = session.sessionExpiresAt;
    sessionStorage.setItem(key, JSON.stringify(session));
    await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Routes>
      <Route path="/resume-code" element={<ResumeCode />} />
      <Route path="/resume-method" element={<ResumeMethod />} />
      <Route path="/session-expired" element={<ErrorPage status="session-expired" />} />
    </Routes><LocationProbe /></MemoryRouter>));
    await act(async () => vi.advanceTimersByTimeAsync(2100));
    expect(container.querySelector('h1')?.textContent).toBe('Your session has timed out');
    expect(container.querySelector('output')?.textContent).toContain('/session-expired:');
    expect(container.querySelector('input')).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(applicantRecovery.request).not.toHaveBeenCalled();
    expect(applicantRecovery.challenge).not.toHaveBeenCalled();
    expect(applicantRecovery.verify).not.toHaveBeenCalled();
  });
  it('uses fresh Resume fields in both the page and Library despite stale saved records', async () => {
    const data = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data;
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
      await act(async () => root.render(<MemoryRouter key={saved.key} initialEntries={[Component === ResumeCode ? sessionPath() : '/']}><Component /></MemoryRouter>));
      expect(container.textContent).toContain(catalog.find(field => field.key === saved.key)!.field.label);
      if (saved === method) {
        expect(container.textContent).not.toContain('Saved phone call');
        const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        expect(radios).toHaveLength(2);
        await act(async () => radios[0].click());
        expect(radios[0].checked).toBe(true);
      }
      if (saved === code) expect(container.querySelector('input')?.maxLength).toBe(6);
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
  it('shows magic-link expiry on the email request page without a separate redirect or automatic request', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={['/resume']}><Resume initialError={{ kind: 'link' }} /><LocationProbe /></MemoryRouter>));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('This link is no longer valid. Request another secure link below.');
    expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    expect(container.querySelector('output')?.textContent).toContain('/resume:');
    expect(applicantRecovery.request).not.toHaveBeenCalled();
    vi.mocked(applicantRecovery.request).mockResolvedValue({ expiresAt: Date.now() + 600000 });
    await input('member@example.invalid'); await submit();
    expect(applicantRecovery.request).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('A secure link has been sent');
    expect(container.textContent).not.toContain('This link has expired');
  });
  it('restores Text and Call choices and disables Next until a method is selected', async () => {
    await act(async () => root.render(<MemoryRouter><ResumeMethod /></MemoryRouter>));
    expect(container.textContent).toContain('Text');
    expect(container.textContent).toContain('Call');
    expect(container.textContent).not.toContain('simulation');
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });
  it('uses configured method and saved-phone guidance instead of a placeholder phone number', async () => {
    const fixture = structuredClone(canonicalResume);
    fixture.content.pages['resume-method']!.subhead = 'Configured delivery-method guidance.';
    fixture.content.pages['resume-code']!.subhead = 'Configured saved-phone guidance.';
    installPrototypeLibrary(fixture);
    await act(async () => root.render(<MemoryRouter key="method"><ResumeMethod /></MemoryRouter>));
    expect(container.textContent).toContain('Configured delivery-method guidance.');
    await act(async () => root.render(<MemoryRouter key="phone" initialEntries={[sessionPath()]}><ResumeCode /></MemoryRouter>));
    expect(container.textContent).toContain('(•••)•••1234');
    expect(container.textContent).not.toContain('1111');
  });
  it('shows the countdown, verifies the saved application, and shows the success check before navigation', async () => {
    let complete!: (result: never) => void;
    vi.mocked(applicantRecovery.verify).mockReturnValue(new Promise(resolve => { complete = resolve; }));
    await act(async () => root.render(<MemoryRouter initialEntries={[sessionPath()]}><ResumeCode /><LocationProbe /></MemoryRouter>));
    expect(container.textContent).toContain('Code expires in');
    expect(container.textContent).toContain('Resend code');
    await input('123456'); await submit();
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(container.querySelector('[aria-label="Verifying code"]')).not.toBeNull();
    await act(async () => complete({ recoveryActor: 'applicant', advisorFlow: false, resumePage: 'eligibility', values: { email: 'member@example.invalid' } } as never));
    expect(restore).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Verified successfully"]')).not.toBeNull();
    expect(container.querySelector('output')?.textContent).toContain('/resume-code:');
    await act(async () => vi.advanceTimersByTime(1200));
    expect(container.querySelector('output')?.textContent).toContain('/eligibility:{"resumeLoaded":true}');
  });
});
