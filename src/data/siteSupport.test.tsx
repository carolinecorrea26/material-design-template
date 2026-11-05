import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { resolveSiteSupportContact, resolveApplicationSupportReference, siteSupportCopy } from './siteSupport';
import SiteSupport from '../components/layout/SiteSupport';
import { readMockEmailPreviews } from '../utils/mockEmail';
import { rememberSavedApplication } from '../services/applicantSaveService';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/'); });
it.each(['abe', 'asce', 'ama', 'csea', 'waepa', 'waepa-gi'])('uses the same Site administrator and contact in %s pages and emails', site => {
  window.history.replaceState(null, '', `/?site=${site}`);
  installPrototypeLibrary(resolvePrototypeLibrary(catalog.data, site, 'support-review'));
  const contact = resolveSiteSupportContact(site);
  const html = renderToStaticMarkup(<SiteSupport />);
  const card = new DOMParser().parseFromString(html, 'text/html');
  expect(card.body.textContent).toContain(contact.name);
  expect(card.body.textContent).toContain(siteSupportCopy.title);
  if (contact.phone) expect(card.querySelector('a[href^="tel:"]')?.textContent).toBe(contact.phone);
  if (contact.email) expect(card.querySelector('a[href^="mailto:"]')?.textContent).toBe(contact.email);
  if (!contact.hideInEmail) {
    const email = readMockEmailPreviews(site).find(email => email.html.includes(siteSupportCopy.title));
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
  expect(readMockEmailPreviews('asce').some(email => email.html.includes(siteSupportCopy.title))).toBe(false);
});
it('omits missing contact channels and renders no empty support card', () => {
  const contact = { name: 'Plan administrator', acronym: '', phone: '', email: 'help@example.invalid', website: '', hideInEmail: false };
  const card = new DOMParser().parseFromString(renderToStaticMarkup(<SiteSupport contact={contact} />), 'text/html');
  expect(card.querySelectorAll('a')).toHaveLength(1);
  expect(card.querySelector('a')?.getAttribute('href')).toBe('mailto:help@example.invalid');
  expect(renderToStaticMarkup(<SiteSupport contact={{ ...contact, email: '' }} />)).toBe('');
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
