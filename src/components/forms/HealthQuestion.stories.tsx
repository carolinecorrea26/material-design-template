import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthQuestion from './HealthQuestion';
import HealthQuestionExample, { questionField, detailField } from '../../../.storybook/healthQuestionExample';

const meta = {
  id: "forms-health-question",
  title: "Components/Pages/Health/Sections/Question and follow-up layouts/Question", component: HealthQuestion,
  parameters: { standalone: true, layout: 'padded', review: { scope: 'shared-component', focus: 'Explicit answer, direct or repeated details, restored records, required feedback and local dialogs. No Site or application state is needed.' } },
} satisfies Meta<typeof HealthQuestion>;
export default meta;
type Story = StoryObj;
export const RepeatedDetails: Story = {
  render: () => <HealthQuestionExample>{form => <HealthQuestion control={form.control} errors={form.formState.errors} item={{ question: questionField('health-example-member'), fields: [detailField('details')], repeated: true, collection: 'health-example-member-details', showDetails: form.watch('health-example-member') === 'yes' }} />}</HealthQuestionExample>,
};
export const DirectDetails: Story = {
  render: () => <HealthQuestionExample>{form => <HealthQuestion control={form.control} errors={form.formState.errors} item={{ question: questionField('health-example-member'), fields: [detailField('health-example-details')], collection: '', showDetails: form.watch('health-example-member') === 'yes' }} />}</HealthQuestionExample>,
};
export const RestoredRecord: Story = {
  render: () => <HealthQuestionExample restored>{form => <HealthQuestion control={form.control} errors={form.formState.errors} item={{ question: questionField('health-example-member'), fields: [detailField('details')], repeated: true, collection: 'health-example-member-details', showDetails: form.watch('health-example-member') === 'yes' }} />}</HealthQuestionExample>,
};
