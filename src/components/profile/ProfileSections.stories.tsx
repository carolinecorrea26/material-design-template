import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfileSections from './ProfileSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { fieldCatalog } from '../../config/fields';
import { pageSections } from '../../config/pageSections/pageSections';

const meta = {
  id: "pages-profile-sections",
  title: "Components/Pages/Profile/Sections/Section compositions",
  component: ProfileSections,
  parameters: {
    standalone: true, layout: 'fullscreen', catalog: { position: 0 },
    review: {
      scope: 'section-example',
      focus: 'Optional inspection of the production Profile sections with explicit fields and local answers. Site participation and coverage thresholds are resolved by the application page.',
      references: [
        { label: 'Review Profile as a page', storyId: 'pages-profile-whole-page--empty' },
        { label: 'Shared personal fields', storyId: 'pages-profile-personal-information--independent-applicants' },
        { label: 'Shared physician fields', storyId: 'coverage-commerce-physicianinformation--default' },
        { label: 'Shared repeated records', storyId: 'forms-dynamiclist--populated' },
      ],
    },
    docs: { description: { component: 'Personal information, physician details, other coverage and the member financial questionnaire. The page supplies visible sections, applicant labels, coverage flags, notice wording and collection configuration. Local answers reveal follow-ups; DynamicList owns carrier record dialogs.' } },
  },
} satisfies Meta<typeof ProfileSections>;
export default meta;

const fields = Object.values(fieldCatalog);
const example = (sectionIds: string[], initialValues: Record<string, unknown> = {}): StoryObj => ({
  render: () => <SectionStoryForm fields={fields} sections={(pageSections.profile ?? []).filter(section => sectionIds.includes(section.id))} initialValues={initialValues}>
    {props => <ProfileSections {...props} selfHasLife selfHasDisability spouseHasLife spouseHasDisability showApplicantLabels={{ spouse: true }} />}
  </SectionStoryForm>,
});
export const PersonalInformation = example(['profilePersonalSelf']);
export const PersonalFollowups = example(['profilePersonalSelf'], { 'has-drivers-license': 'yes', 'intend-live-outside-us': 'yes', 'travel-outside-us-six-months': 'yes' });
export const OtherCoverage = example(['profileFinancialSelf']);
export const ExistingDisabilityRecords = example(['profileFinancialSelf'], { 'has-disability-insurance': 'yes', selfDisabilityCompanies: [{ company: 'Example Carrier', monthlyBenefitAmount: '1200', benefitPeriod: 'Age 65', waitingPeriod: '90 days' }] });
export const FinancialQuestionnaire = example(['profileFinancialQuestionnaireSelf']);
export const SelfEmployment = example(['profileFinancialQuestionnaireSelf'], { 'is-self-employed': 'yes', 'is-sole-proprietor': true, 'is-professional-corporation': true, 'has-work-location-outside-home': 'yes' });
export const SpouseInformation = example(['profilePersonalSpouse', 'profilePersonalSpousePhysician', 'profileFinancialSpouse']);
export const MemberPhysician = example(['profilePersonalSelfPhysician']);
export const SpousePhysician = example(['profilePersonalSpousePhysician']);
export const SpouseOtherCoverage = example(['profileFinancialSpouse']);
export const AllSections = example((pageSections.profile ?? []).map(section => section.id));
