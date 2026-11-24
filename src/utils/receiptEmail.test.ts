import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, type ReactElement } from 'react';
import { EmailSummary } from '../components/receipt/ReceiptCoverageDecision.stories';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary, installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import fixture from '../../requirements/global/prototype-fixtures/receipt-email.json';
import { getMockEmailSamples, readMockEmailPreviews, sendReceiptMockEmail } from './mockEmail';
import { emailTemplateRows } from '../components/docs/emailTemplateRows';
import ReceiptCoverageDecision from '../components/receipt/ReceiptCoverageDecision';
import { getDecisionStatus, type QdDecisionResult } from './coverageDecisions';
beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key), clear: () => entries.clear() });
  window.history.replaceState(null, '', '/?site=asce');
  installPrototypeLibrary(resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'receipt-email'));
});
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); vi.unstubAllGlobals(); });
it('uses the requested applicant salutation, copy, selected product decisions and administrator signature', async () => {
  await sendReceiptMockEmail({ ...fixture.application, email: 'recipient@example.test', 'first-name': 'Taylor <Test>', 'last-name': 'Rivera', 'bank-account-number': '000123456', 'medical-comment': 'Private medical answer' }, 'CONF-SUMMARY-1');
  const preview = readMockEmailPreviews('asce').find(item => item.type === 'receipt' && item.id !== 'sample-receipt')!;
  const document = new DOMParser().parseFromString(preview.html, 'text/html');
  const text = document.body.textContent!;
  expect(preview.toEmail).toBe('recipient@example.test');
  expect(text).toContain('Dear Taylor <Test> Rivera,');
  expect(text).toContain('Thank you for trusting American Society of Civil Engineers and New York Life Insurance Company with your insurance needs.');
  expect(text).toContain('We have received your request. Please see the following summary of your request:');
  expect(text).toContain('Thank you.');
  expect(text).toContain('Group Sponsored Insurance Program, Insurance Administrator');
  expect(text).toContain('CONF-SUMMARY-1');
  expect(document.querySelectorAll('[data-component="receipt-coverage-decision"]')).toHaveLength(1);
  expect(document.querySelector('article')?.textContent).toContain('Conditionally approved');
  expect(document.body.textContent).not.toContain('$100,000');
  expect(document.querySelector('[data-decision-description]')?.textContent).toBe(getPrototypeLibrary()!.content.receipt.decisionStatuses.conditionallyApproved.description);
  expect(document.querySelector('article')?.style.borderBottom).not.toBe('');
  for (const hidden of ['000123456', 'Private medical answer', 'Application PDF', 'Payment PDF', 'Experiencing issues with the site?', 'portalsupport@newyorklife.com']) expect(preview.html).not.toContain(hidden);
});

it.each([
  ['conditionally-approved', 'Conditionally approved'],
  ['referred', 'Sent for review'],
  ['soft-declined', 'Unable to offer'],
  ['database-unavailable', 'One of the databases we use'],
])('keeps the explicit %s receipt outcome in the email summary', async (result, wording) => {
  await sendReceiptMockEmail({ ...fixture.application, email: 'recipient@example.test', qdDecisions: { 'li-term:member': result } }, 'CONF-OUTCOME');
  const preview = readMockEmailPreviews('asce').find(item => item.type === 'receipt' && item.id !== 'sample-receipt')!;
  const document = new DOMParser().parseFromString(preview.html, 'text/html');
  expect(document.querySelector('article')?.textContent).toContain(wording);
  const statusKey = ({ 'conditionally-approved': 'conditionallyApproved', referred: 'referred', 'soft-declined': 'softDeclined', 'database-unavailable': 'databaseUnavailable' } as const)[result as 'conditionally-approved' | 'referred' | 'soft-declined' | 'database-unavailable'];
  expect(document.querySelector('[data-decision-description]')?.textContent).toBe(getPrototypeLibrary()!.content.receipt.decisionStatuses[statusKey].description);
  const page = new DOMParser().parseFromString(renderToStaticMarkup(createElement(ReceiptCoverageDecision, {
    productName: 'Product heading', applicant: 'member', applicantLabel: 'You', requestedAmount: 100000,
    status: getDecisionStatus({ underwritingType: 'QD', decisionResult: result as QdDecisionResult }), tone: 'primary',
  })), 'text/html');
  expect(page.querySelector('[data-decision-description]')?.textContent).toBe(document.querySelector('[data-decision-description]')?.textContent);
  expect(document.body.textContent).not.toMatch(/\$[\d,]+/);
});

it('does not invent an outcome for a missing QD result', async () => {
  await expect(sendReceiptMockEmail({ ...fixture.application, email: 'recipient@example.test', qdDecisions: {} }, 'CONF-MISSING')).rejects.toThrow('Missing Receipt QD result');
});

it('keeps configured product order, separate applicant decisions and standard-review outcomes', async () => {
  const library = getPrototypeLibrary()!;
  library.client.coverages.productOrder = ['li-10yr', 'li-term'];
  await sendReceiptMockEmail({ ...fixture.application, email: 'recipient@example.test', 'birth-date': '1963-01-01', dependents: ['spouse'], 'spouse-birth-date': '1963-01-01',
    coverageSelections: ['li-term', 'li-10yr', 'removed-product'],
    productApplicants: { 'li-term': ['spouse', 'member'], 'li-10yr': ['member'], 'removed-product': ['member'] },
    coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000, 'li-10yr:member': 700000 },
    qdDecisions: { 'li-term:member': 'conditionally-approved', 'li-term:spouse': 'referred', 'li-10yr:member': 'soft-declined' },
  }, 'CONF-MIXED');
  const preview = readMockEmailPreviews('asce').find(item => item.type === 'receipt' && item.id !== 'sample-receipt')!;
  const document = new DOMParser().parseFromString(preview.html, 'text/html');
  const products = [...document.querySelectorAll('article')];
  expect(products.map(product => product.querySelector('h3')?.textContent)).toEqual(['li-10yr', 'li-term', 'li-term'].map(id => library.products.find(product => product.id === id)!.name));
  expect(products[0].textContent).toContain('Sent for review');
  expect(products[1].textContent).toContain('Conditionally approved');
  expect(products[2].textContent).toContain('Sent for review');
  expect(document.body.textContent).not.toContain('Unable to offer');
  expect(document.body.textContent).not.toContain('removed-product');
});

it('uses the same named salutation in every applicant-facing example', () => {
  const applicantTypes = emailTemplateRows.filter(template => template.recipient === 'Applicant').map(template => template.type);
  const templates = getMockEmailSamples('asce').filter(email => applicantTypes.includes(email.type));
  expect(templates.map(template => template.type).sort()).toEqual([...applicantTypes].sort());
  for (const template of templates) {
    const document = new DOMParser().parseFromString(template.html, 'text/html');
    expect(document.querySelector('p')?.textContent?.trim(), template.type).toBe('Dear Caroline Correa,');
  }
});

it('renders the existing decision component email variation in Storybook from the same JSON example', () => {
  const render = EmailSummary.render as () => ReactElement;
  const document = new DOMParser().parseFromString(renderToStaticMarkup(render()), 'text/html');
  expect(document.querySelector('[data-component="receipt-coverage-decision"]')?.textContent).toContain('Conditionally approved');
  expect(document.body.textContent).not.toContain('$100,000');
});

it('reads installed email wording, administrator initials and decision wording instead of captured copy', async () => {
  const library = getPrototypeLibrary()!;
  library.content.receipt.email.intro = 'Configured gratitude for {{associationName}}.';
  library.content.receipt.decisionStatuses.conditionallyApproved.description = 'Configured decision wording, unchanged.';
  library.client.emailSupport = { contactOverride: { acronym: 'TEST-TPA' } };
  await sendReceiptMockEmail({ ...fixture.application, email: 'recipient@example.test' }, 'CONF-CONFIGURED');
  const preview = readMockEmailPreviews('asce').find(item => item.type === 'receipt' && item.id !== 'sample-receipt')!;
  expect(preview.html).toContain('Configured gratitude for American Society of Civil Engineers.');
  expect(preview.html).toContain('Configured decision wording, unchanged.');
  expect(preview.html).not.toContain('$100,000');
  expect(preview.html).toContain('TEST-TPA Group Sponsored Insurance Program, Insurance Administrator');
});
