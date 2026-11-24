import type { Meta, StoryObj } from '@storybook/react-vite';
import PrototypeHandoffPage from './PrototypeHandoffPage';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
import defaults from '../../../requirements/global/prototype-fixtures/handoffs.json';

const meta = {
  id: 'feedback-prototype-handoff',
  title: 'Components/Feedback and overlays/Prototype handoff', component: PrototypeHandoffPage,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'shared-component', focus: 'One or multiple supplied prototype screens. Intermediate clicks advance locally; the final click uses normal form saving and navigation. No external underwriting or signing service.' } },
} satisfies Meta<typeof PrototypeHandoffPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const scenario = { capability: 'standard' as const, description: 'Global placeholder screens, without a Site image assignment.', values: {} };
export const MultipleScreens: Story = {
  args: { pageId: 'health-qd', screens: defaults['health-qd'] },
  render: (args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}>
    <PrototypeHandoffPage {...args} />
  </ApplicationPageExample>,
};
export const SingleScreen: Story = {
  args: { pageId: 'docusign', screens: defaults.docusign },
  render: (args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}>
    <PrototypeHandoffPage {...args} />
  </ApplicationPageExample>,
};
