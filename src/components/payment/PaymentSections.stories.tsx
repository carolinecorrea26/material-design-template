import type { Meta, StoryObj } from '@storybook/react-vite';
import { HealthAndSafetyRounded } from '@mui/icons-material';
import PaymentSections from './PaymentSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import TotalCostSummary from '../coverage/TotalCostSummary';
import { getSurfaceFields } from '../../config/fields/storedSurfaces';
import { paymentInfoOptInField, paymentMethodOptions, paymentFrequencyOptions } from '../../config/fields/paymentFields';
const meta = { id: "pages-payment-sections",
  title: "Components/Pages/Payment/Sections/Payment choices", component: PaymentSections, parameters: { standalone: true, layout: 'fullscreen', review: { scope: 'section-example', focus: 'Optional inspection of supplied product fields and costs. The production page owns participation and payment policy.', references: [{ label: 'Whole payment page', storyId: 'pages-payment-whole-page--empty' }] } } } satisfies Meta<typeof PaymentSections>;
export default meta;
function Example({ empty = false, deferred = false, bank = false }: { empty?: boolean; deferred?: boolean; bank?: boolean }) {
  return <SectionStoryForm fields={bank ? getSurfaceFields('paymentBank') : []} initialValues={{ 'payment-information-opt-in': 'no', ...(bank ? { 'payment-method:life': 'bank-account' } : {}) }}>{props => <PaymentSections {...props} showPaymentQuestions={!deferred || props.watchedValues['payment-information-opt-in'] === 'yes'} optInField={deferred ? paymentInfoOptInField : undefined} bankFields={bank ? getSurfaceFields('paymentBank') : []} categories={empty ? [] : [{ id: 'LI', label: 'Life insurance', icon: HealthAndSafetyRounded, products: [{ id: 'life', name: 'Term Life', quickDecision: false, methodField: { id: 'payment-method:life', label: 'Payment method', inputType: 'radio', required: true, options: [...paymentMethodOptions] }, frequencyField: { id: 'payment-frequency:life', label: 'Payment frequency', inputType: 'radio', required: true, options: [...paymentFrequencyOptions] }, costs: <TotalCostSummary items={[{ id: 'life', name: 'Self', amount: 20 }]} total={20} /> }] }]} />}</SectionStoryForm>;
}
export const Default: StoryObj = { render: () => <Example /> };
export const NoProducts: StoryObj = { render: () => <Example empty /> };
export const OptionalCollection: StoryObj = { render: () => <Example deferred /> };

export const BankAccountDetails: StoryObj = { render: () => <Example bank /> };
