import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthDi from '../../pages/HealthDi';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('di');
const adults = healthPageScenario('di', true);

const meta = {
  id: "pages-health-disability",
  title: "Components/Pages/Health/Whole page/Disability",
  component: HealthDi,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Disability production page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthDi>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthDi /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthDi /></ApplicationPageExample>,
};

const supplemental = {
  ...member, capability: 'employmentMembership' as const,
  description: 'Configured eight-question supplemental DI form for QD Life plus FUW Disability. Yes reveals source-specific detail fields and record dialogs.',
  values: { ...member.values, membership: 'current', gender: 'male', 'birth-date': '1976-01-01', coverageSelections: ['li-group-term', 'di-short-term'], productApplicants: { 'li-group-term': ['member'], 'di-short-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000, 'di-short-term:member': 1000 } },
};
export const SupplementalQuestionnaire: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={supplemental}><HealthDi /></ApplicationPageExample>,
};
