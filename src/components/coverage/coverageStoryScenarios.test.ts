import { readFileSync } from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { installPrototypeLibrary } from '../../domain/prototypeLibrary';
import { resolveApplicationCoverage } from '../../domain/coverageRuntime';
import { coverageStoryBaseValues, coverageStoryScenarios, type CoverageStoryScenario } from './coverageStoryScenarios';
import { buildGlobalTemplate } from '../../dev/storybook/globalTemplate';
const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')); 
afterEach(() => installPrototypeLibrary(null));
function fixture(scenario: CoverageStoryScenario) {
  const library = buildGlobalTemplate(catalog, scenario.capability, undefined, undefined, scenario.coverage);
  installPrototypeLibrary(library);
  return { library, values: { ...coverageStoryBaseValues, ...scenario.values } };
}
it.each(Object.entries(coverageStoryScenarios))('uses existing saved products and categories for %s', (_name, scenario) => {
  const { library, values } = fixture(scenario);
  for (const category of scenario.categories) expect(library.products.some(product => product.categoryId === category)).toBe(true);
  for (const product of values.coverageSelections as string[] ?? []) expect(library.products.some(row => row.id === product)).toBe(true);
});
it('derives unavailable disability from work hours and allows recovery at the saved threshold', () => {
  const { library, values } = fixture(coverageStoryScenarios.diWorkHours);
  const product = library.products.find(product => product.id === 'di-ltd')!;
  expect(resolveApplicationCoverage(product, 'member', values, library.products).eligibility).toBe('ineligible');
  const minimum = product.requirements!.eligibility!.find(rule => rule.applicantType === 'member')!.minimumWorkHoursPerWeek!;
  expect(resolveApplicationCoverage(product, 'member', { ...values, 'hours-worked-per-week': String(minimum) }, library.products).eligibility).toBe('eligible');
});
it('keeps missing work hours unresolved instead of asserting ineligibility', () => {
  const { library, values } = fixture(coverageStoryScenarios.missingWorkHours);
  const product = library.products.find(product => product.id === 'di-ltd')!;
  const behavior = resolveApplicationCoverage(product, 'member', values, library.products);
  expect(behavior.eligibility).toBe('needs-information');
  expect(behavior.selectable).toBe(false);
});
