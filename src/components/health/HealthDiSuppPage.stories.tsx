import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthDiSupp from '../../pages/HealthDiSupp';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('di');
const adults = healthPageScenario('di', true);

const meta = {
  id: "pages-health-di-supp",
  title: "Components/Pages/Health/Whole page/DI SUPP",
  component: HealthDiSupp,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { catalog: { pages: { MemberOnly: 'health-di-supp' } }, layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Disability supplemental page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthDiSupp>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthDiSupp /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthDiSupp /></ApplicationPageExample>,
};

const supplemental: ApplicationPageScenario = {
  ...member,
  description: 'Synthetic configured variant uses the seven authored Disability questions plus a direct supplemental details field. This demonstrates the configured layout without activating another Site.',
  health: { page: 'health-di-supp', product: 'di-ltd', questionnaire: 'disability' },
};
export const SupplementalQuestionnaire: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={supplemental}><HealthDiSupp /></ApplicationPageExample>,
};
