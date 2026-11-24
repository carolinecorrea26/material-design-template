import type { Meta, StoryObj } from '@storybook/react-vite';
import Payment from '../../pages/Payment';
import { ApplicationSessionContext } from '../../app/ApplicationSessionContext';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';

const baseValues = {
  membership: 'yes', gender: 'female', smoker: 'no', 'birth-date': '1990-01-01', 'zip-postal-code': '19103', 'state-province': 'PA',
  'first-name': 'Jordan', 'last-name': 'Morgan', dependents: [],
  coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 },
};
const scenarios = {
  empty: { capability: 'multipleTerms', description: 'Optional payment with no answer: choose whether to provide payment information, then inspect applicable controls and validation.', values: baseValues },
  bank: { capability: 'multipleTerms', description: 'Restored bank method, frequency and fictional banking details. The real form restores policy-generated payment controls.', values: { ...baseValues, 'payment-information-opt-in': 'yes', 'payment-method:li-term': 'bank-account', 'payment-frequency:li-term': 'monthly', 'bank-name-on-account': 'Jordan Morgan', 'bank-institution': 'Example Bank', 'bank-authorization': true, 'bank-routing-number': '021000021', 'bank-account-number': '123456789' } },
  bill: { capability: 'multipleTerms', description: 'Bill me with the effective method/frequency policy. Banking fields stay hidden.', values: { ...baseValues, 'payment-information-opt-in': 'yes', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 50000 }, 'payment-method:li-term': 'bill-me', 'payment-frequency:li-term': 'monthly' } },
  optional: { payment: { requirement: 'optional' }, capability: 'multipleTerms', description: 'Optional payment: choose Yes to enter payment information or No to defer. The rate footnote remains visible.', values: { ...baseValues, 'payment-information-opt-in': 'no' } },
  optionalYes: { payment: { requirement: 'optional' }, capability: 'multipleTerms', description: 'Optional collection opted in: required product choices and banking details use the same controls as required collection.', values: { ...baseValues, 'payment-information-opt-in': 'yes', 'payment-method:li-term': 'bank-account', 'payment-frequency:li-term': 'monthly' } },
  spouse: { capability: 'multipleTerms', description: 'Member and spouse share the product payment election while their coverage amounts and cost rows remain separate.', values: { ...baseValues, 'payment-information-opt-in': 'yes', dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 50000 }, 'payment-method:li-term': 'bank-account', 'payment-frequency:li-term': 'monthly' } },
  shared: { capability: 'optionalBeneficiaries', description: 'Multiple products retain their independent payment elections under the saved configuration.', values: { ...baseValues, 'payment-information-opt-in': 'yes', coverageSelections: ['li-term', 'di-ltd'], productApplicants: { 'li-term': ['member'], 'di-ltd': ['member'] }, coverageAmounts: { 'li-term:member': 100000, 'di-ltd:member': 1000 } } },
  noProducts: { capability: 'multipleTerms', description: 'No applied-for products: inspect the existing return-to-coverage guidance.', values: { ...baseValues, 'payment-information-opt-in': 'yes', coverageSelections: [], productApplicants: {}, coverageAmounts: {} } },
} satisfies Record<string, ApplicationPageScenario>;
const meta = {
  id: "pages-payment-whole-page",
  title: "Components/Pages/Payment/Whole page", component: Payment,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', review: { scope: 'page-composition', focus: 'Review optional collection, restored product elections, shared payment controls, banking visibility, cost placement and help. Payment collects details and continues through the normal form navigation; no payment service is called.', references: [
    { label: 'Application frame', storyId: 'application-patterns-application-page-template--standard-form-page' },
    { label: 'Shared payment choices', storyId: 'forms-shared-payment-controls--shared-method-and-frequency' },
  ] } },
} satisfies Meta<typeof Payment>;
export default meta;
const example = (scenario: ApplicationPageScenario): StoryObj<typeof meta> => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={{ ...scenario, estimatedRates: true }}><ApplicationSessionContext.Provider value={{ reviewSubmitted: false, advisorApplicantFlow: false, markReviewSubmitted: () => {}, setAdvisorApplicantFlow: () => {}, resetApplicationSession: () => {} }}><Payment /></ApplicationSessionContext.Provider></ApplicationPageExample> });
export const Empty = example(scenarios.empty);
export const Required = example({ ...scenarios.empty, payment: { requirement: 'required' }, description: 'Required collection uses the same controls without the optional Yes/No question; a detached assignment preserves the effective Site setting.' });
export const RestoredBankAccount = example(scenarios.bank);
export const BillMe = example(scenarios.bill);
export const OptionalDeferred = example(scenarios.optional);
export const OptionalOptedIn = example(scenarios.optionalYes);
export const MemberAndSpouse = example(scenarios.spouse);
export const MultipleProducts = example(scenarios.shared);
export const NoProducts = example(scenarios.noProducts);

export const SharedChoices: StoryObj<typeof meta> = example({ ...scenarios.shared, description: 'Detached capability preview enabling shared method and frequency. Changing the shared choices updates both product bindings; saved Site settings remain unchanged.', payment: { sharedMethod: true, sharedFrequency: true } });

export const ProductNotes: StoryObj<typeof meta> = example({ ...scenarios.shared, payment: { notes: [
  { id: 'shared', productKeys: [], text: 'A configurable note shared across the selected products.' },
  { id: 'life', productKeys: ['li-term'], text: 'A configurable note for this product, such as billing-fee information.' },
] }, description: 'Shared and product-scoped notes are selected in a detached source assignment.' });

export const LockedFrequency: StoryObj<typeof meta> = example({ ...scenarios.empty, values: { ...baseValues, 'payment-information-opt-in': 'yes', 'payment-frequency:li-term': 'quarterly' }, payment: { products: { 'li-term': {
  collection: 'required', methods: [{ method: 'bank-account', frequencies: ['monthly'] }, { method: 'bill-me', frequencies: ['monthly'] }],
  defaultMethod: 'bank-account', defaultFrequency: 'monthly', frequencyLocked: true, synchronizeAcrossProducts: false,
} } }, description: 'An effective product policy locks the preselected frequency while allowing either configured method.' });
