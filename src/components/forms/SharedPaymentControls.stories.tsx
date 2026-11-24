import type { Meta, StoryObj } from '@storybook/react-vite';
import SharedPaymentControls from './SharedPaymentControls';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { sharedPaymentState, type SharedPaymentProduct } from '../../domain/sharedPaymentChoices';
import { resolveMappedFields } from '../../domain/requirementFields';
const fields = resolveMappedFields({page: 'payment'});
const source = (id: string) => fields.find(field => field.id === id)!;

const methods = ['bank-account', 'bill-me'].map(value => source('payment-shared-method').options!.find(option => option.value === value)!);
const frequencies = source('payment-shared-frequency').options!.filter(option => ['monthly', 'annually'].includes(option.value));
const products: SharedPaymentProduct[] = ['life', 'disability'].map(productKey => ({ productKey, methods, frequenciesByMethod: { 'bank-account': frequencies, 'bill-me': [frequencies[0]] } }));
const field = (id: string, options: typeof methods) => ({ ...source(id.includes('frequency') ? 'payment-shared-frequency' : 'payment-shared-method'), id, options });
const meta = { id: "forms-shared-payment-controls",
  title: "Components/Pages/Payment/Sections/Combined payment choices", component: SharedPaymentControls, parameters: { standalone: true, review: { scope: 'shared-component', focus: 'One method/frequency for multiple products; common-choice restrictions and propagation into independent product bindings.' } } } satisfies Meta<typeof SharedPaymentControls>;
export default meta;
function Example({ incompatible = false, methodOnly = false }: { incompatible?: boolean; methodOnly?: boolean }) {
  return <SectionStoryForm fields={[]} initialValues={{ 'payment-method:all': 'bank-account', 'payment-frequency:all': 'annually' }}>{props => {
    const entries = incompatible ? [products[0], { ...products[1], methods: [methods[1]] }] : products;
    const state = sharedPaymentState(entries, props.watchedValues, { allowSharedMethod: true, allowSharedFrequency: !methodOnly });
    return <SharedPaymentControls {...props} state={state} methodField={field('payment-method:all', state.methodOptions)} frequencyField={field('payment-frequency:all', state.frequencyOptions)} />;
  }}</SectionStoryForm>;
}
export const SharedMethodAndFrequency: StoryObj = { render: () => <Example /> };
export const SharedMethodOnly: StoryObj = { render: () => <Example methodOnly /> };
export const RestrictedCommonChoices: StoryObj = { render: () => <Example incompatible /> };
export const NoCommonMethod: StoryObj = { render: () => <SectionStoryForm fields={[]}>{props => <SharedPaymentControls {...props} state={sharedPaymentState([{ ...products[0], methods: [] }], {}, { allowSharedMethod: true, allowSharedFrequency: true })} methodField={field('payment-method:all', [])} frequencyField={field('payment-frequency:all', [])} />}</SectionStoryForm> };
