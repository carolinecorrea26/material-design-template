import type { Meta, StoryObj } from '@storybook/react-vite';
import { configuredComponent } from '../../domain/componentDisplayNames';
import ProfileSections from './ProfileSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';

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
    docs: { description: { component: configuredComponent('ProfileSections').description } },
  },
} satisfies Meta<typeof ProfileSections>;
export default meta;

const example = (sectionIds?: string[], initialValues: Record<string, unknown> = {}): StoryObj => ({
  render: () => <ComponentFixture>{fixture => {
    const page = fixture.site.configuration.pages.find(page => page.key === 'profile')!;
    const fields = page.fields.filter(row => row.included).map(row => row.definition);
    const sections = page.sections.map(section => section.definition.value).filter(section => !sectionIds || sectionIds.includes(section.id));
    return <SectionStoryForm fields={fields} sections={sections} initialValues={initialValues}>
      {props => <ProfileSections {...props} selfHasLife selfHasDisability spouseHasLife spouseHasDisability applicantLabels={fixture.client.applicantLabels} showApplicantLabels={{ spouse: true }} financialCalculations={fixture.client.applicantExperience?.profile?.financialCalculations} lifeReplacementNotice={fixture.client.applicantExperience?.profile?.lifeReplacementNotice} sectionNotes={fixture.content.pages.profile?.sectionNotes} disabilityCollections={{ self: fixture.fieldCollections.selfDisabilityCompanies, spouse: fixture.fieldCollections.spouseDisabilityCompanies }} />}
    </SectionStoryForm>;
  }}</ComponentFixture>,
});
export const PersonalInformation = example(['profilePersonalSelf']);
export const PersonalFollowups = example(['profilePersonalSelf'], { 'has-drivers-license': 'yes', 'intend-live-outside-us': 'yes', 'travel-outside-us-six-months': 'yes' });
export const OtherCoverage = example(['profileFinancialSelf']);
export const ExistingDisabilityRecords = example(['profileFinancialSelf'], { 'has-disability-insurance': 'yes', selfDisabilityCompanies: [{ company: 'Example Carrier', monthlyBenefitAmount: '1200', benefitPeriod: 'Age 65', waitingPeriod: '90 days' }] });
export const FinancialQuestionnaire = example(['profileFinancialQuestionnaireSelf']);
export const SelfEmployment = example(['profileFinancialQuestionnaireSelf'], { 'is-self-employed': 'yes', 'is-sole-proprietor': true, 'is-professional-corporation': true, 'work-from-home': 'yes', 'has-work-location-outside-home': 'yes' });
export const SpouseInformation = example(['profilePersonalSpouse', 'profilePersonalSpousePhysician', 'profileFinancialSpouse']);

export const AllSections = example();
