import type { Meta, StoryObj } from '@storybook/react-vite';
import Membership from '../../pages/Membership';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
const meta = { id: "pages-membership-whole-page",
  title: "Components/Pages/Membership/Whole page", component: Membership, loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Membership>;
export default meta;
const example = (capability: ApplicationPageScenario['capability'], membership: string): StoryObj => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ capability, description: 'Global template membership variation. Configured choices control the shared follow-up sections; answers and navigation remain local to this example.', values: { membership } }}><Membership /></ApplicationPageExample> });
export const StandardMembership = example('standard', 'yes');
export const ProfessionalMembership = example('physicianMembership', 'spouse');
export const NewMembership = example('employmentMembership', 'new');
export const CurrentMembership = example('employmentMembership', 'current');
export const MembershipStatusAndReferral = example('membershipStatus', 'yes');
