import { afterEach, describe, expect, it } from 'vitest';
import { getSitePagePrototypeUrl, getSitePrototypeUrl } from './sitePrototype';
import { generateFormDataUpToPage } from '../dev/utils/generateFormData';
import { getActiveProgressStepIndex } from './progressSteps';
import { getNextFormPageId, getPreviousFormPageId } from './formFlow';
import { resolveFormTemplate } from './template/resolveTemplate';

afterEach(() => { window.history.replaceState({}, '', '/'); window.sessionStorage.clear(); });

describe('Library page previews', () => {
  it('opens health pages with full navigation despite a remembered single-page template', () => {
    window.sessionStorage.setItem('activeFormTemplate', 'single');
    const url = new URL(getSitePagePrototypeUrl('demo', 'health-li'));
    expect(url.searchParams.get('site')).toBe('demo');
    expect(url.searchParams.get('autofill')).toBe('health-li');
    expect(url.searchParams.get('template')).toBe('multi');
    window.history.replaceState({}, '', url);
    expect(resolveFormTemplate()).toBe('multi');
    const values = generateFormDataUpToPage('health-li');
    expect(getActiveProgressStepIndex('health-li', values)).toBeGreaterThanOrEqual(0);
    expect(getPreviousFormPageId('health-li', values)).not.toBeNull();
    expect(getNextFormPageId('health-li', values)).not.toBeNull();
  });
  it('lets whole-site previews use their configured template', () => {
    const url = new URL(getSitePrototypeUrl('demo'));
    expect(url.searchParams.has('template')).toBe(false);
    expect(url.searchParams.has('autofill')).toBe(false);
  });
});
