import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { useContext } from 'react';
import { Box } from '@mui/material';
import FieldGrid from '../layout/FieldGrid';
import FieldRenderer from './FieldRenderer';
import { fieldCatalog } from '../../config/fields';
import type { FieldId } from '../../config/fields/types';
import { FieldDefinitionsContext } from './FieldDefinitionsContext';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';

const meta = {
  title: 'Components/Forms/Field groups/Name',
  component: FieldGrid,
  decorators: [(Story) => <ComponentFixture>{() => <Story />}</ComponentFixture>],
  parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Configured name groups used by Membership, Eligibility and physician information. These are compositions of existing fields and FieldGrid, not additional field implementations.' } } },
} satisfies Meta<typeof FieldGrid>;
export default meta;

function NameExample({ ids, columns = 'equal' }: { ids: string[]; columns?: string }) {
  const definitions = useContext(FieldDefinitionsContext);
  const { control, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: Object.fromEntries(ids.map(id => [id, ''])) });
  return <Box sx={{ maxWidth: 640 }}><FieldGrid columns={columns}>
    {ids.map(id => <FieldRenderer key={id} field={definitions?.find(field => field.id === id) ?? fieldCatalog[id as FieldId]} control={control} errors={errors} />)}
  </FieldGrid></Box>;
}
export const WithoutTitle: StoryObj = { render: () => <NameExample ids={['first-name', 'last-name']} /> };
export const WithTitle: StoryObj = { render: () => <NameExample ids={['title', 'first-name', 'last-name']} columns="120px 1fr 1fr" /> };
export const WithMiddleInitial: StoryObj = { render: () => <NameExample ids={['waepa-member-first-name', 'waepa-member-middle-initial', 'waepa-member-last-name']} columns="1fr 100px 1fr" /> };
export const PhysicianName: StoryObj = { render: () => <NameExample ids={['physician-first-name', 'physician-last-name']} columns="equal" /> };
export const PhysicianNameWithTitle: StoryObj = { render: () => <NameExample ids={['ama-physician-title', 'ama-physician-first-name', 'ama-physician-last-name']} columns="120px 1fr 1fr" /> };
