import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { getSitePagePrototypeUrl, getSitePrototypeUrl } from './sitePrototype';
import { generateFormDataUpToPage } from '../dev/utils/generateFormData';
import { getActiveProgressStepIndex } from './progressSteps';
import { getNextFormPageId, getPreviousFormPageId } from './formFlow';
import { resolveFormTemplate } from './template/resolveTemplate';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { ApplicationFormProvider } from '../app/ApplicationFormContext';
import Receipt from '../pages/Receipt';
import receiptExample from '../../requirements/global/prototype-fixtures/receipt-email.json';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { applicantParticipatesInPage } from './flowGates';
import { configuredHealthQuestionnaire } from '../domain/configuredHealthQuestionnaire';

afterEach(() => { installPrototypeLibrary(null); window.history.replaceState({}, '', '/'); window.sessionStorage.clear(); });

describe('Library page previews', () => {
  it('prefills a supported global Health DI example with coverage that activates its questions', () => {
    window.history.replaceState({}, '', '/health-di-supp?site=asce');
    const library = buildGlobalTemplate(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')), 'standard', undefined, undefined, undefined, undefined, undefined, undefined, undefined, { page: 'health-di-supp', product: 'di-ltd', questionnaire: 'disability' });
    installPrototypeLibrary(library);
    const values = generateFormDataUpToPage('health-di-supp');
    expect(applicantParticipatesInPage('health-di-supp', 'self', values), JSON.stringify({ selections: values.coverageSelections, amounts: values.coverageAmounts, applicants: values.productApplicants })).toBe(true);
    const questionnaire = configuredHealthQuestionnaire(library.site, 'health-di-supp', 'self', values);
    expect(questionnaire.status).toBe('resolved');
    expect(questionnaire.items.length).toBeGreaterThan(0);
  });
  it('opens Receipt from the Library URL using the shared JSON example and explicit results', () => {
    window.sessionStorage.clear();
    const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'receipt-preview');
    installPrototypeLibrary(library);
    const url = getSitePagePrototypeUrl('asce', 'receipt');
    expect(new URL(url).searchParams.get('autofill')).toBe('receipt');
    window.history.replaceState({}, '', url);
    expect(generateFormDataUpToPage('receipt')).toMatchObject(receiptExample.application);
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ApplicationFormProvider, null, createElement(Receipt))));
    expect(html).toContain('Conditionally approved');
    expect(html).not.toContain('Uh oh');
    expect(window.location.search).not.toContain('autofill');
  });
  it('opens health pages with full navigation despite a remembered single-page template', () => {
    window.sessionStorage.setItem('activeFormTemplate', 'single');
    const url = new URL(getSitePagePrototypeUrl('demo', 'health-tele'));
    expect(url.searchParams.get('site')).toBe('demo');
    expect(url.searchParams.get('autofill')).toBe('health-tele');
    expect(url.searchParams.get('template')).toBe('multi');
    window.history.replaceState({}, '', url);
    expect(resolveFormTemplate()).toBe('multi');
    const values = generateFormDataUpToPage('health-tele');
    expect(getActiveProgressStepIndex('health-tele', values)).toBeGreaterThanOrEqual(0);
    expect(getPreviousFormPageId('health-tele', values)).not.toBeNull();
    expect(getNextFormPageId('health-tele', values)).not.toBeNull();
  });
  it('lets whole-site previews use their configured template', () => {
    const url = new URL(getSitePrototypeUrl('demo'));
    expect(url.searchParams.has('template')).toBe(false);
    expect(url.searchParams.has('autofill')).toBe(false);
  });
});
