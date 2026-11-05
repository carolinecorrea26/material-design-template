import type { Meta, StoryObj } from '@storybook/react-vite';
import AppFooter from './AppFooter';
import { getActiveClient } from '../../config/client/getActiveClient';
import { openOverlay } from '../../../.storybook/previewInteractions';

const meta = { id: 'layout-appfooter', title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Footer documents',
  component: AppFooter, parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppFooter>;
export default meta;
export const TermsOfUse: StoryObj = { render: () => <AppFooter client={getActiveClient()} />, play: openOverlay('Terms of Use', 'link') };
export const PrivacyNotice: StoryObj = { render: () => <AppFooter client={getActiveClient()} />, play: openOverlay('Privacy Notice', 'link') };
