import type { Meta, StoryObj } from '@storybook/react-vite';
import ResidentialAddress from './ResidentialAddress';
import ContactStoryForm from '../../../.storybook/contactStoryForm';
const meta = {
  id: "pages-contact-residential-address",
  title: "Components/Pages/Contact/Sections/Residential address",
  component: ResidentialAddress,
  parameters: { standalone: true, catalog: { position: 0 }, layout: 'fullscreen',
    review: {
      scope: 'section-example',
      focus: 'Inspect Contact’s residential fields and correspondence control in isolation. The address UI is shared with business addresses; this example does not require another approval of that layout.',
      references: [{ label: 'Shared address component', storyId: 'forms-field-groups-address-fields--default' }, { label: 'Review Contact as a page', storyId: 'pages-contact-whole-page--empty' }],
    },
  },
} satisfies Meta<typeof ResidentialAddress>;
export default meta;
export const Default: StoryObj = { render: () => <ContactStoryForm>{props => <ResidentialAddress {...props} fields={props.pageSections.find(section => section.id === "contactResidentialAddress")!.fieldIds.flatMap(id => props.allFields.filter(field => field.id === id))} />}</ContactStoryForm> };
