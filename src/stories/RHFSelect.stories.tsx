import type { Meta, StoryObj } from '@storybook/react';
import RHFSelect from '../components/form/RHFSelect';
import { FormProvider, useForm } from 'react-hook-form';

const meta = {
  title: 'Form/RHFSelect',
  component: RHFSelect,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RHFSelect>;

export default meta;
type Story = StoryObj<typeof RHFSelect>;

const RHFSelectWithForm = (args: {
  name: string;
  label: string;
  options: Array<{ label: string; value: string | number }>;
  required?: boolean;
}) => {
  const methods = useForm({
    defaultValues: {
      state: '',
      coverage: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <RHFSelect {...args} />
    </FormProvider>
  );
};

export const Default: Story = {
  render: (args) => <RHFSelectWithForm {...args} />,
  args: {
    name: 'state',
    label: 'State',
    options: [
      { label: 'California', value: 'CA' },
      { label: 'New York', value: 'NY' },
      { label: 'Texas', value: 'TX' },
      { label: 'Florida', value: 'FL' },
    ],
  },
};

export const Required: Story = {
  render: (args) => <RHFSelectWithForm {...args} />,
  args: {
    name: 'coverage',
    label: 'Coverage Type',
    options: [
      { label: 'Basic', value: 'basic' },
      { label: 'Premium', value: 'premium' },
      { label: 'Gold', value: 'gold' },
    ],
    required: true,
  },
};

export const WithNumbers: Story = {
  render: (args) => <RHFSelectWithForm {...args} />,
  args: {
    name: 'amount',
    label: 'Coverage Amount',
    options: [
      { label: '$100,000', value: 100000 },
      { label: '$250,000', value: 250000 },
      { label: '$500,000', value: 500000 },
      { label: '$1,000,000', value: 1000000 },
    ],
  },
};