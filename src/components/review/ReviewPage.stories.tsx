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
// Synthetic policy variations exercise global capabilities without activating another Site.
const sourceReferences = ['Synthetic Storybook Review configuration'];
const notice = { blocks: [{ key: 'example-dividend', title: 'Dividend notice', paragraphs: ['Example dividend notice for inspecting a configured election.'], fields: ['dividend-acknowledgement', 'dividend-first-name', 'dividend-last-name', 'dividend-birth-date'], sourceReferences }] } satisfies NonNullable<ApplicationPageScenario['review']>;
const applicantType = { applicantType: true };
const jurisdictionNotice = { blocks: [{ key: 'example-jurisdiction', title: 'Jurisdiction notice', paragraphs: ['Example configured NY notice before consent.'], fields: [], placement: 'before-consent', when: { jurisdictions: ['NY'] }, sourceReferences }] } satisfies NonNullable<ApplicationPageScenario['review']>;
const certification = { blocks: [{ key: 'example-certification', title: 'Certification', paragraphs: ['Example configured guaranteed-issue certification.'], fields: [], sourceReferences }] } satisfies NonNullable<ApplicationPageScenario['review']>;
const payroll = { blocks: [{ key: 'example-payroll', title: 'Payroll authorization', paragraphs: ['Example configured payroll authorization.'], fields: [], when: { products: ['di-ltd'] }, sourceReferences }] } satisfies NonNullable<ApplicationPageScenario['review']>;
const scenarios = {
  empty: { capability: 'standard', description: 'Review the production page, document edit actions, Read and Sign, Electronic Consent and unchecked member consent. Next runs real coverage/policy and required-field validation.', values: baseValues },
  accepted: { capability: 'standard', description: 'Restored member consent. Inspect checked state and continue; navigation ends at a local completion message.', values: { ...baseValues, 'review-self-consent': true } },
  spouse: { capability: 'standard', description: 'Member and spouse have independent consent fields. The document uses the selected adult coverages and saved answers.', values: { ...baseValues, dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 } } },
  dividend: { capability: 'standard', review: notice, description: 'Synthetic configured dividend notice and election/identity fields stay within Read and Sign. Next requires the applicable block fields.', values: baseValues },
  missingType: { capability: 'standard', review: applicantType, description: 'Synthetic applicant-type policy: a missing applicant type prevents resolved consent wording. Next reports the policy prerequisite instead of silently choosing an opening.', values: { ...baseValues, membership: '', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } } },
  jurisdiction: { capability: 'standard', review: jurisdictionNotice, description: 'Synthetic NY jurisdiction-specific notices and before-consent wording use the saved configuration. Inspect placement within the two existing legal sections.', values: { ...baseValues, membership: 'yes', 'state-province': 'NY', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } } },
  gi: { capability: 'standard', review: certification, description: 'Synthetic guaranteed-issue certification appears inside Read and Sign. It does not create a third legal section.', values: { ...baseValues, coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } } },
  payroll: { capability: 'standard', review: payroll, description: 'Synthetic disability payroll authorization stays inside Read and Sign before Electronic Consent and the member acknowledgement.', values: { ...baseValues, 'state-province': 'NY', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } } },
  advisor: { capability: 'standard', description: 'Advisor-prepared application: editing a document section requests return to the advisor. Cancel leaves the page; confirmation navigates locally. No email is sent by this example.', values: baseValues, advisor: true },
  locked: { capability: 'standard', description: 'Submitted-review state removes document edit actions. This local scenario does not read or modify the browser application-session storage.', values: { ...baseValues, 'review-self-consent': true }, submitted: true },
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

export const WithoutHealthQuestions = example({ ...scenarios.accepted, review: { withoutHealthQuestions: true }, description: 'Synthetic source page participation omits health questions. Remaining steps show Payment and DocuSign only.' });

export const SpouseOnly = example({ ...scenarios.spouse, values: { ...scenarios.spouse.values, productApplicants: { 'li-term': ['spouse'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:spouse': 50000 } }, description: 'Dependent-only application: the member/application owner still acknowledges; the actively applying spouse also acknowledges. Stale removed-product applicants do not add acknowledgements.' });

export const ImportantNoticeNewMexico = example({ ...scenarios.accepted, values: { ...scenarios.accepted.values, 'state-province': 'NM' }, description: 'The shared Important Notice viewer includes the MCR New Mexico protected-person and confidential-abuse paragraphs only for NM residence.' });
export const ImportantNoticeVirginia = example({ ...scenarios.accepted, values: { ...scenarios.accepted.values, 'state-province': 'VA' }, description: 'VA residence selects the MCR Virginia authorization and Important Notice document through the same shared viewer.' });

export const ConnecticutDisability = example({ ...scenarios.accepted, values: { ...baseValues, 'state-province': 'CT', coverageSelections: ['di-ltd'], productApplicants: { 'di-ltd': ['member'] }, coverageAmounts: { 'di-ltd:member': 1000 } }, description: 'MCR adult DI sets the underwriting flag even without online health questions. Medical authorization/underwritten consent appear; CT warning is immediately above the owner acknowledgement.' });
export const NewYorkAccidentOnly = example({ ...scenarios.accepted, values: { ...baseValues, 'state-province': 'NY', coverageSelections: ['li-add'], productApplicants: { 'li-add': ['member'] }, coverageAmounts: { 'li-add:member': 100000 } }, description: 'Accident-only does not set the MCR underwriting flag; NY still requires its fraud notice for AD&D.' });
export const NewYorkChildOnlyLife = example({ ...scenarios.accepted, values: { ...baseValues, 'state-province': 'NY', dependents: ['child'], productApplicants: { 'li-term': ['child'] }, coverageAmounts: { 'li-term:child': 10000 } }, description: 'Child-only Life does not set the MCR underwriting flag. NY Life-only has no fraud notice; the owner acknowledgement remains.' });
