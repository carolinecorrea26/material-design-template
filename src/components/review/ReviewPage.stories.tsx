import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Review from '../../pages/Review';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

type ReviewScenario = ApplicationPageScenario & { advisor?: boolean; submitted?: boolean };
const baseValues = {
  membership: 'yes', gender: 'female', smoker: 'no', 'birth-date': '1990-01-01', 'zip-postal-code': '19103', 'state-province': 'PA',
  'first-name': 'Jordan', 'last-name': 'Morgan', email: 'jordan@example.org',
  'has-other-life-insurance': 'no', 'spouse-has-other-life-insurance': 'no',
  dependents: [], coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 },
};
const scenarios = {
  empty: { capability: 'multipleTerms', description: 'Review the production page, document edit actions, Read and Sign, Electronic Consent and unchecked member consent. Next runs real coverage/policy and required-field validation.', values: baseValues },
  accepted: { capability: 'multipleTerms', description: 'Restored member consent. Inspect checked state and continue; navigation ends at a local completion message.', values: { ...baseValues, 'review-self-consent': true } },
  spouse: { capability: 'multipleTerms', description: 'Member and spouse have independent consent fields. The document uses the selected adult coverages and saved answers.', values: { ...baseValues, dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 } } },
  dividend: { capability: 'optionalBeneficiaries', description: 'Saved dividend notice and election/identity fields stay within Read and Sign. Next requires the applicable block fields.', values: baseValues },
  missingType: { capability: 'physicianMembership', description: 'A missing applicant type prevents resolved consent wording. Next reports the policy prerequisite instead of silently choosing an opening.', values: { ...baseValues, membership: '', coverageSelections: ['sh-hospital-income'], productApplicants: { 'sh-hospital-income': ['member'] }, coverageAmounts: { 'sh-hospital-income:member': 100 } } },
  jurisdiction: { capability: 'employmentMembership', description: 'NY jurisdiction-specific notices and before-consent wording use the saved configuration. Inspect placement within the two existing legal sections.', values: { ...baseValues, membership: 'current', 'state-province': 'NY', coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000 } } },
  gi: { capability: 'membershipStatus', description: 'Guaranteed-issue certification appears inside Read and Sign. It does not create a third legal section.', values: { ...baseValues, coverageSelections: ['li-group-term'], productApplicants: { 'li-group-term': ['member'] }, coverageAmounts: { 'li-group-term:member': 100000 } } },
  payroll: { capability: 'occupationAndChildNotice', description: 'Disability payroll authorization stays inside Read and Sign before Electronic Consent and the member acknowledgement.', values: { ...baseValues, 'state-province': 'NY', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } } },
  advisor: { capability: 'multipleTerms', description: 'Advisor-prepared application: editing a document section requests return to the advisor. Cancel leaves the page; confirmation navigates locally. No email is sent by this example.', values: baseValues, advisor: true },
  locked: { capability: 'multipleTerms', description: 'Submitted-review state removes document edit actions. This local scenario does not read or modify the browser application-session storage.', values: { ...baseValues, 'review-self-consent': true }, submitted: true },
} satisfies Record<string, ReviewScenario>;

/** Explicit local workflow state so one scenario cannot lock or alter another. */
function LocalReviewSession({ scenario, children }: { scenario: ReviewScenario; children: ReactNode }) {
  const [reviewSubmitted, setSubmitted] = useState(scenario.submitted ?? false);
  const [advisorApplicantFlow, setAdvisorApplicantFlow] = useState(scenario.advisor ?? false);
  return <ApplicationSessionContext.Provider value={{ reviewSubmitted, advisorApplicantFlow, markReviewSubmitted: () => setSubmitted(true), setAdvisorApplicantFlow, resetApplicationSession: () => { setSubmitted(false); setAdvisorApplicantFlow(false); } }}>{children}</ApplicationSessionContext.Provider>;
}
const meta = {
  id: "pages-review-whole-page",
  title: "Components/Pages/Review/Whole page", component: Review,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: {
    layout: 'fullscreen', review: {
      scope: 'page-composition', focus: 'Review document placement/edit routing, saved legal wording and notice order, independent adult acknowledgements, validation and advisor/submitted states. Shared surfaces and controls retain their own examples.',
      references: [{ label: 'Shared application frame', storyId: 'application-patterns-application-page-template--standard-form-page' }, { label: 'Document preview', storyId: 'content-applicationdocumentpreview--with-edit-buttons' }, { label: 'Statement placement', storyId: 'forms-review-statement--before-consent-notice' }, { label: 'Disclosure surface', storyId: 'forms-legal-review-section--default' }],
    },
  },
} satisfies Meta<typeof Review>;
export default meta;
const example = (scenario: ReviewScenario): StoryObj<typeof meta> => ({ render: (_args, context) => <LocalReviewSession key={context.id} scenario={{ ...scenario, estimatedRates: true }}><ApplicationPageExample catalog={context.loaded.catalog as SharedCatalog} scenario={{ ...scenario, estimatedRates: true }}><Review /></ApplicationPageExample></LocalReviewSession> });
export const Empty = example(scenarios.empty);
export const RestoredConsent = example(scenarios.accepted);
export const MemberAndSpouse = example(scenarios.spouse);
export const DividendElection = example(scenarios.dividend);
export const MissingApplicantType = example(scenarios.missingType);
export const JurisdictionNotices = example(scenarios.jurisdiction);
export const GuaranteedIssue = example(scenarios.gi);
export const PayrollAuthorization = example(scenarios.payroll);
export const AdvisorEditRequest = example(scenarios.advisor);
export const LockedAfterReview = example(scenarios.locked);

export const WithoutHealthQuestions = example({ ...scenarios.gi, estimatedRates: true, description: 'The configured guaranteed-issue route continues to Payment and DocuSign without health questions.' });
