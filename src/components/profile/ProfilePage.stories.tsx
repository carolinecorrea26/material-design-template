import type { Meta, StoryObj } from '@storybook/react-vite';
import Profile from '../../pages/Profile';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const baseValues = {
  membership: 'yes', 'birth-date': '1990-01-01', 'zip-postal-code': '10001', 'state-province': 'NY',
  'first-name': 'Jordan', 'last-name': 'Morgan', email: 'jordan@example.org',
  dependents: [], coverageSelections: ['li-term', 'di-ltd'],
  productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] },
  coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 3000 },
};
// Synthetic policy demonstrates the global capability without enabling another Site.
const financialQuestionnaire = { financialQuestionnaire: { productKeys: ['di-ltd'], minimumAmount: 7000, inclusive: true } };
const scenarios = {
  empty: { capability: 'standard', description: 'Review the real Profile page: personal details, physician details and Other coverage. Next runs shared required-field validation.', values: baseValues },
  withoutPhysician: { capability: 'standard', profile: { physicianInformation: false }, description: 'A synthetic Site hides the complete shared physician section. Physician fields and their default optionality stay global; saved physician drafts stay hidden in the page and application preview.', values: { ...baseValues, 'physician-first-name': 'Retained physician draft' } },
  withoutOtherCoverage: { capability: 'standard', profile: { otherCoverageInformation: false }, description: 'A synthetic Site hides the complete Other coverage section through the global setting. Retained Life and Disability answers do not render or block this page.', values: { ...baseValues, 'has-other-life-insurance': 'yes', 'has-disability-insurance': 'yes' } },
  followups: { capability: 'standard', description: 'Restored QD-only license/residence answers, travel answers, and existing/pending Life answers. Change each Yes to No to inspect collapse and independent bindings. NY replacement wording comes from fresh-start configuration.', values: { ...baseValues, 'has-drivers-license': 'yes', 'drivers-license-number': 'EXAMPLE123', 'drivers-license-state': 'NY', 'intend-live-outside-us': 'yes', 'outside-us-country': 'Canada', 'travel-outside-us-six-months': 'yes', 'travel-outside-us-country': 'Canada', 'has-other-life-insurance': 'yes', 'existing-life-insurance-amount': '50000', 'is-replacing-life-insurance': 'yes', 'has-pending-life-insurance-applications': 'yes', 'pending-life-insurance-company': 'Example Carrier', 'pending-life-insurance-amount': '25000' } },
  records: { capability: 'standard', description: 'Restored disability carrier record: inspect Edit, Add Company and confirmed removal using the shared DynamicList. Replacement Yes reveals its amount.', values: { ...baseValues, 'has-disability-insurance': 'yes', 'is-replacing-disability-insurance': 'yes', selfDisabilityCompanies: [{ company: 'Example Carrier', monthlyBenefitAmount: '1200', benefitPeriod: 'Age 65', waitingPeriod: '90 days' }] } as unknown as ApplicationPageScenario['values'] },
  spouse: { capability: 'standard', description: 'Member and spouse sections use independent personal, physician and Other coverage bindings. Labels and participation follow the effective applicant rules.', values: { ...baseValues, dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', productApplicants: { 'li-term': ['member', 'spouse'], 'di-ltd': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000, 'di-ltd:member': 3000, 'di-ltd:spouse': 1000 } } },
  threshold: { capability: 'standard', profile: financialQuestionnaire, description: 'Synthetic financial-questionnaire policy enabled at an inclusive $7,000 member DI threshold. This example does not enable the policy for the effective Site.', values: { ...baseValues, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 7000 }, 'is-self-employed': 'yes', 'is-sole-proprietor': true } },
  belowThreshold: { capability: 'standard', profile: financialQuestionnaire, description: 'Synthetic policy with member DI of $6,900 below its $7,000 threshold. A restored financial answer does not reveal the section.', values: { ...baseValues, coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 6900 }, 'is-self-employed': 'yes' } },
  spouseOnly: { capability: 'standard', description: 'Spouse-only DI: member personal/physician questions stay hidden, spouse SSN is optional, and Other coverage belongs to the spouse.', values: { ...baseValues, dependents: ['spouse'], coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['spouse'], 'li-term': ['member'] }, coverageAmounts: { 'di-ltd:spouse': 1000 } } },
  advisor: { capability: 'standard', description: 'Advisor flow: complete required fields and choose Next to open the existing Send application dialog. Cancel stays here; confirmation continues to the local completion message.', values: { ...baseValues, 'advisor-flow-type': 'new' } },
} satisfies Record<string, ApplicationPageScenario>;

const meta = {
  id: "pages-profile-whole-page",
  title: "Components/Pages/Profile/Whole page", component: Profile,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: {
    layout: 'fullscreen',
    review: {
      scope: 'page-composition',
      focus: 'Review Profile wording, section order, separate adult bindings, license/travel and coverage follow-ups, financial threshold and advisor handoff. Carry shared fields, layout and record-dialog review forward.',
      references: [
        { label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' },
        { label: 'Shared physician fields', storyId: 'coverage-commerce-physicianinformation--default' },
        { label: 'Shared repeated records', storyId: 'forms-dynamiclist--populated' },
        { label: 'Advisor handoff dialog', storyId: 'overlays-sendapplicationdialog--default' },
      ],
    },
    docs: { description: { component: 'The production Profile page and application frame with fresh-start template rules and fictional local answers. Whole-page scenarios are the page acceptance entry point; isolated sections support optional inspection.' } },
  },
} satisfies Meta<typeof Profile>;
export default meta;
const example = (scenario: ApplicationPageScenario): StoryObj<typeof meta> => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Profile /></ApplicationPageExample> });
export const Empty = example(scenarios.empty);
export const WithoutPhysicianInformation = example(scenarios.withoutPhysician);
export const RestoredFollowups = example(scenarios.followups);
export const DisabilityRecords = example(scenarios.records);
export const MemberAndSpouse = example(scenarios.spouse);
export const FinancialThreshold = example(scenarios.threshold);
export const BelowFinancialThreshold = example(scenarios.belowThreshold);
export const AdvisorHandoff = example(scenarios.advisor);

export const SpouseOnlyDisability = example(scenarios.spouseOnly);

export const WithoutOtherCoverageInformation = example(scenarios.withoutOtherCoverage);
