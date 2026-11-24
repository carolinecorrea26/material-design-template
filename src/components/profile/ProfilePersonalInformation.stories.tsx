import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfilePersonalInformation from './ProfilePersonalInformation';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import ApplicantSectionDivider from '../layout/ApplicantSectionDivider';

const meta = {
  id: "pages-profile-personal-information",
  title: "Components/Pages/Profile/Sections/Personal information", component: ProfilePersonalInformation,
  parameters: {
    standalone: true, layout: 'fullscreen',
    review: {
      scope: 'shared-component',
      focus: 'One personal-information composition for either adult. Review local license, residence and travel follow-ups once; member and spouse retain independent answer IDs.',
      references: [{ label: 'Profile page composition', storyId: 'pages-profile-whole-page--member-and-spouse' }],
    },
  },
} satisfies Meta<typeof ProfilePersonalInformation>;
export default meta;
function Example({ applicants }: { applicants: Array<'self' | 'spouse'> }) {
  return <ComponentFixture>{fixture => {
    const page = fixture.site.configuration.pages.find(page => page.key === 'profile')!;
    const fields = page.fields.filter(row => row.included).map(row => row.definition);
    return <SectionStoryForm fields={fields}>{props => <>{applicants.map(applicant => <ApplicantSectionDivider key={applicant} applicant={applicant} labels={fixture.client.applicantLabels} showLabel={applicants.length > 1}>
      <ProfilePersonalInformation {...props} applicant={applicant} fieldIds={page.sections.find(section => section.definition.value.id === (applicant === 'self' ? 'profilePersonalSelf' : 'profilePersonalSpouse'))!.definition.value.fieldIds} />
    </ApplicantSectionDivider>)}</>}</SectionStoryForm>;
  }}</ComponentFixture>;
}
export const Default: StoryObj = { render: () => <Example applicants={['self']} /> };
export const Spouse: StoryObj = { render: () => <Example applicants={['spouse']} /> };
export const IndependentApplicants: StoryObj = { render: () => <Example applicants={['self', 'spouse']} /> };
