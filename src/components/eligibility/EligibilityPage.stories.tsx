import type { Meta, StoryObj } from '@storybook/react-vite';
import Eligibility from '../../pages/Eligibility';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const meta = { id: 'pages-eligibility-whole-page', title: 'Components/Pages/Eligibility/Whole page', component: Eligibility,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen', catalog: { pages: { Member: 'eligibility' } } },
} satisfies Meta<typeof Eligibility>;
export default meta;
const example = (spouse = false): StoryObj => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog}
  scenario={{ capability: 'standard', description: 'Complete real Eligibility page with independent applicant values and configured sections.', values: {
    membership: 'yes', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1990-01-15',
    'zip-postal-code': '10001', 'state-province': 'NY', dependents: spouse ? ['spouse'] : [],
    ...(spouse ? { 'spouse-first-name': 'Alex', 'spouse-last-name': 'Rivera', 'spouse-birth-date': '1991-01-15' } : {}),
  } }}><Eligibility /></ApplicationPageExample> });
export const Member = example();
export const MemberAndSpouse = example(true);
