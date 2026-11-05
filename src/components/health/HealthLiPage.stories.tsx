import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthLi from '../../pages/HealthLi';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('li');
const adults = healthPageScenario('li', true);

const meta = {
  id: "pages-health-life",
  title: "Components/Pages/Health/Whole page/Life",
  component: HealthLi,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Life production page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthLi>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthLi /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthLi /></ApplicationPageExample>,
};

const fullSource = {
  ...adults, capability: 'employmentMembership' as const,
  description: 'Configured full Life source questionnaire for both adults. Pregnancy and other follow-ups use each adult’s saved facts. Processing and question participation remain separate.',
  values: { ...adults.values, membership: 'current', gender: 'male', 'spouse-gender': 'female', coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member', 'spouse'] }, coverageAmounts: { 'li-group-term:member': 100000, 'li-group-term:spouse': 50000 } },
};
export const FullSourceQuestionnaire: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={fullSource}><HealthLi /></ApplicationPageExample>,
};
