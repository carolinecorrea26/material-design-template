import type { Meta, StoryObj } from '@storybook/react-vite';
import SpouseContact from './SpouseContact';
import ContactStoryForm from '../../../.storybook/contactStoryForm';
const meta = {
  id: "pages-contact-spouse-contact-information",
  title: "Components/Pages/Contact/Sections/Spouse contact information",
  component: SpouseContact,
  parameters: { standalone: true, catalog: { position: 2 }, layout: 'fullscreen',
    review: {
      scope: 'section-example',
      focus: 'Inspect the spouse’s independent contact fields. Phone presentation is shared; Contact’s page review covers applicant labels and spouse participation.',
      references: [{ label: 'Shared phone component', storyId: 'forms-phonefield--independent-contacts' }, { label: 'Contact member and spouse scenario', storyId: 'pages-contact-whole-page--member-and-spouse' }],
    },
  },
} satisfies Meta<typeof SpouseContact>;
export default meta;
export const Default: StoryObj = { render: () => <ContactStoryForm>{props => <SpouseContact {...props} fields={props.pageSections.find(section => section.id === "contactSpouse")!.fieldIds.flatMap(id => props.allFields.filter(field => field.id === id))} />}</ContactStoryForm> };
