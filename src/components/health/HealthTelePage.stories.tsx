import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthTele from '../../pages/HealthTele';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('li');
const adults = healthPageScenario('li', true);

const meta = {
  id: "pages-health-tele",
  title: "Components/Pages/Health/Whole page/TELE",
  component: HealthTele,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { catalog: { pages: { MemberOnly: 'health-tele' } }, layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Shared LI/DI/CI TELE page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthTele>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthTele /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthTele /></ApplicationPageExample>,
};

const fullSource: ApplicationPageScenario = {
  ...adults,
  description: 'Synthetic configured questionnaire replaces the default set with two authored Life questions. The first has repeatable details, the second has no follow-up. Member and spouse answers remain independent.',
  health: { page: 'health-tele', product: 'li-term', questionnaire: 'life' },
};
export const FullSourceQuestionnaire: Story = {
  name: 'Configured questionnaire',
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={fullSource}><HealthTele /></ApplicationPageExample>,
};

export const RestoredDetails: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ ...member,
    description: 'Restored Yes answer and saved condition details. No hides the list while retaining its saved values.',
    values: { ...member.values, 'health-li-q1': 'yes', 'health-li-q1-details': [{ onset: '01/2020', conditionsDetails: 'Saved local treatment record', physicianAddress: 'Example physician' }] } as unknown as ApplicationPageScenario['values'],
  }}><HealthTele /></ApplicationPageExample>,
};

export const CriticalIllnessQuestionnaire: Story = {
  name: 'CI telesupplement questionnaire',
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={healthPageScenario('ci', true)}><HealthTele /></ApplicationPageExample>,
};
const criticalIllness = healthPageScenario('ci');
export const CaliforniaWording: Story = {
  name: 'CI telesupplement — California wording',
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ ...criticalIllness, values: { ...criticalIllness.values, state: 'CA', 'state-province': 'CA' } }}><HealthTele /></ApplicationPageExample>,
};
