import type { Meta, StoryObj } from '@storybook/react-vite';
import RecoveryPageExample from '../../../.storybook/recoveryPageExample';
import ApplicationErrorState from './ApplicationErrorState';

const meta = { id: 'pages-error-pages', title: 'Components/Pages/Error pages/Whole page', component: ApplicationErrorState,
  decorators: [Story => <RecoveryPageExample><Story /></RecoveryPageExample>],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'One shared redirect-page component with source-defined HTTP error, generic technical error, maintenance and session-expired content. Magic-link expiry is an inline error on Resume. These examples document presentation; they do not wire service failures or business flows.' } },
    catalog: { pages: { BadRequest: 'error-400', NotFound: 'error-404', ServerError: 'error-500', SessionExpired: 'session-expired', TechnicalError: 'technical-error', Maintenance: 'maintenance' } } },
} satisfies Meta<typeof ApplicationErrorState>;
export default meta;
export const BadRequest: StoryObj<typeof meta> = { args: { status: 400 } };
export const NotFound: StoryObj<typeof meta> = { args: { status: 404 } };
export const ServerError: StoryObj<typeof meta> = { args: { status: 500 } };
export const TechnicalError: StoryObj<typeof meta> = { name: 'Generic technical error', args: { status: 'technical-error' } };
export const Maintenance: StoryObj<typeof meta> = { args: { status: 'maintenance' } };
export const SessionExpired: StoryObj<typeof meta> = { args: { status: 'session-expired' } };
