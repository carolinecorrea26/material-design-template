import type { Meta, StoryObj } from '@storybook/react-vite';
import SourceHealthFormPage, { sourceFormPreviewArgs } from '../../../../.storybook/healthForms/SourceHealthFormPage';

const meta = {
  id: "pages-health-forms-ez-4",
  title: "Components/Pages/Health/Sections/Forms/EZ-4",
  component: SourceHealthFormPage,
  parameters: { standalone: true, layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Supplied source-form preview: wording, question order, independent adult answers and source-specific follow-ups. These examples do not assign the form to a Site.', references: [{ label: 'Shared health answer', storyId: 'forms-health-question--repeated-details' }, { label: 'Shared question grouping', storyId: 'forms-health-question-list--member-and-spouse' }] }, docs: { description: { component: "Source form EZ-4, with original wording and instructions. Answers are local to this example; this preview does not assign the form to a Site. Source notes retain any referenced wording or behavior that is not yet modeled." } } },
  args: { ...sourceFormPreviewArgs, formKey: "EZ-4" },
  argTypes: {
    formKey: { table: { disable: true } },
    initialValues: { table: { disable: true } },
    jurisdiction: { control: 'select', options: ['PA', 'CA', 'VA', 'MN', 'CT', 'MD', 'IN'] },
    gender: { control: 'select', options: ['female', 'male'] },
    simplifiedIssue: { table: { disable: true } },
    omitTobacco: { table: { disable: true } },
  },
  render: (args, context) => <SourceHealthFormPage key={`${context.id}-${args.jurisdiction}-${args.gender}-${args.includeSpouse}-${args.simplifiedIssue}-${args.omitTobacco}`} {...args} />,
} satisfies Meta<typeof SourceHealthFormPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MemberOnly: Story = {};
export const MemberAndSpouse: Story = { args: { includeSpouse: true } };
