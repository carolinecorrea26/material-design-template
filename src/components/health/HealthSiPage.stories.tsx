import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthSi from '../../pages/HealthSi';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('si');
const adults = healthPageScenario('si', true);

const meta = {
  id: "pages-health-simplified-issue",
  title: "Components/Pages/Health/Whole page/Simplified Issue",
  component: HealthSi,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Simplified Issue production page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthSi>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthSi /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthSi /></ApplicationPageExample>,
};
