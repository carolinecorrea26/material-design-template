import type { Meta, StoryObj } from '@storybook/react-vite';
import ClientHelpBanner from './ClientHelpBanner';
import { getActiveClient } from '../../config/client/getActiveClient';
import { openOverlay } from '../../../.storybook/previewInteractions';
const meta = { id: 'layout-clienthelpbanner', title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Schedule a call', component: ClientHelpBanner,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Actual support dialog and iframe container. The scheduling provider is replaced by a blank local frame; no external booking service is contacted.' } } } } satisfies Meta<typeof ClientHelpBanner>;
export default meta;
export const ScheduleCall: StoryObj = {
  render: () => { const client = getActiveClient(); return <ClientHelpBanner client={{ ...client, support: { ...client.support, phone: '800-555-0100', phoneDisplay: '(800) 555-0100' }, features: { ...client.features, scheduleUrl: 'about:blank' } }} />; },
  play: openOverlay('Schedule a call'),
};
