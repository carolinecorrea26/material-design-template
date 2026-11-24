import type { Meta, StoryObj } from '@storybook/react-vite';
import DocuSign from '../../pages/DocuSign';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const meta = { id: 'pages-esign-whole-page', title: 'Components/Pages/E-sign/Whole page', component: DocuSign,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { review: { scope: 'page-composition', focus: 'Review the effective external-screen assignment and shared save/transition boundary. The image simulates signing; production signer and document requirements are recorded in the fresh-start rules.', references: [{ label: 'Shared prototype handoff', storyId: 'feedback-prototype-handoff--single-screen' }] }, catalog: { pages: { Pending: 'docusign' } }, layout: 'fullscreen', docs: { description: { component: 'Full-screen supplied DocuSign prototype image. Clicking the image continues through the normal transition; no signature service is connected.' } } },
} satisfies Meta<typeof DocuSign>;
export default meta;
export const Pending: StoryObj = { name: 'External signing image', render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog}
  scenario={{ capability: 'standard', description: 'Shared signing handoff with click-through navigation.', values: {} }}><DocuSign /></ApplicationPageExample> };
