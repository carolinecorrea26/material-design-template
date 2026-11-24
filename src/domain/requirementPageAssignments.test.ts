import { describe, expect, it } from 'vitest';
import defaults from '../../requirements/parked/pages.json';
import { freshStartSource } from './freshStartCatalog';
import { validateRequirementPageAssignments } from './requirementPagePresentation.mjs';

describe('global page configuration boundaries', () => {
  const pages = Object.values(freshStartSource().pages);
  it('fixes every page and position globally, with only the declared Beneficiary/Payment participation options', () => {
    expect(Object.entries(defaults.pages).filter(([, page]) => 'siteRequirementOptions' in page).map(([id]) => id)).toEqual(['beneficiary', 'payment']);
    expect(() => validateRequirementPageAssignments(pages, defaults)).not.toThrow();
    for (const page of pages) {
      expect(() => validateRequirementPageAssignments(pages, defaults, { example: { [page.page]: { position: page.position + 1 } } }), page.page).toThrow('Page order is global');
      for (const requirement of ['none', 'optional', 'required']) {
        const check = () => validateRequirementPageAssignments(pages, defaults, { example: { [page.page]: { requirement } } });
        if (['beneficiary', 'payment'].includes(page.page) || requirement === defaults.pages[page.page as keyof typeof defaults.pages].requirement) expect(check).not.toThrow();
        else expect(check, `${page.page}/${requirement}`).toThrow('Page participation is not configurable');
      }
    }
    expect(() => validateRequirementPageAssignments(pages, defaults, { example: { 'custom-page': { requirement: 'required' } } })).toThrow('Unknown or invalid Site page assignment');
    expect(() => validateRequirementPageAssignments(pages, defaults, { example: { payment: { requirement: 'sometimes' } } })).toThrow('Page participation is not configurable');
  });
});
