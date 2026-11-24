import type { Meta, StoryObj } from '@storybook/react-vite';
import { configuredComponent } from '../../domain/componentDisplayNames';
import Receipt from '../../pages/Receipt';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
import type { QdDecisionResult } from '../../utils/coverageDecisions';
const meta = { id: 'pages-receipt-whole-page', title: 'Components/Pages/Receipt/Whole page', component: Receipt,
 loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { catalog: { pages: { Received: 'receipt' } }, layout: 'fullscreen', docs: { description: { component: configuredComponent('ReceiptDecisions').description } } },
} satisfies Meta<typeof Receipt>;
export default meta;
const base = { 'payment-information-opt-in': 'yes', membership: 'yes', gender: 'female', smoker: 'no', 'state-province': 'PA', 'zip-postal-code': '19103', 'first-name': 'Jordan', 'last-name': 'Rivera', 'birth-date': '1990-01-15', 'mock-submission-id': 'APP-EXAMPLE-1234', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000 }, 'payment-method:li-10yr': 'bank-account', 'payment-frequency:li-10yr': 'monthly' };
function example(result: QdDecisionResult, values = {}, siteKey?: string, payment?: ApplicationPageScenario["payment"]): StoryObj<typeof meta> { return { render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ siteKey, payment, capability: 'multipleTerms', estimatedRates: true, description: 'Receipt outcome and selected payment details.', values: { ...base, qdDecisions: { 'li-10yr:member': result }, ...values } } as ApplicationPageScenario}><Receipt /></ApplicationPageExample> }; }
export const Received = example('conditionally-approved');
export const Referred = example('referred');
export const UnableToOffer = example('soft-declined');
export const ServiceUnavailable = example('database-unavailable');
export const MemberAndSpouse = example('conditionally-approved', { dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', 'spouse-gender': 'female', 'spouse-smoker': 'no', productApplicants: { 'li-10yr': ['member', 'spouse'] }, coverageAmounts: { 'li-10yr:member': 100000, 'li-10yr:spouse': 100000 }, qdDecisions: { 'li-10yr:member': 'conditionally-approved', 'li-10yr:spouse': 'referred' } });
export const MixedPaymentFrequencies = example('conditionally-approved', { coverageSelections: ['li-10yr', 'li-20yr'], productApplicants: { 'li-10yr': ['member'], 'li-20yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 100000, 'li-20yr:member': 200000 }, 'payment-method:li-20yr': 'bill-me', 'payment-frequency:li-20yr': 'annually', qdDecisions: { 'li-10yr:member': 'conditionally-approved', 'li-20yr:member': 'referred' } });
export const NoSelections = example('referred', { coverageSelections: [], productApplicants: {}, coverageAmounts: {} });

export const StandardReview: StoryObj<typeof meta> = { render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ capability: 'standard', estimatedRates: true, description: 'Configured fully-underwritten coverage sent for review.', values: { ...base, 'birth-date': '1963-01-01', coverageSelections: ['li-10yr'], productApplicants: { 'li-10yr': ['member'] }, coverageAmounts: { 'li-10yr:member': 700000 } } }}><Receipt /></ApplicationPageExample> };

export const WithRiderBenefit = example('conditionally-approved', { coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 }, coverageRiders: { 'li-term:cir:member': true }, coverageRiderAmounts: { 'li-term:cir:member': 50000 }, qdDecisions: { 'li-term:member': 'conditionally-approved' } });

export const MemberOnlyMixedProducts = example('conditionally-approved', { 'birth-date': '1963-01-01', coverageSelections: ['li-term', 'li-10yr'], productApplicants: { 'li-term': ['member'], 'li-10yr': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'li-10yr:member': 700000 }, 'payment-method:li-term': 'bank-account', 'payment-method:li-10yr': 'bill-me', qdDecisions: { 'li-term:member': 'conditionally-approved', 'li-10yr:member': 'conditionally-approved' } }, 'asce');
export const MemberAndSpouseMixedProducts = example('conditionally-approved', { 'birth-date': '1963-01-01', dependents: ['spouse'], 'spouse-birth-date': '1963-01-01', 'spouse-gender': 'female', 'spouse-smoker': 'no', coverageSelections: ['li-term', 'li-10yr'], productApplicants: { 'li-term': ['member', 'spouse'], 'li-10yr': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000, 'li-10yr:member': 700000, 'li-10yr:spouse': 700000 }, 'payment-method:li-term': 'bank-account', 'payment-method:li-10yr': 'bill-me', qdDecisions: { 'li-term:member': 'conditionally-approved', 'li-term:spouse': 'referred' } }, 'asce');

export const MissingResult = example('referred', { qdDecisions: {} });
export const NoPaymentInformation = example('referred', { 'payment-information-opt-in': 'no' }, undefined, { requirement: 'optional' });
