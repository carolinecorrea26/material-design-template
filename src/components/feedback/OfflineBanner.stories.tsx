import type { Meta, StoryObj } from '@storybook/react-vite';
import OfflineBanner from './OfflineBanner';
import AppHeader from '../layout/AppHeader';
import { getActiveClient } from '../../config/client/getActiveClient';
import { ApplicationFormContext } from '../../app/ApplicationFormContext';

const meta = {
  id: 'feedback-technical-error',
  title: 'Components/Feedback and overlays/Banners/Offline',
  component: OfflineBanner,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Actual connection bar above the client help bar and header. Offline is injected locally for this preview; AppShell observes online/offline events. The original Offline story URL is preserved.' } } },
} satisfies Meta<typeof OfflineBanner>;
export default meta;
export const Offline: StoryObj = {
  render: () => <ApplicationFormContext.Provider value={{ values: {}, setPageValues: () => {}, resetValues: () => {} }}>
    <OfflineBanner offline />
    <AppHeader client={getActiveClient()} variant="homepage" />
  </ApplicationFormContext.Provider>,
};
