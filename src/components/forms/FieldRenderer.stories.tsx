import { getPhoneTypeFieldId } from '../../domain/phoneFields';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import FieldRenderer from './FieldRenderer';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import { resolveMappedFields } from '../../domain/requirementFields';
import type { FieldDefinition } from '../../domain/fields';

// Select existing authored fields; examples never define a second field schema.
const definitions = [
  ...resolveMappedFields({ component: 'membership' }, { includeAll: true }),
  ...resolveMappedFields({ component: 'quote-calculator' }),
  ...resolveMappedFields({ component: 'eligibility' }),
  ...resolveMappedFields({ page: 'contact' }),
  ...resolveMappedFields({ page: 'profile' }),
  ...resolveMappedFields({ page: 'payment' }),
  ...resolveMappedFields({ page: 'health-di-supp' }),
  ...resolveMappedFields({ page: 'beneficiary' }, { person: 'beneficiary' }),
];
const fields = definitions.filter((field, index) => definitions.findIndex(candidate => candidate.id === field.id) === index);
function authored(id: string): FieldDefinition {
  const field = fields.find(field => field.id === id);
  if (!field) throw new Error(`Missing authored field example: ${id}`);
  return field;
}
const meta = {
  id: 'forms-fieldrenderer', title: 'Components/Forms/Individual fields', component: FieldRenderer,
  argTypes: { control: { table: { disable: true } }, errors: { table: { disable: true } } },
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Actual fresh-start fields rendered by the shared input component. Variations demonstrate distinct controls, label placement, validation or disabled states.' } } },
} satisfies Meta<typeof FieldRenderer>;
export default meta;

type DemoValues = Record<string, string | boolean | string[]>;
function FieldHarness({ field, forceError = false }: { field: FieldDefinition; forceError?: boolean }) {
  const { control, trigger, formState: { errors } } = useForm<DemoValues>({ mode: 'onChange', defaultValues: {
    [field.id]: field.inputType === 'checkbox' ? false : ['checkbox-group', 'multi-select'].includes(field.inputType) ? [] : '',
    [getPhoneTypeFieldId(field)]: 'mobile',
  } });
  useEffect(() => { if (forceError) void trigger(); }, [forceError, trigger]);
  return <ComponentFixture>{() => <Box sx={{ maxWidth: 480 }}><FieldRenderer field={field} control={control} errors={errors} /></Box>}</ComponentFixture>;
}
export const Playground: StoryObj<{ fieldId: string }> = {
  args: { fieldId: 'first-name' },
  argTypes: { fieldId: { control: 'select', options: fields.map(field => field.id) } },
  render: ({ fieldId }) => <FieldHarness key={fieldId} field={authored(fieldId)} />,
};
export const TextFloatingLabel: StoryObj = { render: () => <FieldHarness field={authored('first-name')} /> };
export const TextStandardLabel: StoryObj = { name: 'Text — standard label', render: () => <FieldHarness field={authored('health-di-fall-type')} /> };
export const Email: StoryObj = { render: () => <FieldHarness field={authored('email')} /> };
export const PhoneWithTypeSelector: StoryObj = { name: 'Phone — with type selector', render: () => <FieldHarness field={authored('phone')} /> };
export const PhonePlain: StoryObj = { name: 'Phone — no type selector', render: () => <FieldHarness field={authored('physician-phone')} /> };
export const NumberInput: StoryObj = { name: 'Number', render: () => <FieldHarness field={authored('hours-worked-per-week')} /> };
export const Currency: StoryObj = { render: () => <FieldHarness field={authored('average-monthly-income')} /> };
export const Percent: StoryObj = { render: () => <FieldHarness field={authored('beneficiary-share')} /> };
export const Ssn: StoryObj = { name: 'SSN', render: () => <FieldHarness field={authored('social-security-number')} /> };
export const DateInput: StoryObj = { name: 'Date', render: () => <FieldHarness field={authored('birth-date')} /> };
export const MonthYear: StoryObj = { render: () => <FieldHarness field={authored('health-detail-onset')} /> };
export const Textarea: StoryObj = { render: () => <FieldHarness field={authored('work-location-details')} /> };
export const DropdownFloatingLabel: StoryObj = { name: 'Dropdown — floating label', render: () => <FieldHarness field={authored('title')} /> };
export const DropdownStandardLabel: StoryObj = { name: 'Dropdown — standard label', render: () => <FieldHarness field={{ ...authored('title'), labelVariant: 'standard' }} /> };
export const SearchableSelect: StoryObj = { render: () => <FieldHarness field={authored('state-province')} /> };
export const MultiSelect: StoryObj = { render: () => <FieldHarness field={authored('tobacco-products')} /> };
export const Radio: StoryObj = { render: () => <FieldHarness field={authored('gender')} /> };
export const CheckboxSingle: StoryObj = { name: 'Checkbox — single', render: () => <FieldHarness field={authored('bank-authorization')} /> };
export const CheckboxGroup: StoryObj = { render: () => <FieldHarness field={authored('dependents')} /> };
export const Disabled: StoryObj = { render: () => <FieldHarness field={{ ...authored('first-name'), disabled: true }} /> };
export const TextErrorRequired: StoryObj = { name: 'Error — required text', render: () => <FieldHarness forceError field={authored('email')} /> };
export const DropdownErrorRequired: StoryObj = { name: 'Error — required dropdown', render: () => <FieldHarness forceError field={authored('marital-status')} /> };
export const RadioErrorRequired: StoryObj = { name: 'Error — required radio group', render: () => <FieldHarness forceError field={authored('gender')} /> };
export const CheckboxErrorRequired: StoryObj = { name: 'Error — required checkbox', render: () => <FieldHarness forceError field={authored('bank-authorization')} /> };
export const CompletionIconsDebugMode: StoryObj = {
  name: 'Completion icons (debug — ?inputChecks)',
  render: () => {
    const hasParam = new URLSearchParams(window.location.search).has('inputChecks');
    const toggle = () => { const url = new URL(window.location.href); if (hasParam) url.searchParams.delete('inputChecks'); else url.searchParams.set('inputChecks', '1'); window.location.href = url.toString(); };
    return <Box><button type="button" onClick={toggle}>{hasParam ? 'Disable' : 'Enable'} completion icons (reloads the preview)</button><FieldHarness field={authored('first-name')} /></Box>;
  },
};
