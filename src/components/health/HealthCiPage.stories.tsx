import type { Meta, StoryObj } from '@storybook/react-vite';
import HealthCi from '../../pages/HealthCi';
import ApplicationPageExample from '../../../.storybook/applicationPageExample';
import { healthPageScenario } from '../../../.storybook/healthPageScenario';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const member = healthPageScenario('ci');
const adults = healthPageScenario('ci', true);

const meta = {
  id: "pages-health-critical-illness",
  title: "Components/Pages/Health/Whole page/Critical Illness",
  component: HealthCi,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Health page participation, question order, independent adult answers, restored details, validation and help. Review shared controls through their canonical examples.', references: [{ label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Question grouping', storyId: 'forms-health-question-list--member-and-spouse' }, { label: 'Answer and detail controls', storyId: 'forms-health-question--repeated-details' }] }, docs: { description: { component: 'Critical Illness production page in the shared application frame, with fictional answers and local navigation.' } } },
} satisfies Meta<typeof HealthCi>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MemberOnly: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={member}><HealthCi /></ApplicationPageExample>,
};

export const MemberAndSpouse: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={adults}><HealthCi /></ApplicationPageExample>,
};

export const CaliforniaWording: Story = {
  render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ ...member, description: 'California CI uses the supplied Substance Abuse wording instead of the standard alcohol/drug question. Tobacco is collected on Coverage.', values: { ...member.values, state: 'CA', 'state-province': 'CA' } }}><HealthCi /></ApplicationPageExample>,
};
