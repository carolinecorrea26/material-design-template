import type { Meta, StoryObj } from '@storybook/react-vite';
import Eligibility from '../../pages/Eligibility';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const meta = { id: 'pages-eligibility-whole-page', title: 'Components/Pages/Eligibility/Whole page', component: Eligibility,
  loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen', catalog: { pages: { Member: 'eligibility' } } },
} satisfies Meta<typeof Eligibility>;
export default meta;
const example = (dependents: string[] = [], eligibility?: ApplicationPageScenario['eligibility']): StoryObj => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog}
  scenario={{ capability: 'standard', eligibility, description: 'Eligibility uses the compiled section composition, covered people, repeated child fields and effective Site settings.', values: {
    membership: 'yes', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1990-01-15',
    'zip-postal-code': '10001', 'state-province': 'NY', dependents,
    ...(dependents.includes('spouse') ? { 'spouse-membership': 'yes', 'spouse-first-name': 'Alex', 'spouse-last-name': 'Rivera', 'spouse-birth-date': '1991-01-15' } : {}),
    ...(dependents.includes('child') ? { children: [{ 'child-first-name': 'Avery', 'child-last-name': 'Rivera', 'child-birth-date': '2015-05-14', 'child-gender': 'female', 'child-full-time-student': 'yes' }] } : {}),
  } }}><Eligibility /></ApplicationPageExample> });
export const Member = example();
export const MemberAndSpouse = example(['spouse']);
export const MemberAndChild = example(['child']);
export const NoticeOnlyChildren = example(['child'], { childMode: 'notice-only' });
export const ApplicantOnly = example(['spouse', 'child'], { coveredPeople: ['self'] });
