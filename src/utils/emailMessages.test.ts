import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { rememberSavedApplication } from '../services/applicantSaveService';
import { emailExampleTimeline } from '../domain/emailExampleTimeline';
import { getResumePolicy } from '../config/resumePolicy';
import { getMockEmailSamples, readMockEmailPreviews, sendAutosaveMockEmail } from './mockEmail';
import fixture from '../../requirements/global/prototype-fixtures/receipt-email.json';

const dayMs = 86400000;
beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key), clear: () => entries.clear() });
  sessionStorage.clear();
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'email-messages'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

it('uses the saved expiry after time passes rather than starting a new retention period', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const savedAt = new Date('2026-11-01T12:00:00Z').getTime();
  const expiresAt = savedAt + getResumePolicy().retentionDays * dayMs;
  const library = getPrototypeLibrary()!;
  rememberSavedApplication({ mode: 'mock', siteKey: 'asce', applicationId: 'APP-DEADLINE', recipient: fixture.application.email, revision: library.revision, expiresAt, writeCapability: 'test-only', requiresRevalidation: false });
  const expected = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(expiresAt);
  for (const elapsedDays of [1, 6]) {
    vi.setSystemTime(savedAt + elapsedDays * dayMs);
    await sendAutosaveMockEmail(fixture.application);
    const email = readMockEmailPreviews('asce').find(email => email.type === 'autosave' && email.id !== 'sample-autosave')!;
    const document = parse(email.html);
    expect(document.querySelector('.MuiAlert-standardWarning')?.textContent).toContain(expected);
    expect(document.body.textContent).not.toContain('within the next');
    expect(document.body.textContent).not.toContain('{{');
  }
});

it('does not invent a dated retention notice when no saved expiry is available', async () => {
  await sendAutosaveMockEmail(fixture.application);
  const email = readMockEmailPreviews('asce').find(email => email.type === 'autosave' && email.id !== 'sample-autosave')!;
  expect(parse(email.html).querySelector('.MuiAlert-standardWarning')).toBeNull();
});

it('keeps fictional advisor dates inside the same policy-based original retention window', () => {
  const now = Date.now(), days = getResumePolicy().retentionDays;
  const advisor = emailExampleTimeline('advisor', days, now);
  expect(advisor.sentAt).toBeGreaterThanOrEqual(advisor.savedAt);
  expect(advisor.editRequestedAt).toBeGreaterThanOrEqual(advisor.sentAt);
  expect(advisor.expiresAt - advisor.savedAt).toBe(days * dayMs);
  const deleted = emailExampleTimeline('deleted', days, now);
  expect(deleted.deletedAt).toBe(deleted.expiresAt);
  expect(deleted.sentAt).toBeLessThan(deleted.expiresAt);
  expect(deleted.expiresAt).toBeLessThanOrEqual(now);
});

it('renders revised JSON projection copy, escapes variables and uses shared wording in every relevant template', () => {
  const library = getPrototypeLibrary()!;
  library.content.shared.emailMessages['common-identity-notice'] = 'Configured identity instruction.';
  library.content.shared.emailMessages['autosave-subject'] = 'Configured save subject';
  library.content.shared.emailMessages['footer-no-reply'] = 'Configured automated footer.';
  library.clientIdentity.name = 'Association <unsafe>';
  for (const association of [...library.associationContext.associations, ...library.associationContext.allAssociations]) association.name = 'Association <unsafe>';
  const samples = getMockEmailSamples('asce');
  expect(samples.find(email => email.type === 'autosave')?.subject).toBe('Configured save subject');
  expect(samples.find(email => email.type === 'autosave')?.html).toContain('Association &lt;unsafe&gt;');
  for (const type of ['autosave', 'pending-reminder', 'advisor-sent-to-applicant']) {
    const email = samples.find(email => email.type === type)!;
    expect(parse(email.html).body.textContent).toContain('Configured identity instruction.');
    expect(email.html).not.toContain('<unsafe>');
  }
  for (const email of samples) expect(parse(email.html).querySelector('footer')?.textContent).toContain('Configured automated footer.');
});
