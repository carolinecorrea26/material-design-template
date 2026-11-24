import { renderToStaticMarkup } from 'react-dom/server';
import { GlobalEmailConfigurationTable, ClientEmailConfigurationTable } from './EmailConfigurationTable';
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { freshStartSource } from '../../domain/freshStartCatalog';
import { resolveSiteSupportContact } from '../../data/siteSupport';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import EmailTemplatesTable from './EmailTemplatesTable';

afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

it('previews the current template even when a previously generated receipt is stored locally', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const stored = JSON.stringify([{ id: 'old-receipt', siteId: 'asce', type: 'receipt', subject: 'Old receipt subject', html: '<p>Superseded confirmation-only copy</p>' }]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'mockEmail:previews' ? stored : null, setItem: vi.fn(), removeItem: vi.fn() });
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'current-email-template'));
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter><EmailTemplatesTable siteId="asce" /></MemoryRouter>));
    expect([...host.querySelectorAll('th')].some(header => header.textContent === 'Recipient')).toBe(true);
    for (const [title, recipient] of [['Application deleted [advisor]', 'Advisor'], ['Application deleted [applicant]', 'Applicant']]) {
      const row = [...host.querySelectorAll('tbody tr')].find(row => row.textContent?.includes(title))!;
      expect(row.querySelectorAll('td')[1].textContent).toBe(recipient);
    }
    const open = [...host.querySelectorAll('button')].find(button => button.textContent === 'Application submitted')!;
    await act(async () => open.click());
    const html = document.querySelector('iframe')!.getAttribute('srcdoc')!;
    expect(html).toContain('Dear Caroline Correa,');
    expect(html).toContain('Thank you for trusting American Society of Civil Engineers');
    expect(html).toContain('receipt-coverage-decision');
    expect(html).not.toContain('Superseded confirmation-only copy');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('renders global contact definitions and selected effective Site values from the supplied projection', () => {
  const raw = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const catalog = { ...raw, revision: 'contacts' };
  const global = renderToStaticMarkup(<GlobalEmailConfigurationTable catalog={catalog} />);
  expect(global).toContain('Hide contact box');
  expect(global).not.toContain('Technical support keeps');
  installPrototypeLibrary(resolvePrototypeLibrary(raw.data, 'waepa', 'another-site'));
  const html = renderToStaticMarkup(<ClientEmailConfigurationTable siteId="asce" catalog={catalog} />);
  const asce = resolvePrototypeLibrary(raw.data, 'asce', 'expected-contact');
  expect(html).toContain(asce.client.support.email);
  expect(html).not.toContain('support@waepa.org');
  expect(html).toContain('Inherited');
});

it('inherits contact defaults and applies an explicit Site override through the shared resolver', () => {
  const raw = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const rows = freshStartSource().siteApplication.asce.records.configurationValues;
  const length = rows.length;
  try {
    rows.push({ ...rows[0], id: 'test-email-override', key: 'test-email-override', configurationKey: 'emailSupport.supportOverride', value: { email: 'configured@example.test' } });
    const library = resolvePrototypeLibrary(raw.data, 'asce', 'overridden-email-contact');
    const contact = resolveSiteSupportContact('asce', library);
    expect(contact.email).toBe('configured@example.test');
    expect(contact.phone).toBeTruthy();
    const html = renderToStaticMarkup(<ClientEmailConfigurationTable siteId="asce" catalog={{ ...raw, revision: 'override' }} />);
    expect(html).toContain('configured@example.test');
    expect(html).toContain('Inherited');
  } finally { rows.splice(length); }
});
