import advisorFixture from '../../../requirements/global/prototype-fixtures/advisor.json';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AdvisorLogin from '../../pages/AdvisorLogin';
import AdvisorSendConfirmation from '../../pages/AdvisorSendConfirmation';
import ApplicationEditConfirmation from '../../pages/ApplicationEditConfirmation';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const scenarios = {
  start: { capability: 'standard', description: 'Start an advisor-prepared application with the configured email, phone and code fields.', values: { 'advisor-flow-type': 'new' } },
  restored: { capability: 'standard', description: 'Fictional advisor details restored into the same configured fields.', values: { 'advisor-flow-type': 'new', 'advisor-email': 'advisor@example.com', 'advisor-phone': '2125550123', 'advisor-code': 'EXAMPLE' } },
  saved: { capability: 'standard', description: 'Continue an application using the independent applicant-email binding.', values: { 'advisor-flow-type': 'saved', 'applicant-email': 'jordan.rivera@example.com' } },
  sent: { capability: 'standard', savedApplicationAgeDays: advisorFixture.exampleSavedApplicationAgeDays, description: 'Sent confirmation with fictional applicant details and the original saved-application deadline.', values: { 'first-name': 'Jordan', 'last-name': 'Rivera', email: 'jordan.rivera@example.com' } },
  missing: { capability: 'standard', description: 'Missing applicant name and email use the existing em-dash fallbacks.', values: {} },
  edits: { capability: 'standard', description: 'Edit-request confirmation uses the saved advisor recipient, with live announcement and Return to Home.', values: { 'advisor-email': advisorFixture.email } },
} satisfies Record<string, ApplicationPageScenario>;
type Example = keyof typeof scenarios;

function AdvisorPage({ example }: { example: Example }) {
  if (example === 'sent' || example === 'missing') return <AdvisorSendConfirmation />;
  if (example === 'edits') return <ApplicationEditConfirmation />;
  return <AdvisorLogin />;
}
const meta = {
  id: "pages-advisor-whole-page",
  title: "Components/Pages/Advisor/Whole page",
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  render: ({ example }: { example: Example }, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenarios[example]}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><AdvisorPage example={example} /></ApplicationSessionContext.Provider></ApplicationPageExample>,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Advisor login uses fresh-start mode options, section conditions, notes and field presentation. Start and Continue remain local prototype routes; authentication and delivery are not connected.' } },
    catalog: { pages: { Start: 'advisor-login', SentToApplicant: 'advisor-send-confirmation', EditRequestSent: 'application-edit-confirmation' } },
    review: {
      scope: 'page-composition',
      focus: 'Review Start/Continue fields and restoration, confirmation details, fallback values and action placement. Login currently validates and routes locally; confirmation screens do not prove authentication or delivery.',
      references: [
        { label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' },
        { label: 'Send dialog', storyId: 'overlays-sendapplicationdialog--default' },
        { label: 'Return to advisor dialog', storyId: 'overlays-sendapplicationdialog--to-advisor' },
      ],
    },
  },
} satisfies Meta<{ example: Example }>;
export default meta;
const example = (key: Example): StoryObj<typeof meta> => ({ args: { example: key }, parameters: { router: { initialEntries: [key === 'edits' ? '/application-edit-confirmation' : key === 'sent' || key === 'missing' ? '/advisor-send-confirmation' : '/advisor-login'] }, docs: { description: { story: scenarios[key].description } } } });

export const Start = example('start');
export const RestoredAdvisorDetails = example('restored');
export const ContinueSaved = example('saved');
export const SentToApplicant = example('sent');
export const MissingApplicantDetails = example('missing');
export const EditRequestSent = example('edits');
