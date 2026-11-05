import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthQd from '../../pages/HealthQd';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('qd');

const meta = {
  id: "pages-health-quickdecision",
  title: "Components/Pages/Health/Whole page/QuickDecision",
  component: HealthQd,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Loading screen while the external QuickDecision questions load. The questions were not supplied and are not simulated. This example remains loading; the application retains its normal timeout handling.' } } },
} satisfies Meta<typeof HealthQd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Processing: Story = {
  name: 'External questions loading',
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthQd loadingTimeoutMs={null} /></ApplicationPageExample>,
};
