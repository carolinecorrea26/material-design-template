import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '@mui/material';
import SectionDivider, { FieldGroup } from './SectionDivider';
import FieldGrid from './FieldGrid';
import FieldRenderer from '../forms/FieldRenderer';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { resolveMappedFields } from '../../domain/requirementFields';

const fields = [...resolveMappedFields({component: 'membership'}), ...resolveMappedFields({page: 'profile'})];
const meta = {
  id: 'layout-sectiondivider',
  title: 'Components/Layout/Headings and dividers/Section divider',
  component: SectionDivider,
  parameters: { layout: 'padded', docs: { description: { component: 'Titled subsection and untitled field-group surfaces used in the application, with fresh-start fields.' } } },
} satisfies Meta<typeof SectionDivider>;
export default meta;
function Example({ titled = false }: { titled?: boolean }) {
  const ids = titled ? ['height-feet', 'height-inches', 'weight-lbs'] : ['first-name', 'last-name', 'email'];
  return <SectionStoryForm fields={fields}>{props => {
    const content = <Stack spacing={2}><FieldGrid columns="equal">{ids.slice(0, 2).map(id => <FieldRenderer key={id} field={fields.find(field => field.id === id)!} control={props.control} errors={props.errors} />)}</FieldGrid><FieldRenderer field={fields.find(field => field.id === ids[2])!} control={props.control} errors={props.errors} /></Stack>;
    return titled ? <SectionDivider label="Personal information" variant="subsection">{content}</SectionDivider> : <FieldGroup>{content}</FieldGroup>;
  }}</SectionStoryForm>;
}
export const SubsectionPreset: StoryObj = { name: 'Titled subsection', render: () => <Example titled /> };
export const UntitledGroup: StoryObj = { render: () => <Example /> };
