import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { receiptDefaults } from '../../content/defaults/receipt';
import { Referred, MemberAndSpouseMixedProducts, MissingResult, NoPaymentInformation, Received, ServiceUnavailable, StandardReview, UnableToOffer } from '../../components/receipt/ReceiptPage.stories';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([
  ['approved', Received, 'Conditionally approved', true],
  ['declined', UnableToOffer, 'Unable to offer', true],
  ['database unavailable', ServiceUnavailable, 'Our team will contact the vendor within the next business day', true],
  ['standard', StandardReview, 'Sent for review', true],
  ['ASCE medical review', Referred, 'ExamOne', true],
  ['mixed ASCE applicants', MemberAndSpouseMixedProducts, 'Conditionally approved', true],
  ['missing result', MissingResult, 'Uh oh, we ran into an issue', false],
  ['no payment information', NoPaymentInformation, 'Sent for review', false],
] as const)('renders the actual %s Receipt story through the compiled projection', async (label, story, expected, payment) => {
  const previous = getPrototypeLibrary(), original = JSON.stringify(catalog);
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  const render = story.render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter>{render({}, { id: `receipt-${label}`, loaded: { catalog } })}</MemoryRouter>));
    expect(host.textContent).toContain(expected);
    expect([...host.querySelectorAll('button')].some(button => button.textContent === 'Payment PDF')).toBe(payment);
    expect(host.textContent?.includes(receiptDefaults.paymentNotice)).toBe(payment);
    if (label === 'no payment information') expect(host.querySelector('dl')?.textContent).toContain('Not selected');
    if (label === 'missing result') expect(host.querySelector('article')).toBeNull();
    if (['medical review', 'standard', 'database unavailable', 'mixed ASCE applicants'].includes(label)) expect(host.textContent).toContain('ExamOne');
    if (label === 'approved' || label === 'declined') expect(host.textContent).not.toContain('ExamOne');
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); host.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
