import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Stack } from '@mui/material';
import StandaloneFormPage from './StandaloneFormPage';
import FieldRenderer from '../forms/FieldRenderer';
import { useForm } from 'react-hook-form';
import { resolveMappedFields } from '../../domain/requirementFields';
import { getPageTitle, getPageSubhead } from '../../config/pages';

const meta = {
  id: 'layout-standalone-form-page', title: 'Components/Layout/Containers/Standalone form page', component: StandaloneFormPage,
  parameters: { layout: 'fullscreen', standalone: true },
} satisfies Meta<typeof StandaloneFormPage>;
export default meta;
function Example() {
  const field = resolveMappedFields({ page: 'resume' }).find(field => field.id === 'resume-email')!;
  const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { [field.id]: '' } });
  return <StandaloneFormPage title={getPageTitle('resume')} subhead={getPageSubhead('resume')} onBack={() => {}}>
    <Stack component="form" spacing={2} onSubmit={form.handleSubmit(() => {})}>
      <FieldRenderer field={field} control={form.control} errors={form.formState.errors} />
      <Button type="submit" variant="contained">Continue</Button>
    </Stack>
  </StandaloneFormPage>;
}
export const Default: StoryObj = { render: () => <Example /> };
