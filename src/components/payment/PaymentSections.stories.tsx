import { paymentDefaultSections } from '../../config/fields/paymentFields';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HealthAndSafetyRounded } from '@mui/icons-material';
import PaymentSections from './PaymentSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import TotalCostSummary from '../coverage/TotalCostSummary';
import { resolveMappedFields } from '../../domain/requirementFields';
const fields = resolveMappedFields({ page: 'payment' });
const source = (id: string) => fields.find(field => field.id === id)!;
const bankFields = fields.filter(field => field.id.startsWith('bank-'));
const methodField = { ...source('payment-method'), id: 'payment-method:life', options: source('payment-method').options!.filter(option => option.value !== 'credit-card') };
const frequencyField = { ...source('payment-frequency'), id: 'payment-frequency:life' };
const meta = { id: "pages-payment-sections",
  title: "Components/Pages/Payment/Sections/Payment choices", component: PaymentSections, parameters: { standalone: true, layout: 'fullscreen', review: { scope: 'section-example', focus: 'Optional inspection of supplied product fields and costs. The production page owns participation and payment policy.', references: [{ label: 'Whole payment page', storyId: 'pages-payment-whole-page--empty' }] } } } satisfies Meta<typeof PaymentSections>;
export default meta;
function Example({ empty = false, deferred = false, bank = false }: { empty?: boolean; deferred?: boolean; bank?: boolean }) {
  return <SectionStoryForm sections={paymentDefaultSections} fields={fields} initialValues={{ 'payment-information-opt-in': 'no', ...(bank ? { 'payment-method:life': 'bank-account' } : {}) }}>{props => <PaymentSections {...props} showPaymentQuestions={!deferred || props.watchedValues['payment-information-opt-in'] === 'yes'} optInField={deferred ? source('payment-information-opt-in') : undefined} bankFields={bank ? bankFields : []} categories={empty ? [] : [{ id: 'LI', label: 'Life insurance', icon: HealthAndSafetyRounded, products: [{ id: 'life', name: 'Term Life', quickDecision: false, methodField: methodField, frequencyField: frequencyField, costs: <TotalCostSummary showItems={false} items={[{ id: 'life', name: 'Self', amount: 20 }]} total={20} /> }] }]} />}</SectionStoryForm>;
}
export const Default: StoryObj = { render: () => <Example /> };
export const NoProducts: StoryObj = { render: () => <Example empty /> };
export const OptionalCollection: StoryObj = { render: () => <Example deferred /> };

export const BankAccountDetails: StoryObj = { render: () => <Example bank /> };
