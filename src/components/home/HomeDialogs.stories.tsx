import type { Meta, StoryObj } from '@storybook/react-vite';
import Home from '../../pages/Home';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
import { getContent } from '../../content';
import { openOverlay } from '../../../.storybook/previewInteractions';
const scenario = { capability: 'optionalBeneficiaries' as const, description: 'Configured landing notice opened from the actual Home action.', values: {} };
const meta = { id: 'pages-home-whole-page', title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Entry notice', component: Home,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Home>;
export default meta;
export const LandingNotice: StoryObj = {
  render: (_args, context) => <ApplicationPageExample catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Home /></ApplicationPageExample>,
  play: async context => openOverlay(getContent().home.hero.ctaLabel)(context),
};
