import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildGlobalTemplate } from '../../dev/storybook/globalTemplate';
import { resolveCoverageQuestionSections } from './resolveCoverageQuestionSections';

const library = buildGlobalTemplate(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
const sections = library.site.configuration.pages.find(page => page.key === 'coverage')!.sections.map(section => section.definition.value);
function fieldsFor(selectedCategories: Parameters<typeof resolveCoverageQuestionSections>[0]['selectedCategories']) {
  return resolveCoverageQuestionSections({ sections, selectedCategories }, library).flatMap(section => section.fieldIds);
}
describe('resolveCoverageQuestionSections', () => {
  it('projects canonical fields into authored question sections, excluding controls and estimates', () => {
    expect(fieldsFor(['LI'])).toEqual(['gender', 'smoker', 'tobacco-last-used', 'tobacco-products', 'spouse-gender', 'spouse-smoker', 'spouse-tobacco-last-used', 'spouse-tobacco-products']);
    expect(fieldsFor(['DI'])).toEqual(['gender', 'hours-worked-per-week', 'average-monthly-income', 'self-employed-under-one-year', 'spouse-gender', 'spouse-hours-worked-per-week', 'spouse-average-monthly-income']);
    expect(fieldsFor(['AD'])).toEqual([]);
  });
  it('keeps source section order and applies additions and removals to explicit question roles', () => {
    const result = resolveCoverageQuestionSections({ sections: [...sections].reverse(), selectedCategories: ['DI'], coverageQuestions: { always: ['selfCoverageTobacco'], removeDefaults: ['selfCoverageWorkIncome'] } }, library);
    expect(result.some(section => section.id === 'selfCoverageWorkIncome')).toBe(false);
    expect(result.find(section => section.id === 'selfCoverageTobacco')?.fieldIds).toEqual(['tobacco-last-used', 'tobacco-products']);
    expect(result.every(section => section.role === 'questions')).toBe(true);
    expect(result[0].applicant).toBe('spouse');
  });
  it('returns no follow-ups until a category is selected', () => { expect(fieldsFor([])).toEqual([]); });
});
