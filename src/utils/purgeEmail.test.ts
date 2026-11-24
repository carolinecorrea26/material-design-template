import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { getMockEmailSamples } from './mockEmail';
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';
import { advisorFlow } from '../content/docs/flows/advisorFlow';
import { tutorialNotifications } from '../domain/tutorialNotifications';
import applicant from '../../requirements/global/prototype-fixtures/receipt-email.json';
import advisor from '../../requirements/global/prototype-fixtures/advisor.json';

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'purge-email'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

it('defines separate advisor and applicant deletion notifications consistently across Library, flow and tutorial', () => {
  const types = ['advisor-purge-reminder', 'advisor-applicant-purge-reminder'];
  const samples = getMockEmailSamples('asce');
  expect(types.map(type => samples.find(email => email.type === type)?.toEmail)).toEqual([advisor.email, applicant.application.email]);
  expect(types.map(type => emailTemplateRows.find(row => row.type === type)?.recipient)).toEqual(['Advisor', 'Applicant']);
  expect(types.map(type => emailTemplateRows.find(row => row.type === type)?.flow)).toEqual(['Advisor', 'Advisor']);
  expect(advisorFlow.nodes.find(node => node.id === 'advisor-deletion')?.emailTemplateKeys).toEqual(types);
  expect(tutorialNotifications.types.find(group => group.id === 'deleted')?.emails.map(email => [email.recipient, email.template.type])).toEqual([
    ['Advisor', types[0]], ['Applicant', types[1]],
  ]);
});

it('uses the standard advisor layout with a completed deletion date and Advisor login link', () => {
  const email = getMockEmailSamples('asce').find(email => email.type === 'advisor-purge-reminder')!;
  const document = parse(email.html);
  const details = document.querySelector('section')!;
  expect(details.textContent).toContain('Applicant email');
  expect(details.textContent).toContain(applicant.application.email);
  expect([...details.querySelectorAll('strong')].map(label => label.textContent)).toContain('Deleted');
  expect(details.textContent).not.toContain('Scheduled for deletion');
  expect(document.body.textContent).toContain('It can no longer be resumed.');
  expect(document.querySelector('a')?.getAttribute('href')).toContain('/advisor-login?site=asce');
  expect(details.querySelector('table')).toBeNull();
});

it('reuses consumer deletion wording for the applicant and offers advisor contact without Apply or Resume', () => {
  const samples = getMockEmailSamples('asce');
  const consumer = parse(samples.find(email => email.type === 'purge-reminder')!.html);
  const document = parse(samples.find(email => email.type === 'advisor-applicant-purge-reminder')!.html);
  expect(document.querySelector('p')?.textContent).toBe(`Dear ${applicant.application['first-name']} ${applicant.application['last-name']},`);
  expect(document.querySelectorAll('p')[1].textContent).toBe(consumer.querySelectorAll('p')[1].textContent);
  expect(document.body.textContent).toContain('please contact your advisor');
  expect(document.querySelector('a')?.getAttribute('href')).toBe(`mailto:${advisor.email}`);
  expect(document.querySelectorAll('a[href^="http"]')).toHaveLength(0);
  expect(document.querySelector('a[href*="/resume"]')).toBeNull();
  expect(document.querySelector('[data-component="site-support"]')).toBeNull();
  expect([...consumer.querySelectorAll('a')].some(link => link.textContent?.includes('Start my application'))).toBe(true);
});

it('reads the current shared purge copy instead of hardcoded variant wording', () => {
  getPrototypeLibrary()!.content.shared.emailPurge['advisor-next-step'] = 'Configured advisor contact guidance.';
  const document = parse(getMockEmailSamples('asce').find(email => email.type === 'advisor-applicant-purge-reminder')!.html);
  expect(document.body.textContent).toContain('Configured advisor contact guidance.');
});
