import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { useContext } from 'react';
import { Box } from '@mui/material';
import FieldGrid from '../layout/FieldGrid';
import FieldRenderer from './FieldRenderer';
import { FieldDefinitionsContext } from './FieldDefinitionsContext';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';

const meta = {
  title: 'Components/Forms/Field groups/Name',
  component: FieldGrid,
  decorators: [(Story) => <ComponentFixture>{() => <Story />}</ComponentFixture>],
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Shared first-name and last-name fields, with or without the configured Title field. Both examples use the fresh-start field definitions and the same FieldGrid layout used in the application.' } } },
} satisfies Meta<typeof FieldGrid>;
export default meta;

function NameExample({ ids, columns = 'equal' }: { ids: string[]; columns?: string }) {
  const definitions = useContext(FieldDefinitionsContext);
  const { control, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: Object.fromEntries(ids.map(id => [id, ''])) });
  return <Box sx={{ maxWidth: 640 }}><FieldGrid columns={columns}>
    {ids.map(id => {
      const field = definitions?.find(field => field.id === id);
      if (!field) throw new Error(`Missing fresh-start name field: ${id}`);
      return <FieldRenderer key={id} field={field} control={control} errors={errors} />;
    })}
  </FieldGrid></Box>;
}
export const WithoutTitle: StoryObj = { render: () => <NameExample ids={['first-name', 'last-name']} /> };
export const WithTitle: StoryObj = { render: () => <NameExample ids={['title', 'first-name', 'last-name']} columns="120px 1fr 1fr" /> };
