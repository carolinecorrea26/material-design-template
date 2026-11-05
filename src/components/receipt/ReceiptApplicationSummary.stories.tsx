import type { Meta, StoryObj } from '@storybook/react-vite';
import ReceiptApplicationSummary from './ReceiptApplicationSummary';
import EstimatedRate from '../coverage/EstimatedRate';
const meta = { title: 'Components/Pages/Receipt/Sections/Application receipt', component: ReceiptApplicationSummary, parameters: { standalone: true, layout: 'padded' } } satisfies Meta<typeof ReceiptApplicationSummary>;
export default meta;
export const MixedPaymentChoices: StoryObj = { render: () => <ReceiptApplicationSummary items={[
  { id: 'life', productName: 'Group Term Life Insurance', applicantLabel: 'You', applicant: 'member', requestedAmount: 100000, estimatedPayment: <EstimatedRate amount={10} appearance="summary" suffix="/mo" />, paymentMethod: 'Bank account' },
  { id: 'term20', productName: 'Group 20-Year Level Term Life Insurance', applicantLabel: 'You', applicant: 'member', requestedAmount: 200000, estimatedPayment: <EstimatedRate amount={240} appearance="summary" suffix="/yr" />, paymentMethod: 'Bill me' },
]} /> };
export const PaymentNotSelected: StoryObj = { render: () => <ReceiptApplicationSummary items={[
  { id: 'life', productName: 'Group Term Life Insurance', applicantLabel: 'You', applicant: 'member', requestedAmount: 100000, estimatedPayment: <EstimatedRate display={{ status: 'provided-separately' }} appearance="summary" /> },
]} /> };
