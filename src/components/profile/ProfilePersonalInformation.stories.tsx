import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfilePersonalInformation from './ProfilePersonalInformation';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { fieldCatalog } from '../../config/fields';
import { pageSections } from '../../config/pageSections/pageSections';

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
const fields = Object.values(fieldCatalog);
const fieldIds = (applicant: 'self' | 'spouse') => (pageSections.profile ?? []).find(section => section.id === (applicant === 'self' ? 'profilePersonalSelf' : 'profilePersonalSpouse'))!.fieldIds;
export const Default: StoryObj = {
  render: () => <SectionStoryForm fields={fields}>{props => <ProfilePersonalInformation {...props} fieldIds={fieldIds('self')} />}</SectionStoryForm>,
};
export const Spouse: StoryObj = {
  render: () => <SectionStoryForm fields={fields}>{props => <ProfilePersonalInformation {...props} applicant="spouse" fieldIds={fieldIds('spouse')} />}</SectionStoryForm>,
};
export const IndependentApplicants: StoryObj = {
  render: () => <SectionStoryForm fields={fields}>{props => <>
    <h2>Member</h2><ProfilePersonalInformation {...props} fieldIds={fieldIds('self')} />
    <h2>Spouse</h2><ProfilePersonalInformation {...props} applicant="spouse" fieldIds={fieldIds('spouse')} />
  </>}</SectionStoryForm>,
};
