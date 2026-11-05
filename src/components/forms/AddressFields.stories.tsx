import type { Meta, StoryObj } from '@storybook/react-vite';
import AddressFields, { addressFieldNames } from './AddressFields';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { fieldCatalog } from '../../config/fields';
const meta = {
  id: "forms-field-groups-address-fields",
  title: "Components/Forms/Field groups/Address", component: AddressFields,
  parameters: {
    standalone: true, layout: 'fullscreen',
    review: {
      scope: 'shared-component',
      focus: 'The shared address layout and field feedback used for residential, business and physician addresses. Each address supplies its own field definitions and values. Page reviews only cover placement and address-specific behavior.',
      references: [{ label: 'Contact page composition', storyId: 'pages-contact-whole-page--empty' }, { label: 'Profile physician composition', storyId: 'coverage-commerce-physicianinformation--default' }],
    },
  },
} satisfies Meta<typeof AddressFields>;
export default meta;
export const Default: StoryObj = { render: () => <SectionStoryForm fields={addressFieldNames.map(id => fieldCatalog[id])}>{props => <AddressFields fields={props.allFields} control={props.control} errors={props.errors} />}</SectionStoryForm> };

const physicianAddressIds = (prefix = '') => ({
  'street-address': `${prefix}medical-facility-street-address`, 'apt-suite': `${prefix}medical-facility-apt-suite`,
  city: `${prefix}medical-city`, state: `${prefix}medical-state`, 'zip-code': `${prefix}medical-zip-code`,
});
const mappedIds = [...Object.values(physicianAddressIds()), ...Object.values(physicianAddressIds('spouse-'))];
const mappedFields = Object.values(fieldCatalog).filter(field => mappedIds.includes(field.id));
export const MappedPhysicianAddresses: StoryObj = {
  render: () => <SectionStoryForm fields={mappedFields} initialValues={{
    'medical-facility-street-address': '100 Example Clinic Road',
    'spouse-medical-facility-street-address': '200 Other Clinic Road',
  }}>{props => <>
    <h2>Member physician address</h2><AddressFields {...props} fields={mappedFields} fieldIds={physicianAddressIds()} />
    <h2>Spouse physician address</h2><AddressFields {...props} fields={mappedFields} fieldIds={physicianAddressIds('spouse-')} />
  </>}</SectionStoryForm>,
};
