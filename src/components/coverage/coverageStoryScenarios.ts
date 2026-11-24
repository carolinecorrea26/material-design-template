import type { TemplateCapability, CoverageExampleConfiguration } from '../../dev/storybook/globalTemplate';
import type { ApplicationFormValues } from '../../app/ApplicationFormContext';
import type { CoverageCategoryId } from '../../config/coverageCategories';

export type CoverageStoryScenario = {
  capability: TemplateCapability;
  coverage?: CoverageExampleConfiguration;
  categories: CoverageCategoryId[];
  description: string;
  values?: ApplicationFormValues;
  editableWorkFacts?: boolean;
  rateUnavailable?: boolean;
  previewState?: "loading" | "recalculating";
};
export const coverageStoryBaseValues: ApplicationFormValues = {
  membership: 'yes', 'birth-date': '1990-01-01', 'zip-postal-code': '22101', 'state-province': 'VA',
  gender: 'female', smoker: 'no', 'actively-at-work': 'yes', 'active-military': 'no',
  'hours-worked-per-week': '40', 'average-monthly-income': '10000', 'self-employed-under-one-year': 'no', dependents: [],
};
const selected = (ids: string[]): ApplicationFormValues => ({
  coverageSelections: ids,
  productApplicants: Object.fromEntries(ids.map(id => [id, ['member']])),
  coverageAmounts: Object.fromEntries(ids.map(id => [`${id}:member`, id.startsWith('di-') ? 1000 : 100000])),
});

/** Fictional applicant inputs; all product rules and definitions come from the saved catalog. */
export const coverageStoryScenarios = {
  firstProduct: { capability: 'standard', categories: ['LI'], description: 'Start with an empty cart. Add a product to open the Coverage added drawer; close it to continue shopping.' },
  additionalProduct: { capability: 'standard', categories: ['LI'], description: 'Term Life is already selected. Add another available product: the total updates and the compact Added message appears.', values: selected(['li-term']) },
  addAfterClearingCart: { capability: 'standard', categories: ['LI'], description: 'A product was already selected. Remove it with its Add coverage checkbox, then add another product. The later-add message is used even after the cart returns to empty.', values: selected(['li-term']) },
  diWorkHours: { capability: 'standard', categories: ['DI'], description: 'Configured disability requires at least 30 work hours per week. This applicant works 20. Change the work hours to compare the unavailable and eligible states.', values: { 'hours-worked-per-week': '20' }, editableWorkFacts: true },
  missingWorkHours: { capability: 'standard', categories: ['DI'], description: 'Work hours have not been supplied. Required-information feedback blocks continuing until the facts are complete; Add coverage remains usable.', values: { 'hours-worked-per-week': '' }, editableWorkFacts: true },
  missingIncome: { capability: 'standard', categories: ['DI'], description: 'Income has not been supplied. Review the benefit-limit feedback, then enter income to resolve available amounts.', values: { 'average-monthly-income': '' }, editableWorkFacts: true },
  mixedEligibility: { capability: 'standard', categories: ['LI', 'DI'], description: 'Life remains available while disability is unavailable because the applicant works only 20 hours per week.', values: { 'hours-worked-per-week': '20' }, editableWorkFacts: true },
  spouseIneligible: { capability: 'standard', categories: ['DI'], description: 'The member meets work-hour eligibility; the spouse does not. Only eligible applicant options are offered.', values: { dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', 'spouse-gender': 'female', 'spouse-smoker': 'no', 'spouse-hours-worked-per-week': '20', 'spouse-average-monthly-income': '5000' } },
  selectedOptions: { capability: 'standard', categories: ['DI'], description: 'Selected disability coverage exposes its configured waiting and benefit periods. Change options and review recalculation.', values: selected(['di-ltd']) },
  riders: { capability: 'standard', categories: ['LI'], description: 'Selected Term Life exposes its assigned Chronic Illness Rider choice and notes.', values: selected(['li-term']) },
  rateUnavailable: { capability: 'standard', categories: ['LI'], description: 'A mock-rate request fails in this local scenario. The selected product stays in the summary and the rate display shows its technical-unavailable state; no external service is contacted.', values: selected(['li-term']), rateUnavailable: true },
  referenceRates: { capability: 'standard', coverage: { referenceRates: true }, categories: ['DI'], description: 'The template supports configured reference-rate presentation. Inspect the reference link/drawer without substituting a calculated premium.', values: { ...selected(['di-ltd']), 'state-province': 'NY', 'zip-postal-code': '10001' } },
  loading: { capability: 'standard', categories: ['LI'], description: 'Persistent product-loading state for visual and accessibility review.', previewState: 'loading' },
  recalculating: { capability: 'standard', categories: ['LI'], description: 'Persistent recalculation state for the selected product and combined cost.', values: selected(['li-term']), previewState: 'recalculating' },
  noCategory: { capability: 'standard', categories: [], description: 'No category is selected, so product reveal stays hidden.' },
} satisfies Record<string, CoverageStoryScenario>;
