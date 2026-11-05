import type { Meta, StoryObj } from '@storybook/react-vite';
import DocuSign from '../../pages/DocuSign';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const meta = { id: 'pages-esign-whole-page', title: 'Components/Pages/E-sign/Whole page', component: DocuSign,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { catalog: { pages: { Pending: 'docusign' } }, layout: 'fullscreen', docs: { description: { component: 'Actual signing page. Its existing simulation is local; there is no connected signature service.' } } },
} satisfies Meta<typeof DocuSign>;
export default meta;
export const Pending: StoryObj = { render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog}
  scenario={{ capability: 'standard', description: 'Actual signing page before simulated completion.', values: {} }}><DocuSign /></ApplicationPageExample> };
