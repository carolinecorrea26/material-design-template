import type { Meta, StoryObj } from '@storybook/react-vite';
import ConfiguredApplicationDocumentPreview from '../../app/sections/ConfiguredApplicationDocumentPreview';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const values = { membership: 'yes', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1990-01-15', 'zip-postal-code': '10001', 'state-province': 'NY',
  coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 } };
const meta = { title: 'Components/Pages/Review/Sections/Application document', component: ConfiguredApplicationDocumentPreview,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'padded' },
} satisfies Meta<typeof ConfiguredApplicationDocumentPreview>;
export default meta;
export const Default: StoryObj = { render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog}
  scenario={{ capability: 'multipleTerms', description: 'Review’s actual document adapter and saved field grouping, with fictional answers.', values }}>
  <ConfiguredApplicationDocumentPreview values={values} signatureName="" signedDate="" currentDate="11/04/2026" hideSignature />
</ApplicationPageExample> };
