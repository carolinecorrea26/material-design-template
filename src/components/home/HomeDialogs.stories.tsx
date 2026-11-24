import type { Meta, StoryObj } from '@storybook/react-vite';
import Home from '../../pages/Home';
import { readSharedCatalog } from '../../persistence/sharedCatalog';
import { EntryNotice } from './HomePage.stories';
import { getContent } from '../../content';
import { openOverlay } from '../../../.storybook/previewInteractions';
const meta = { id: 'pages-home-whole-page', title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Entry notice', component: Home,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Home>;
export default meta;
export const LandingNotice: StoryObj = {
  ...EntryNotice,
  play: async context => openOverlay(getContent().home.hero.ctaLabel, 'link')(context),
};
