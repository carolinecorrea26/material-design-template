import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthQuestionList from './HealthQuestionList';
import HealthQuestion from './HealthQuestion';
import HealthQuestionExample, { questionField, detailField } from '../../../.storybook/healthQuestionExample';

const meta = {
  id: "forms-health-question-list",
  title: "Components/Pages/Health/Sections/Question and follow-up layouts/Applicant question list", component: HealthQuestionList,
  parameters: { standalone: true, layout: 'padded', review: { scope: 'shared-component', focus: 'Questions group by identity, then member/spouse. Answers, detail records and accessible labels remain independent. The caller supplies applicant labels.' } },
} satisfies Meta<typeof HealthQuestionList>;
export default meta;
type Story = StoryObj;
function Example({ spouseOnly = false, restored = false }: { spouseOnly?: boolean; restored?: boolean }) {
  return <HealthQuestionExample restored={restored}>{form => <HealthQuestionList values={{ dependents: ['spouse'], productApplicants: { example: spouseOnly ? ['spouse'] : ['member', 'spouse'] } }} entries={(spouseOnly ? ['spouse'] as const : ['self', 'spouse'] as const).map(applicant => {
    const role = applicant === 'self' ? 'member' : 'spouse', id = `health-example-${role}`;
    return { key: 'same-medical-question', order: 0, applicant, content: <HealthQuestion control={form.control} errors={form.formState.errors} item={{ question: questionField(id), fields: [detailField('details')], repeated: true, collection: `${id}-details`, showDetails: form.watch(id) === 'yes' }} /> };
  })} />}</HealthQuestionExample>;
}
export const MemberAndSpouse: Story = { render: () => <Example /> };
export const SpouseOnly: Story = { render: () => <Example spouseOnly /> };
export const RestoredAnswers: Story = { render: () => <Example restored /> };
