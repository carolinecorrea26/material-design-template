import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthQd from '../../pages/HealthQd';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('qd');

const meta = {
  id: "pages-health-quickdecision",
  title: "Components/Pages/Health/Whole page/QD",
  component: HealthQd,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { catalog: { pages: { Processing: 'health-qd' } }, layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Effective image assignment and click-through behavior in the real application frame. The shared handoff owns sequence, pending/error states and fallback.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Shared prototype handoff', storyId: 'feedback-prototype-handoff--multiple-screens' }] }, docs: { description: { component: 'Full-screen prototype handoff. Click through both supplied statement-of-health images, then continue through the configured application flow.' } } },
} satisfies Meta<typeof HealthQd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Processing: Story = {
  name: 'External questions images',
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthQd /></ApplicationPageExample>,
};
