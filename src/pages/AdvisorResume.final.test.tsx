import { readFileSync } from 'node:fs';
import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdvisorLogin from './AdvisorLogin';
import AdvisorSendConfirmation from './AdvisorSendConfirmation';
import Resume from './Resume';
import ResumeMethod from './ResumeMethod';
import ResumeCode from './ResumeCode';
import ErrorPage from './ErrorPage';
import { applicantRecovery, rememberResumeSession, resumeSessionQuery } from '../services/applicantSaveService';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown>, savedApplicationExpiresAt: undefined as number | undefined, setPageValues: vi.fn(), resetValues: vi.fn(), restoreApplication: vi.fn(), saveApplication: vi.fn() }));
const session = vi.hoisted(() => ({ reviewSubmitted: false, advisorApplicantFlow: false, resetApplicationSession: vi.fn(), setAdvisorApplicantFlow: vi.fn(), markReviewSubmitted: vi.fn() }));
vi.mock('../app/ApplicationFormContext', () => ({ useApplicationForm: () => form }));
vi.mock('../app/ApplicationSessionContext', () => ({ useApplicationSession: () => session }));
vi.mock('../services/applicantSaveService', async original => ({ ...await original<typeof import('../services/applicantSaveService')>(), readSavedApplication: () => null, applicantRecovery: { request: vi.fn(), challenge: vi.fn(), verify: vi.fn(), outbox: vi.fn() } }));
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
const library = resolvePrototypeLibrary(catalog.data, 'asce', 'advisor-resume-final');
const query = '?site=asce&applicationId=fixture&recipient=member@example.invalid&recoveryId=fixture&token=fictional';
const advisor = { 'advisor-email': 'advisor@example.invalid', 'advisor-phone': '2125550100', 'advisor-code': 'EXAMPLE' };
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true'); vi.useFakeTimers(); vi.clearAllMocks();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  window.sessionStorage.clear(); window.history.replaceState(null, '', '/?site=asce'); installPrototypeLibrary(library);
  form.values = {}; form.savedApplicationExpiresAt = undefined;
  form.resetValues.mockImplementation(() => { form.values = {}; form.savedApplicationExpiresAt = undefined; });
  form.setPageValues.mockImplementation(patch => { form.values = { ...form.values, ...patch }; });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); installPrototypeLibrary(null); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function Probe() { const location = useLocation(); return <output>{location.pathname}:{JSON.stringify(form.values)}</output>; }
async function render(path: string, Page: ComponentType = ResumeCode) {
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path={path.split('?')[0]} element={<Page />} />
    <Route path="/resume" element={<Resume />} />
    <Route path="/session-expired" element={<ErrorPage status="session-expired" />} />
    <Route path="*" element={<Probe />} />
  </Routes><Probe /></MemoryRouter>));
}
function codePath(advisorFlow = false, expired = false, sessionSeconds = 1800) {
  const session = { siteKey: 'asce', applicationId: 'fixture', recipient: 'member@example.invalid', sessionId: 'fixture-mfa', mfaToken: 'proof', sessionExpiresAt: Date.now() + sessionSeconds * 1000, codeExpiresAt: expired ? 1 : Date.now() + 600000, deliveryTarget: '(•••)•••1234', method: 'text' as const, advisorFlow };
  rememberResumeSession(session); return '/resume-code?' + resumeSessionQuery(session);
}
async function input(value: string) {
  await act(async () => { const input = container.querySelector<HTMLInputElement>('input:not([type=radio])')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function submit() { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
const textButtons = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].filter(button => button.textContent === text);

it('starts a fresh advisor application without saving the preceding household', async () => {
  form.values = { ...advisor, 'advisor-flow-type': 'new', email: 'previous@example.invalid', coverageSelections: ['li-term'] };
  await render('/advisor-login', AdvisorLogin);
  await submit();
  expect(form.saveApplication).not.toHaveBeenCalled();
  expect(form.resetValues).toHaveBeenCalledOnce();
  expect(form.values).toEqual({ ...advisor, 'advisor-flow-type': 'new' });
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  expect(container.querySelector('output')?.textContent).toContain('/membership:');
});
it('rejects a restored unsupported advisor mode instead of bypassing entry validation', async () => {
  form.values = { ...advisor, 'advisor-flow-type': 'unsupported' };
  await render('/advisor-login', AdvisorLogin); await submit();
  expect(form.resetValues).not.toHaveBeenCalled();
  expect(form.saveApplication).not.toHaveBeenCalled();
  expect(container.textContent).toContain('Select an available Advisor login type option');
});
it('requires a nonblank advisor code and accepts punctuation without a format or length rule', async () => {
  form.values = { ...advisor, 'advisor-flow-type': 'new', 'advisor-code': '   ' };
  await render('/advisor-login', AdvisorLogin); await submit();
  expect(form.resetValues).not.toHaveBeenCalled();
  expect(container.querySelector('input[name="advisor-code"]')?.getAttribute('aria-invalid')).toBe('true');
  await act(async () => {
    const code = container.querySelector<HTMLInputElement>('input[name="advisor-code"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(code, 'AGENT-7 / CODE');
    code.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await submit();
  expect(form.resetValues).toHaveBeenCalledOnce();
  expect(form.values['advisor-code']).toBe('AGENT-7 / CODE');
});
it('displays the saved deadline and clears applicant state while retaining advisor details on restart', async () => {
  form.values = { ...advisor, 'advisor-flow-type': 'saved', email: 'previous@example.invalid', beneficiaries: { retained: [] } };
  form.savedApplicationExpiresAt = Date.now() + 2 * 86400000;
  const deadline = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(form.savedApplicationExpiresAt));
  await render('/advisor-send-confirmation', AdvisorSendConfirmation);
  expect(container.textContent).toContain(deadline);
  await act(async () => textButtons('Start new application')[0].click());
  expect(form.values).toEqual({ ...advisor, 'advisor-flow-type': 'new' });
  expect(session.resetApplicationSession).toHaveBeenCalled();
});
it('collects advisor identity without substituting the applicant lookup email or requesting on mount', async () => {
  form.values = { 'advisor-flow-type': 'saved', 'applicant-email': 'client@example.invalid' };
  await render('/resume', Resume);
  expect(container.querySelector<HTMLInputElement>('input')!.value).toBe('');
  expect(container.querySelector('input[name="resume-phone"]')).not.toBeNull();
  expect(container.querySelector('input')!.getAttribute('autocomplete')).toBe('off');
  expect(applicantRecovery.request).not.toHaveBeenCalled();
});
it.each([['/resume-method', ResumeMethod], ['/resume-code', ResumeCode]] as const)('returns missing %s access to Resume with an inline error and no automatic request', async (path, Page) => {
  await render(path, Page);
  expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
  expect(container.textContent).toContain('This link is no longer valid. Request another secure link below.');
  expect(applicantRecovery.request).not.toHaveBeenCalled();
  expect(applicantRecovery.challenge).not.toHaveBeenCalled();
});
it('maps invalid link failures to inline Resume feedback without revealing a service lookup result', async () => {
  vi.mocked(applicantRecovery.challenge).mockRejectedValue(Object.assign(new Error('Saved application unavailable SECRET'), { code: 'RESUME_LINK_INVALID' }));
  await render('/resume-method' + query, ResumeMethod);
  await act(async () => container.querySelector<HTMLInputElement>('input[type=radio]')!.click()); await submit();
  expect(container.querySelector('input[name="resume-email"]')).not.toBeNull();
  expect(container.textContent).not.toContain('SECRET');
  expect(applicantRecovery.request).not.toHaveBeenCalled();
});
it('validates the shared six-digit code and keeps raw diagnostics out of page errors', async () => {
  await render(codePath());
  await input('12345'); await submit(); expect(applicantRecovery.verify).not.toHaveBeenCalled();
  vi.mocked(applicantRecovery.verify).mockRejectedValue(new Error('Saved application unavailable SECRET'));
  await input('123456'); await submit();
  expect(container.textContent).toContain('There was a technical issue.'); expect(container.textContent).not.toContain('SECRET');
});
it.each([['ordinary', '/eligibility', false], ['advisor', '/review', true], ['unfinished signing', '/docusign', true]] as const)('restores only after verification and returns the correct context %s', async (_flow, destination, advisorFlow) => {
  vi.mocked(applicantRecovery.verify).mockResolvedValue({ siteKey: 'asce', recoveryActor: 'applicant', advisorFlow, resumePage: destination.slice(1), values: { email: 'member@example.invalid' } } as never);
  await render(codePath(advisorFlow)); expect(form.restoreApplication).not.toHaveBeenCalled();
  await input('123456'); await submit();
  expect(form.restoreApplication).toHaveBeenCalledOnce(); expect(session.setAdvisorApplicantFlow).toHaveBeenCalledWith(advisorFlow);
  await act(async () => vi.advanceTimersByTimeAsync(1200)); expect(container.querySelector('output')?.textContent).toContain(destination);
});
it('disables both expired-code resend controls during a pending request', async () => {
  vi.mocked(applicantRecovery.challenge).mockReturnValue(new Promise(() => {}));
  await render(codePath(false, true));
  expect(textButtons('Resend code')).toHaveLength(2);
  await act(async () => textButtons('Resend code')[0].click());
  expect(applicantRecovery.challenge).toHaveBeenCalledOnce();
  expect(textButtons('Resend code').every(button => button.disabled)).toBe(true);
});
it('expires against wall-clock time after a delayed timer callback', async () => {
  await render(codePath());
  vi.setSystemTime(Date.now() + 600000); await act(async () => vi.advanceTimersByTime(1000));
  expect(container.querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
  expect(container.textContent).toContain('Your verification code has expired.');
});

it('starts MFA only on delivery-method Next and removes the consumed email proof from the code URL', async () => {
  vi.mocked(applicantRecovery.challenge).mockResolvedValue({ sessionId: 'new-mfa', mfaToken: 'session-secret', sessionExpiresAt: Date.now() + 1800000, expiresAt: Date.now() + 600000, deliveryTarget: '(•••)•••1234', method: 'phone' });
  await render('/resume-method' + query, ResumeMethod);
  expect(applicantRecovery.challenge).not.toHaveBeenCalled();
  await act(async () => container.querySelector<HTMLInputElement>('input[value=call]')!.click()); await submit();
  expect(applicantRecovery.challenge).toHaveBeenCalledWith(expect.objectContaining({ token: 'fictional' }), 'phone');
  expect(container.querySelector('output')?.textContent).toContain('/resume-code:');
  const stored = JSON.parse(sessionStorage.getItem('resumeMfa:asce')!);
  expect(stored).toMatchObject({ sessionId: 'new-mfa', mfaToken: 'session-secret' });
  expect(stored).not.toHaveProperty('token');
});
it('warns at two minutes without extending MFA on activity and opens the shared expiration page at zero', async () => {
  await render(codePath(false, false, 120));
  expect(container.textContent).toContain('Your verification session is about to expire');
  expect(textButtons('Keep session active')).toHaveLength(0);
  await act(async () => { window.dispatchEvent(new Event('pointerdown')); vi.advanceTimersByTime(120000); });
  expect(container.querySelector('input[name="resume-email"]')).toBeNull();
  expect(container.textContent).toContain('Your session has expired.');
  expect(applicantRecovery.request).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('resumeMfa:asce')).toBeNull();
});
it.each([['RESUME_CODE_REQUEST_LIMIT', 'maximum number of resend attempts'], ['RESUME_ATTEMPTS_LOCKED', 'maximum number of phone code attempts']] as const)('returns %s to its distinct Resume page error with the service cooldown', async (code, wording) => {
  vi.mocked(applicantRecovery.verify).mockRejectedValue(Object.assign(new Error('PRIVATE'), { code, retryAt: Date.now() + 1800000 }));
  await render(codePath()); await input('123456'); await submit();
  expect(container.textContent).toContain(wording);
  expect(container.textContent).toContain('30 minutes');
  expect(container.textContent).not.toContain('PRIVATE');
  expect(container.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
  expect(sessionStorage.getItem('resumeMfa:asce')).toBeNull();
});
it('shows a uniform link-request cooldown and permits retry exactly when it ends', async () => {
  vi.mocked(applicantRecovery.request).mockRejectedValueOnce(Object.assign(new Error('PRIVATE'), { code: 'RESUME_LINK_REQUEST_LIMIT', retryAt: Date.now() + 600000 }));
  await render('/resume', Resume); await input('someone@example.invalid'); await submit();
  expect(container.textContent).toContain('maximum number of requests');
  expect(container.textContent).toContain('10 minutes');
  expect(container.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
  await act(async () => vi.advanceTimersByTime(600000));
  expect(container.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(false);
  vi.mocked(applicantRecovery.request).mockResolvedValue({ expiresAt: Date.now() + 600000 });
  await submit(); expect(container.textContent).toContain('A secure link has been sent');
});

it('does not restore a late verification response after MFA has opened the shared expiration page', async () => {
  let finish!: (value: never) => void;
  vi.mocked(applicantRecovery.verify).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await render(codePath(false, false, 1)); await input('123456'); await submit();
  await act(async () => vi.advanceTimersByTime(1000));
  expect(container.textContent).toContain('Your session has expired.');
  await act(async () => finish({ values: { email: 'member@example.invalid' } } as never));
  expect(form.restoreApplication).not.toHaveBeenCalled();
});
it('does not trust a query-code deadline to extend the stored code or MFA expiry', async () => {
  await render(codePath(false, true) + '&codeExpiresAt=' + (Date.now() + 86400000));
  expect(container.querySelector<HTMLInputElement>('input[name="resume-security-code"]')?.disabled).toBe(true);
});

it('submits the advisor email and phone separately from the applicant lookup key', async () => {
  form.values = { 'advisor-flow-type': 'saved', 'applicant-email': 'client@example.invalid' };
  vi.mocked(applicantRecovery.request).mockResolvedValue({ expiresAt: Date.now() + 600000 });
  await render('/resume', Resume);
  await input('advisor@example.invalid');
  await submit(); expect(applicantRecovery.request).not.toHaveBeenCalled();
  await act(async () => {
    const phone = container.querySelector<HTMLInputElement>('input[name="resume-phone"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(phone, '3125550987');
    phone.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await submit();
  expect(applicantRecovery.request).toHaveBeenCalledWith('', 'asce', 'advisor@example.invalid', undefined, { applicantEmail: 'client@example.invalid', phone: expect.stringMatching(/312/) });
  expect(container.textContent).toContain('advisor@example.invalid');
  expect(container.querySelector('form')?.textContent).not.toContain('client@example.invalid');
});
