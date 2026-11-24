import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography } from '@mui/material';
import PhoneField from './PhoneField';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import type { FieldDefinition } from '../../domain/fields';
import { getPhoneTypeFieldId } from '../../domain/phoneFields';
const meta = { id: "forms-phonefield",
  title: "Components/Forms/Field groups/Phone", component: PhoneField,
  parameters: { standalone: true, layout: 'padded',
    review: {
      scope: 'shared-component',
      focus: 'Review the shared number/type control once. Self, spouse and business supply independent fields and values; page reviews cover their placement and participation.',
      references: [{ label: 'Independent contact values', storyId: 'forms-phonefield--independent-contacts' }, { label: 'Contact page composition', storyId: 'pages-contact-whole-page--member-and-spouse' }],
    },
    docs: { description: { component: 'Reusable controlled phone number and optional type selector. Separate field definitions and values are supplied for each contact; no Site or application state is required.' } } },
} satisfies Meta<typeof PhoneField>;
export default meta;
function Example(props: { plain?: boolean; disabled?: boolean; error?: boolean }) {
  return <ComponentFixture>{fixture => <PhoneExample {...props} fields={fixture.fields} />}</ComponentFixture>;
}
function PhoneExample({ plain = false, disabled = false, error = false, fields }: { plain?: boolean; disabled?: boolean; error?: boolean; fields: FieldDefinition[] }) {
  const [number, setNumber] = useState(''), [type, setType] = useState('mobile');
  return <Stack sx={{ maxWidth: 440 }}><PhoneField field={{ ...fields.find(field => field.id === (plain ? 'physician-phone' : 'phone'))!, disabled }} value={number} onChange={setNumber}
    typeField={plain ? undefined : fields.find(field => field.id === 'phone-type')!} typeValue={type} onTypeChange={setType}
    hasError={error} helperText={error ? 'Enter a valid phone number.' : undefined} /></Stack>;
}
export const WithType: StoryObj = { render: () => <Example /> };
export const NumberOnly: StoryObj = { render: () => <Example plain /> };
export const Disabled: StoryObj = { render: () => <Example disabled /> };
export const Error: StoryObj = { render: () => <Example error /> };
function IndependentExample() {
  return <ComponentFixture>{fixture => <IndependentContactsExample fields={fixture.fields} />}</ComponentFixture>;
}
function IndependentContactsExample({ fields }: { fields: FieldDefinition[] }) {
  const [values, setValues] = useState<Record<string, string>>({ phone: '2025550123', 'phone-type': 'mobile', 'spouse-phone': '2025550147', 'spouse-phone-type': 'home', 'business-phone': '2025550189', 'business-phone-type': 'business' });
  return <Stack spacing={2} sx={{ maxWidth: 480 }}>
    {([{ name: 'Self', id: 'phone' }, { name: 'Spouse', id: 'spouse-phone' }, { name: 'Business', id: 'business-phone' }] as const).map(({ name, id }) => {
      const field = fields.find(field => field.id === id)!, typeId = getPhoneTypeFieldId(field), type = fields.find(field => field.id === typeId)!;
      return <Stack key={id}><Typography variant="subtitle2">{name}</Typography><PhoneField field={field} value={values[id]} onChange={value => setValues(previous => ({ ...previous, [id]: value }))}
        typeField={type} typeValue={values[typeId]} onTypeChange={value => setValues(previous => ({ ...previous, [typeId]: value }))} /></Stack>;
    })}
  </Stack>;
}
export const IndependentContacts: StoryObj = { render: () => <IndependentExample /> };
