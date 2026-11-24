import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { getMockEmailSamples } from './mockEmail';
import presentation from '../../requirements/global/presentation-tokens.json';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';

beforeEach(() => {
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'email-presentation'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });

it('uses one body text size throughout every template, with smaller text confined to the footer', () => {
  const samples = getMockEmailSamples('asce');
  expect(samples.map(sample => sample.type).sort()).toEqual(emailTemplateRows.map(template => template.type).sort());
  for (const sample of samples) {
    const document = new DOMParser().parseFromString(sample.html, 'text/html');
    expect(document.body.style.fontSize, sample.type).toBe(`${presentation.email.body.fontSize}px`);
    const footer = document.querySelector('[data-email-footer]');
    expect(footer, sample.type).not.toBeNull();
    for (const element of document.querySelectorAll<HTMLElement>('[style]')) {
      if (!element.style.fontSize || element.closest('[data-email-footer]')) continue;
      // Ignore icon geometry; check elements with their own visible text.
      if (![...element.childNodes].some(node => node.nodeType === 3 && node.textContent?.trim())) continue;
      expect(element.style.fontSize, `${sample.type}: ${element.textContent}`).toBe(`${presentation.email.body.fontSize}px`);
    }
    expect(footer?.querySelector('p')?.style.fontSize).toBe(`${presentation.email.footer.fontSize}px`);
  }
});

it('renders advisor details as labeled lines and links back to the scoped Advisor login', () => {
  const advisorTypes = emailTemplateRows.filter(template => template.recipient === 'Advisor').map(template => template.type);
  const samples = getMockEmailSamples('asce').filter(sample => advisorTypes.includes(sample.type));
  expect(samples.map(sample => sample.type).sort()).toEqual([...advisorTypes].sort());
  for (const sample of samples) {
    const document = new DOMParser().parseFromString(sample.html, 'text/html');
    const details = document.querySelector('section')!;
    expect(details.querySelector('table'), sample.type).toBeNull();
    expect([...details.querySelectorAll('strong')].map(label => label.textContent)).toContain('Applicant name');
    expect(details.textContent).toContain('Applicant name: Caroline Correa');
    const portalLink = [...document.querySelectorAll('a')].find(link => link.textContent === 'Return to Advisor login')!;
    const url = new URL(portalLink.href);
    expect(url.pathname, sample.type).toBe('/advisor-login');
    expect(url.searchParams.get('site'), sample.type).toBe('asce');
    expect(document.querySelector('a[href*="/resume"]'), sample.type).toBeNull();
  }
});
