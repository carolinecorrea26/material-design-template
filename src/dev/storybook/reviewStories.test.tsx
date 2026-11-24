import { readFileSync } from 'node:fs';
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { isReviewPolicy } from '../../domain/reviewPolicy';
import * as stories from '../../components/review/ReviewPage.stories';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it.each(Object.entries(stories).filter(([key]) => key !== 'default'))('renders Review %s from fresh-start fields and policies', async (name, story) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const previous = getPrototypeLibrary(), original = JSON.stringify(catalog);
  const container = document.createElement('div'), root = createRoot(container); document.body.append(container);
  const render = (story as typeof stories.Empty).render as unknown as (args: object, context: object) => ReactNode;
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/review']}>{render({}, { id: name, loaded: { catalog } })}</MemoryRouter>));
    expect(isReviewPolicy(getPrototypeLibrary()!.client.reviewPolicy)).toBe(true);
    expect(container.querySelectorAll('[data-legal-review-section]')).toHaveLength(2);
    expect(container.querySelector('input[name="review-self-consent"]')).not.toBeNull();
    if (name === 'Empty') {
      const readAndSign = container.querySelector<HTMLElement>('#read-and-sign-print-content')!;
      const electronicConsent = container.querySelector<HTMLElement>('#electronic-consent-print-content')!;
      expect(getComputedStyle(readAndSign).overflowY).toBe('visible');
      expect(['', 'none']).toContain(getComputedStyle(readAndSign).maxHeight);
      expect(getComputedStyle(electronicConsent).maxHeight).toBe('240px');
      expect(getComputedStyle(electronicConsent).overflowY).toBe('auto');
      expect(electronicConsent.getAttribute('role')).toBe('region');
      expect(electronicConsent.tabIndex).toBe(0);
      expect(electronicConsent.textContent?.length).toBe(getPrototypeLibrary()!.content.review.electronicConsentContent.length);
    }
    if (name === 'RestoredConsent' || name.startsWith('ImportantNotice')) {
      const link = container.querySelector<HTMLAnchorElement>('a[href="#review-legal-document"]')!;
      expect(link).not.toBeNull();
      await act(async () => link.click());
      const viewer = document.querySelector('#review-legal-document-content')!.closest('[role="dialog"]')!;
      expect(viewer).not.toBeUndefined();
      expect(viewer.textContent!.includes('CONFIDENTIAL ABUSE INFORMATION')).toBe(name === 'ImportantNoticeNewMexico');
      expect([...viewer.querySelectorAll('button')].some(button => button.textContent === 'Print')).toBe(true);
      const close = [...viewer.querySelectorAll('button')].find(button => button.textContent === 'Close')!;
      await act(async () => close.click());
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
      const privacy = [...container.querySelectorAll<HTMLAnchorElement>('a[href="#review-legal-document"]')].find(link => link.textContent === 'New York Life Online Privacy Notice')!;
      expect(privacy).not.toBeUndefined();
      await act(async () => privacy.click());
      const privacyDialog = document.querySelector('#review-legal-document-content')!.closest('[role="dialog"]')!;
      expect(privacyDialog.querySelector('h2')!.textContent).toContain(getPrototypeLibrary()!.content.footer.privacyNoticeContent.title);
      const privacyClose = [...privacyDialog.querySelectorAll('button')].find(button => button.textContent === 'Close')!;
      await act(async () => privacyClose.click());
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
    }
    if (name === 'RestoredConsent') expect(container.querySelector<HTMLInputElement>('input[name="review-self-consent"]')?.checked).toBe(true);
    if (name === 'MemberAndSpouse') expect(container.querySelector('input[name="review-spouse-consent"]')).not.toBeNull();
    if (name === 'DividendElection') expect(container.querySelector('input[name="dividend-acknowledgement"]')).not.toBeNull();
    if (name === 'MissingApplicantType') expect(container.textContent).toContain('Select a valid applicant type');
    if (name === 'JurisdictionNotices') expect(container.textContent).toContain('Example configured NY notice');
    if (name === 'PayrollAuthorization') expect(container.textContent).toContain('Example configured payroll authorization');
    if (name === 'SpouseOnly') {
      expect(container.querySelector('input[name="review-self-consent"]')).not.toBeNull();
      expect(container.querySelector('input[name="review-spouse-consent"]')).not.toBeNull();
    }
    if (name === 'LockedAfterReview') expect(container.querySelectorAll('button[aria-label^="Edit"]')).toHaveLength(0);
    if (name === 'AdvisorEditRequest' || name === 'Empty') {
      expect(container.textContent).not.toContain('Steps completed by your advisor');
      const edit = container.querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!;
      expect(edit).not.toBeNull();
      await act(async () => edit.click());
      const dialog = document.querySelector('[role="alertdialog"]')!;
      expect(dialog.textContent).toContain(name === 'AdvisorEditRequest' ? 'Request edit' : 'Edit your application');
      const cancel = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Cancel')!;
      await act(async () => cancel.click());
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 250)); });
      expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    }
    if (name === 'ConnecticutDisability') {
      const warning = container.querySelector('[data-review-block="connecticut-underwritten-notice"]')!;
      expect(warning).not.toBeNull();
      expect(warning.closest('[data-legal-review-section]')).toBeNull();
      expect(warning.nextElementSibling!.querySelector('input[name="review-self-consent"]')).not.toBeNull();
      expect(container.querySelector('[data-legal-review-section="read-and-sign"]')!.textContent).toContain('AUTHORIZATION:');
    }
    if (name === 'NewYorkAccidentOnly' || name === 'NewYorkChildOnlyLife') {
      const text = container.querySelector('[data-legal-review-section="read-and-sign"]')!.textContent!;
      expect(text).not.toContain('AUTHORIZATION:');
      expect(text.includes('FRAUD NOTICE:')).toBe(name === 'NewYorkAccidentOnly');
    }
    if (name === 'WithoutHealthQuestions') {
      const steps = [...container.querySelectorAll('.MuiAlert-standardWarning ol li')].map(item => item.textContent);
      expect(steps).toEqual(['Payment', 'Sign with DocuSign']);
    }
    expect(JSON.stringify(catalog)).toBe(original);
  } finally { await act(async () => root.unmount()); container.remove(); }
  expect(getPrototypeLibrary()).toBe(previous);
});
