import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import ApplicationEstimate from './ApplicationEstimate';
const meta = { title: 'Components/Coverage and pricing/Application estimate', component: ApplicationEstimate, parameters: { standalone: true, layout: 'fullscreen', docs: { description: { component: 'Review-page estimate and action bar. Reserves document space, includes the page action in the same surface, and respects safe-area insets. Monthly equivalent is distinct from each selected billing frequency.' } } } } satisfies Meta<typeof ApplicationEstimate>;
export default meta;
export const WithNext: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'available', amount: 35 }} items={[{ id: 'life', name: 'Term Life · You', period: 'monthly', display: { status: 'available', amount: 25 } }, { id: 'spouse', name: 'Term Life · Your spouse', period: 'annually', display: { status: 'available', amount: 120 } }]} actions={<Button variant="contained" fullWidth>Next</Button>} /> };
export const Unavailable: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'unavailable', reason: 'technical' }} items={[]} actions={<Button variant="contained" fullWidth>Next</Button>} /> };
export const ProvidedSeparately: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'provided-separately' }} items={[]} /> };
export const HiddenByConfiguration: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'hidden' }} items={[]} actions={<Button variant="contained" fullWidth>Next</Button>} /> };

export const Loading: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'loading' }} items={[]} actions={<Button variant="contained" fullWidth>Next</Button>} /> };
export const NeedsInformation: StoryObj = { render: () => <ApplicationEstimate display={{ status: 'needs-information' }} items={[]} /> };
