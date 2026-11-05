import type { Meta, StoryObj } from '@storybook/react-vite';
import ApplicationRecoveryActions from './ApplicationRecoveryActions';

const meta = { id: "pages-shared-application-recovery-actions",
  title: "Components/Feedback and overlays/Alerts/Recovery actions", component: ApplicationRecoveryActions } satisfies Meta<typeof ApplicationRecoveryActions>;
export default meta;
export const Default: StoryObj<typeof meta> = { render: () => <ApplicationRecoveryActions /> };
export const MissingPageLinks: StoryObj<typeof meta> = { args: { actions: ['home', 'resume'], appearance: 'links' } };
