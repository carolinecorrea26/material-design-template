import type { Meta, StoryObj } from '@storybook/react-vite';
import Membership from '../../pages/Membership';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
const meta = { id: "pages-membership-whole-page",
  title: "Components/Pages/Membership/Whole page", component: Membership, loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Membership>;
export default meta;
const example = (membershipValue: string, membership?: ApplicationPageScenario['membership']): StoryObj => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ capability: 'standard', membership, description: 'Fresh-start membership composition and outcome conditions. Synthetic configuration assignments and answers remain local to this example.', values: { membership: membershipValue } }}><Membership /></ApplicationPageExample> });
export const StandardMembership = example('');
export const MemberConfirmed = example('yes');
export const NotAMember = example('no');
export const AssociationSelection = example('', { configuration: 'association' });
export const NewOrCurrentMembership = example('new', { configuration: 'new-or-current' });
export const CategoryMembership = example('professional', { configuration: 'category', options: [
  { value: 'professional', label: 'Professional member', outcome: 'member' },
  { value: 'joining', label: 'Joining the association', outcome: 'new-member' },
] });
