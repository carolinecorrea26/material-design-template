import type { Meta, StoryObj } from '@storybook/react-vite';
import Home from '../../pages/Home';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
const scenario = { capability: 'optionalBeneficiaries' as const, description: 'Global template entry notice. Choose Start my application to review the notice, Cancel to remain here, or Continue to proceed within this local example.', values: {} };
const meta = { id: "pages-home-whole-page",
  title: "Components/Pages/Home/Whole page", component: Home, loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Home>;
export default meta;
export const EntryNotice: StoryObj = { render: (_args, context) => <ApplicationPageExample catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Home /></ApplicationPageExample> };
