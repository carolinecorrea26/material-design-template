import type { Meta, StoryObj } from '@storybook/react-vite';
import BusinessInformation from './BusinessInformation';
import ContactStoryForm from '../../../.storybook/contactStoryForm';
const meta = {
  id: "pages-contact-business-and-employer-information",
  title: "Components/Pages/Contact/Sections/Business and employer information",
  component: BusinessInformation,
  parameters: { standalone: true, catalog: { position: 1 }, layout: 'fullscreen',
    review: {
      scope: 'section-example',
      focus: 'Inspect employer fields and same-as-home copying. Address and phone presentation use the shared components; Contact’s page review covers when this section appears.',
      references: [{ label: 'Shared address component', storyId: 'forms-field-groups-address-fields--default' }, { label: 'Shared phone component', storyId: 'forms-phonefield--independent-contacts' }, { label: 'Contact copying scenario', storyId: 'pages-contact-whole-page--business-same-as-home' }],
    },
  },
} satisfies Meta<typeof BusinessInformation>;
export default meta;
export const Default: StoryObj = { render: () => <ContactStoryForm business initialValues={{ "business-address-same-as-home": true, "street-address": "100 Example Street", city: "Example City", state: "VA", "zip-code": "22101" }}>{props => <BusinessInformation {...props} fields={props.pageSections.find(section => section.id === "contactBusinessInfo")!.fieldIds.flatMap(id => props.allFields.filter(field => field.id === id))} showEmployerDetails={props.hasDiOrOo} />}</ContactStoryForm> };
