import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { resolveSiteSupportContact, resolveApplicationSupportReference } from './siteSupport';
import { buildContent } from '../content';
import SiteSupport from '../components/layout/SiteSupport';
import { readMockEmailPreviews } from '../utils/mockEmail';
import { rememberSavedApplication } from '../services/applicantSaveService';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key), clear: () => storage.clear() });
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, 'asce', 'support-review'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/'); vi.unstubAllGlobals(); });
it.each(['asce'])('uses the same Site administrator and contact in %s pages and emails', site => {
  window.history.replaceState(null, '', `/?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, site, 'support-review'));
  const contact = resolveSiteSupportContact(site);
  const html = renderToStaticMarkup(<SiteSupport />);
  const card = new DOMParser().parseFromString(html, 'text/html');
  expect(card.body.textContent).toContain(contact.name);
  const copy = buildContent(site).shared.support;
  expect(card.body.textContent).toContain(copy.title);
  if (contact.phone) expect(card.querySelector('a[href^="tel:"]')?.textContent).toBe(contact.phone);
  if (contact.email) expect(card.querySelector('a[href^="mailto:"]')?.textContent).toBe(contact.email);
  if (!contact.hideInEmail) {
    const email = readMockEmailPreviews(site).find(email => email.html.includes(copy.title));
    expect(email).toBeDefined();
    expect(new DOMParser().parseFromString(email!.html, 'text/html').body.textContent).toContain(contact.name);
  }
});
it('keeps email-only hiding separate from required site support and respects captured overrides', () => {
  window.history.replaceState(null, '', '/?site=asce');
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'support-overrides');
  library.client.emailSupport = { hideContactBox: true, contactOverride: { name: 'Example administrator' }, supportOverride: { phone: '800-555-0199', email: 'help@example.invalid', website: 'example.invalid' } };
  installPrototypeLibrary(library);
  const card = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport />), 'text/html');
  expect(card.body.textContent).toContain('Example administrator');
  expect(card.querySelector('a[href="tel:8005550199"]')).not.toBeNull();
  expect(card.querySelector('a[href="https://example.invalid"]')).not.toBeNull();
  expect(readMockEmailPreviews('asce').some(email => email.html.includes(buildContent('asce').shared.support.title))).toBe(false);
});
it('omits missing client channels while retaining technical support', () => {
  const contact = { name: 'Plan administrator', acronym: '', phone: '', email: 'help@example.invalid', website: '', hideInEmail: false };
  const card = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport contact={contact} />), 'text/html');
  expect(card.querySelectorAll('a')).toHaveLength(2);
  expect(card.querySelector('a')?.getAttribute('href')).toBe('mailto:help@example.invalid');
  const technicalOnly = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport contact={{ ...contact, email: '' }} />), 'text/html');
  expect(technicalOnly.querySelectorAll('a')).toHaveLength(1);
  expect(technicalOnly.querySelector('a')?.textContent).toBe('Send an email');
});
it('adds only an approved opaque reference to support contact context', () => {
  const contact = { name: 'Administrator', acronym: '', phone: '', email: 'help@example.invalid', website: '', hideInEmail: false };
  const valid = renderToStaticMarkup(<SiteSupport contact={contact} reference="REQ-7C2F91AB" />);
  expect(valid).toContain('REQ-7C2F91AB');
  expect(new DOMParser().parseFromString(valid, 'text/html').body.textContent).not.toContain('Support reference:');
  const invalid = renderToStaticMarkup(<SiteSupport contact={contact} reference="private@example.invalid?token=private-token" />);
  expect(invalid).not.toContain('private-token');
  expect(invalid).not.toContain('?subject=');
  expect(invalid).not.toContain('Support reference:');
});

it.each([
  [{ applicationId: 'APP-12345678' }, 'application ID', 'APP-12345678'],
  [{ confirmationId: 'CONF-87654321' }, 'confirmation ID', 'CONF-87654321'],
  [{ confirmationId: 'APP-87654321' }, 'application ID', 'APP-87654321'],
] as const)('includes the available identifier in the shared support instruction: %j', (ids, label, id) => {
  const card = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport {...ids} />), 'text/html');
  expect(card.body.textContent).toContain(`Please include your ${label} for reference when contacting support: ${id}`);
  expect(decodeURIComponent(card.querySelector('a[href^="mailto:"]')!.getAttribute('href')!)).toContain(`Application support (${id})`);
});

it('uses the current Site application on all support cards and keeps explicit receipt context', () => {
  window.history.replaceState(null, '', '/?site=asce');
  rememberSavedApplication({ mode: 'mock', siteKey: 'asce', applicationId: 'APP-12345678', recipient: 'test@example.invalid', revision: 'test', expiresAt: Date.now() + 10000, writeCapability: 'private-capability', requiresRevalidation: false });
  const card = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport />), 'text/html');
  expect(card.body.textContent).toContain('Please include your application ID for reference when contacting support: APP-12345678');
  expect(card.body.textContent).not.toContain('private-capability');
  expect(resolveApplicationSupportReference('asce', { confirmationId: 'CONF-12345678' })?.id).toBe('CONF-12345678');
  expect(resolveApplicationSupportReference('abe')).toBeUndefined();
  expect(readMockEmailPreviews('asce').find(email => email.type === 'autosave')?.html).toContain('APP-12345678');
});

it('omits the instruction without an identifier and never prints recovery tokens', () => {
  window.history.replaceState(null, '', '/resume?site=asce&applicationId=APP-99887766&token=private-token');
  expect(resolveApplicationSupportReference('asce')?.id).toBe('APP-99887766');
  expect(resolveApplicationSupportReference('abe')).toBeUndefined();
  window.history.replaceState(null, '', '/?site=asce');
  const html = renderToStaticMarkup(<SiteSupport applicationId="APP-123?token=private-token" confirmationId="private@example.invalid" />);
  expect(html).not.toContain('Please include your');
  expect(html).not.toContain('private-token');
  expect(html).not.toContain('private@example.invalid');
});

it('keeps administrator support shared and technical support confined to pages', () => {
  const copy = buildContent('asce').shared.support;
  const contact = resolveSiteSupportContact('asce');
  const page = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport />), 'text/html');
  const previews = readMockEmailPreviews('asce').map(email => ({ ...email, document: new DOMParser().parseFromString(email.html, 'text/html') }));
  const withSupport = previews.filter(email => email.document.querySelector('[data-component="site-support"]'));
  expect(withSupport.map(email => email.type).sort()).toEqual(emailTemplateRows.filter(template => template.usesSupportBox).map(template => template.type).sort());
  expect(withSupport).toHaveLength(5);
  for (const document of [page, ...withSupport.map(email => email.document)]) {
    const support = document.querySelector('[data-component="site-support"]')!;
    expect(support.textContent).not.toContain('Application or product support');
    expect(support.textContent?.includes(copy.technicalTitle.replace('{{emailLink}}', copy.technicalEmailLabel))).toBe(document === page);
    expect(support.textContent).toContain(contact.name);
    expect(support.querySelector(`a[href^="mailto:${contact.email}"]`)?.textContent).toBe(contact.email);
    const technical = support.querySelector(`a[href^="mailto:${copy.technicalEmailAddress}"]`)!;
    if (document === page) expect(technical.textContent).toBe('Send an email');
    else expect(technical).toBeNull();
    expect(support.textContent).not.toContain(copy.technicalEmailAddress);
    expect(support.classList.contains('MuiAlert-standardInfo')).toBe(true);
    expect(support.querySelector('.MuiAlertTitle-root')?.textContent).toBe(copy.title);
    for (const icon of ['PhoneRounded', 'EmailRounded', 'LanguageRounded']) {
      expect(support.querySelector(`svg[data-testid="${icon}Icon"]`)).not.toBeNull();
    }
    expect(support.textContent).not.toMatch(/[☎✉🌐]/u);
  }
});

it('reads effective support content and keeps client contact overrides separate from technical support', () => {
  const library = resolvePrototypeLibrary(catalog.data, 'asce', 'support-content');
  library.content.shared.support.technicalTitle = 'Configured technical help: {{emailLink}}';
  library.client.emailSupport = { supportOverride: { email: 'client@example.invalid' } };
  installPrototypeLibrary(library);
  for (const [html, page] of [[renderToStaticMarkup(<SiteSupport />), true], [readMockEmailPreviews('asce').find(email => email.type === 'autosave')!.html, false]] as const) {
    const document = new DOMParser().parseFromString(html, 'text/html');
    expect(document.body.textContent?.includes('Configured technical help: Send an email')).toBe(page);
    expect(document.querySelector('a[href^="mailto:client@example.invalid"]')).not.toBeNull();
    if (page) expect(document.querySelector('a[href^="mailto:portalsupport@newyorklife.com"]')?.textContent).toBe('Send an email');
    else expect(document.querySelector('a[href^="mailto:portalsupport@newyorklife.com"]')).toBeNull();
  }
});

it('renders retention warnings as MUI alerts and advisor statuses with MUI icons', () => {
  const previews = readMockEmailPreviews('asce').map(email => ({ ...email, document: new DOMParser().parseFromString(email.html, 'text/html') }));
  const warnings = previews.filter(email => email.document.querySelector('.MuiAlert-standardWarning'));
  expect(warnings.map(email => email.type).sort()).toEqual(['autosave', 'pending-reminder', 'advisor-sent-to-applicant'].sort());
  for (const { document } of warnings) {
    const warning = document.querySelector<HTMLElement>('.MuiAlert-standardWarning')!;
    expect(warning.getAttribute('role')).toBe('alert');
    expect(warning.querySelector('.MuiAlertTitle-root')?.textContent).toBe('Your application will be saved for 10 days.');
    expect(warning.querySelector('.MuiAlert-icon svg.MuiSvgIcon-root')).not.toBeNull();
    expect(warning.textContent).toContain('your saved application will be deleted on');
    expect(warning.style.display).toBe('flex');
    expect(warning.style.backgroundColor).not.toBe('');
    const icon = warning.querySelector<SVGElement>('.MuiAlert-icon svg')!;
    expect(icon.style.width).toBe('22px');
  }
  for (const [type, icon] of [
    ['advisor-sent-for-signature', 'SendRounded'],
    ['advisor-pending-reminder', 'PendingActionsRounded'],
    ['advisor-edit-request', 'EditNotificationsRounded'],
    ['advisor-application-complete', 'CheckCircleRounded'],
  ]) {
    const email = previews.find(email => email.type === type)!;
    expect(email.document.querySelector(`svg.MuiSvgIcon-root[data-testid="${icon}Icon"]`), type).not.toBeNull();
    expect(email.document.querySelector('svg:not(.MuiSvgIcon-root)'), type).toBeNull();
  }
});
