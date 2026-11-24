import type { Meta, StoryObj } from '@storybook/react-vite';
import SiteSupport from './SiteSupport';
import { configuredComponent } from '../../domain/componentDisplayNames';

const meta = { id: "pages-shared-site-support",
  title: "Components/Content and data display/Help and support/Support details", component: SiteSupport, parameters: {
    layout: 'padded', docs: { description: { component: configuredComponent('SiteSupport').description } },
  } } satisfies Meta<typeof SiteSupport>;
export default meta;
export const CurrentSite: StoryObj<typeof meta> = { render: () => <SiteSupport /> };
export const ApplicationId: StoryObj<typeof meta> = { args: { applicationId: 'APP-12345678' } };
export const ConfirmationId: StoryObj<typeof meta> = { args: { confirmationId: 'CONF-12345678' } };
export const EmailOnly: StoryObj<typeof meta> = { name: 'Client email contact only', args: { contact: { name: 'Plan administrator', acronym: '', phone: '', email: 'support@example.invalid', website: '', hideInEmail: false } } };
export const EmailPresentation: StoryObj<typeof meta> = { args: { presentation: 'email', applicationId: 'APP-12345678' } };
