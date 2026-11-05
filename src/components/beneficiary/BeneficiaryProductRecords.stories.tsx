import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import BeneficiaryProductRecords from './BeneficiaryProductRecords';
import type { BeneficiaryItem } from './beneficiaryRecords';
const meta = { id: "pages-beneficiary-product-records",
  title: "Components/Pages/Beneficiary/Sections/Product records", component: BeneficiaryProductRecords, parameters: { standalone: true, layout: 'padded', docs: { description: { component: 'Explicit beneficiary records and action callbacks. Add/edit dialogs, allocation, copying and Site participation are exercised in Whole page.' } } } } satisfies Meta<typeof BeneficiaryProductRecords>;
export default meta;
const individual: BeneficiaryItem = { id: 'example', designation: 'primary', beneficiaryType: 'individual', firstName: 'Jordan', lastName: 'Morgan', relationship: 'Spouse', share: 100, trustName: '', trustDate: '' };
function Example({ initialItems = [] }: { initialItems?: BeneficiaryItem[] }) {
  const [items, setItems] = useState(initialItems), [action, setAction] = useState('');
  return <Box sx={{ maxWidth: 640 }}><BeneficiaryProductRecords productName="Example Term Life" items={items} onAdd={() => setAction('Add requested. See Whole page for the application editor.')} onEdit={() => setAction('Edit requested. See Whole page for the application editor.')} onRemove={id => setItems(items => items.filter(item => item.id !== id))} /><Typography role="status">{action}</Typography></Box>;
}
export const Empty: StoryObj = { render: () => <Example /> };
export const Individual: StoryObj = { render: () => <Example initialItems={[individual]} /> };
export const Trust: StoryObj = { render: () => <Example initialItems={[{ ...individual, beneficiaryType: 'trust', trustName: 'Example Family Trust', trustDate: '2020-01-01' }]} /> };
