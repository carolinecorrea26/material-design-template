import { useLayoutEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useSearchParams } from 'react-router-dom';
import Resume from '../../pages/Resume';
import ResumeMethod from '../../pages/ResumeMethod';
import ResumeCode from '../../pages/ResumeCode';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const scenario: ApplicationPageScenario = { capability: 'standard', description: 'Recovery pages with fictional query parameters; delivery and verification require a real local recovery session.', values: {} };
type State = 'email' | 'method' | 'missing-method' | 'code' | 'phone' | 'expired' | 'missing-code';

/** Set router-local inputs before mounting the actual page. No recovery request is made on mount. */
function RecoveryPage({ state }: { state: State }) {
  const [search, setSearch] = useSearchParams();
  const [expectedSearch, setExpectedSearch] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (expectedSearch !== null) return;
    const query = new URLSearchParams();
    if (!state.startsWith('missing') && state !== 'email') {
      query.set('site', getPrototypeLibrary()!.site.siteKey);
      query.set('applicationId', 'example-saved-application');
      query.set('recipient', 'returning.user@example.com');
      query.set('recoveryId', 'example-recovery');
      query.set('token', 'fictional-review-token');
      query.set('method', state === 'phone' ? 'text' : 'email');
      if (state === 'phone') query.set('deliveryTarget', '***-***-1234');
      query.set('codeExpiresAt', String(state === 'expired' ? 1 : Date.now() + 300000));
    }
    setSearch(query, { replace: true });
    setExpectedSearch(query.toString());
  }, [state, setSearch, expectedSearch]);
  if (expectedSearch === null || search.toString() !== expectedSearch) return null;
  if (state === 'email') return <Resume />;
  if (state === 'method' || state === 'missing-method') return <ResumeMethod />;
  return <ResumeCode />;
}

const meta = {
  id: "pages-resume-whole-page",
  title: "Components/Pages/Resume/Whole page",
  render: ({ state }: { state: State }, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><RecoveryPage state={state} /></ApplicationSessionContext.Provider></ApplicationPageExample>,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: {
    layout: 'fullscreen',
    catalog: { pages: { EmailRequest: 'resume', DeliveryMethod: 'resume-method', EmailCode: 'resume-code' } },
    review: {
      scope: 'page-composition',
      focus: 'Review email entry, delivery choices, code guidance, expiry, and missing-link feedback. Fictional tokens do not authorize recovery. Sending, resending, and verifying require the local mock service and an actual saved application.',
      references: [{ label: 'Shared expiry and resend controls', storyId: 'feedback-resume-expiration--active-link' }],
    },
  },
} satisfies Meta<{ state: State }>;
export default meta;
const example = (state: State, description: string): StoryObj<typeof meta> => ({
  args: { state },
  parameters: { docs: { description: { story: description } } },
});

export const EmailRequest = example('email', 'Email-only entry with Back and required/email validation. A session-saved recipient may be prefilled by the real page.');
export const DeliveryMethod = example('method', 'Saved delivery choices; Next requires a selection and the mock platform. The supplied token is fictional.');
export const MissingMethodLink = example('missing-method', 'Missing recovery parameters show guidance and disable Next.');
export const EmailCode = example('code', 'Email recipient, six-digit code field, countdown and resend placement.');
export const PhoneCode = example('phone', 'Phone delivery uses a masked target and the same code binding.');
export const ExpiredCode = example('expired', 'An expired code disables entry and verification while retaining resend actions.');
export const MissingCodeLink = example('missing-code', 'Missing recovery parameters show guidance and prevent verification.');
