import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import FieldGrid from '../layout/FieldGrid';
import FieldRenderer from './FieldRenderer';
import { fieldCatalog } from '../../config/fields';

const meta = {
  title: 'Components/Forms/Field groups/Height', component: FieldGrid,
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Profile’s feet and inches fields stay on one row at all viewport widths.' } } },
} satisfies Meta<typeof FieldGrid>;
export default meta;
function HeightExample() {
  const { control, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { 'height-feet': '', 'height-inches': '' } });
  return <Box sx={{ maxWidth: 420 }}><FieldGrid columns="1fr 1fr" gap={2} keepColumns>
    {(['height-feet', 'height-inches'] as const).map(id => <FieldRenderer key={id} field={fieldCatalog[id]} control={control} errors={errors} margin="none" />)}
  </FieldGrid></Box>;
}
export const FeetAndInches: StoryObj = { render: () => <HeightExample /> };
