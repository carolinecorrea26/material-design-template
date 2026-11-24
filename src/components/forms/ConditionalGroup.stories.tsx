import { useForm, useWatch } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import ConditionalGroup from './ConditionalGroup';
import FieldRenderer from './FieldRenderer';
import { resolveMappedFields } from '../../domain/requirementFields';
const fields = resolveMappedFields({ page: 'profile' });

const meta = {
  id: 'forms-conditionalgroup', title: 'Components/Forms/Conditional groups', component: ConditionalGroup,
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Follow-up border and indentation using Profile’s configured driver’s-license question and fields. The caller controls visibility.' } } },
} satisfies Meta<typeof ConditionalGroup>;
export default meta;

function LicenseExample({ expanded = false }: { expanded?: boolean }) {
  const { control, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: {
    'has-drivers-license': expanded ? 'yes' : 'no', 'drivers-license-number': '', 'drivers-license-state': '',
  } });
  const answer = useWatch({ control, name: 'has-drivers-license' });
  return <Box sx={{ maxWidth: 460 }}>
    <FieldRenderer field={fields.find(field => field.id === 'has-drivers-license')!} control={control} errors={errors} />
    {answer === 'yes' && <ConditionalGroup>
      {(['drivers-license-number', 'drivers-license-state'] as const).map(id => <FieldRenderer key={id} field={fields.find(field => field.id === id)!} control={control} errors={errors} />)}
    </ConditionalGroup>}
  </Box>;
}
export const HiddenAndRevealed: StoryObj = { name: 'Hidden and revealed', render: () => <LicenseExample /> };
export const NestedContent: StoryObj = { name: 'Grouped follow-up fields', render: () => <LicenseExample expanded /> };
